import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { gateway } from 'ai';
import type { ExtractedEvent } from '@/app/utils/ocrProcessor';

function parseCSVResponse(csvText: string): ExtractedEvent[] {
  const lines = csvText.trim().split('\n');
  const dataLines = lines.length > 1 ? lines.slice(1) : lines;

  return dataLines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current.trim());

      const [date, time, description, subject] = fields;
      return {
        date: date || '',
        time: time || undefined,
        description: description || 'Event',
        subject: subject || 'Unknown Subject',
      };
    })
    .filter((e) => e.date.length > 0);
}

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

    const prompt = `Look at this syllabus and extract all important dates, assignments, exams, and events.

Return ONLY a CSV with these columns: date,time,description,subject
- date: YYYY-MM-DD format
- time: time if mentioned (e.g. "3:00 PM"), leave empty if not mentioned
- description: what the event is (e.g. "Midterm Exam")
- subject: course name or code

Example:
date,time,description,subject
2024-01-15,3:00 PM,Midterm Exam,CS 101
2024-02-20,,Final Project Due,CS 101

If a field contains commas, wrap it in double quotes. If no subject is found, use context clues from the document.

Return only the CSV, no other text.`;

    const fileContent = isPDF
      ? { type: 'file' as const, data: `data:${mimeType};base64,${base64}`, mediaType: mimeType }
      : { type: 'image' as const, image: `data:${mimeType};base64,${base64}` };

    const { text } = await generateText({
      model: "openai/gpt-4o",
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

    const events = parseCSVResponse(text);

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
