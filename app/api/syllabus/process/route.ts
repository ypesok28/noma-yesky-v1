import { NextRequest, NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import type { ExtractedEvent } from '@/app/utils/ocrProcessor';
import { alignToWeekday } from '@/app/utils/calendarEvents';

const DEFAULT_MODEL = 'openai/gpt-4o';

const WEEKDAY = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

const syllabusSchema = z.object({
  subject: z.string().describe('Course name or code, e.g. "Math C2210"'),
  scheduleTable: z
    .array(
      z.object({
        weekOf: z.string().describe('The date labeling this row, as YYYY-MM-DD (usually the Monday that starts the week)'),
        cells: z.array(
          z.object({
            weekday: WEEKDAY.describe('The column header this cell is under'),
            text: z.string().describe('The cell text, copied exactly'),
            isEvent: z
              .boolean()
              .describe('true for exams, quizzes, reviews, due dates, holidays, no-class days, first/last day of class (also when mixed with a topic, e.g. "Instruction Begins, 1.1"); false for cells that are only lecture topics'),
          })
        ),
      })
    )
    .describe('Every row of the weekly course schedule table, if there is one, including rows with only lecture topics. Empty array if there is no table.'),
  otherEvents: z
    .array(
      z.object({
        date: z.string().describe('YYYY-MM-DD'),
        time: z.string().nullable().describe('Start time if stated for this event, e.g. "3:00 PM". Otherwise null.'),
        description: z.string().describe('What the event is, e.g. "Last day to drop"'),
      })
    )
    .describe('Events with a specific date written in the text outside the schedule table (deadlines, final exam date, etc.).'),
});

const prompt = `Read this syllabus and fill in the schema.

- Use the year stated in the document (e.g. "Fall 2026"). All dates are YYYY-MM-DD.
- scheduleTable: transcribe the weekly schedule table row by row and cell by cell. Keep every non-empty cell, including lecture topics like "2.4 – 2.5", under the column it actually appears in. Use the row label exactly as the date; do not add days to it.
- otherEvents: only dates written out in the text, such as drop deadlines or "Final Exam: Tuesday, Dec 15, 2026". Do not guess dates for vague items like "due during the first week".`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/png';
    const isPDF = mimeType === 'application/pdf';

    const fileContent = isPDF
      ? { type: 'file' as const, data: `data:${mimeType};base64,${base64}`, mediaType: mimeType }
      : { type: 'image' as const, image: `data:${mimeType};base64,${base64}` };

    const { output } = await generateText({
      model: process.env.SYLLABUS_MODEL ?? DEFAULT_MODEL,
      output: Output.object({ schema: syllabusSchema }),
      messages: [
        {
          role: 'user',
          content: [
            fileContent,
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const subject = output?.subject || 'Unknown Subject';
    const candidates: ExtractedEvent[] = [];

    // Table cells: the model copies the row label and column; code does the date math
    for (const row of output?.scheduleTable ?? []) {
      for (const cell of row.cells) {
        if (!cell.isEvent || !cell.text.trim()) continue;
        candidates.push({
          date: alignToWeekday(row.weekOf, cell.weekday),
          description: cell.text.trim(),
          subject,
        });
      }
    }
    for (const e of output?.otherEvents ?? []) {
      candidates.push({
        date: e.date,
        time: e.time ?? undefined,
        description: e.description,
        subject,
      });
    }

    // The same event often appears in both the table and the text (e.g. the final)
    const seen = new Set<string>();
    const events = candidates
      .filter((e) => {
        const key = `${e.date}|${e.description.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // TODO: re-add DB insert once auth is wired up

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Process API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process syllabus',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
