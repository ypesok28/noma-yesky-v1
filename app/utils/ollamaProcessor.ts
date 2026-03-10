import type { ExtractedEvent } from './ocrProcessor';

const getOllamaUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434';
  }
  return process.env.OLLAMA_URL || process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434';
};

const getOllamaModel = () => {
  return process.env.OLLAMA_MODEL || process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'llama3.2';
};

function parseCSVResponse(csvText: string): ExtractedEvent[] {
  const lines = csvText.trim().split('\n');
  // Skip the header row
  const dataLines = lines.length > 1 ? lines.slice(1) : lines;

  return dataLines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      // Parse CSV respecting quoted fields
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

/**
 * Send raw OCR text to Ollama LLM and get CSV response, parsed into events
 */
export async function processWithOllama(rawText: string): Promise<ExtractedEvent[]> {
  try {
    const prompt = `You are a helpful assistant that extracts calendar events from syllabus text.
Analyze the following text and extract all important dates, assignments, exams, and events.

Return ONLY a CSV with these columns: date,time,description,subject
- date: YYYY-MM-DD format
- time: time if mentioned (e.g. "3:00 PM"), leave empty if not mentioned
- description: what the event is (e.g. "Midterm Exam")
- subject: course name or code (e.g. "CS 101")

Example output:
date,time,description,subject
2024-01-15,3:00 PM,Midterm Exam,CS 101
2024-02-20,,Final Project Due,CS 101

If a field contains commas, wrap it in double quotes. If no subject is found, use context clues or "Unknown Subject".

Text to analyze:
${rawText}

Return only the CSV, no other text:`;

    const ollamaUrl = getOllamaUrl();
    const model = getOllamaModel();

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();

    let csvText = data.response || data.text || '';
    // Clean up markdown code blocks if present
    csvText = csvText.replace(/```csv\n?/g, '').replace(/```\n?/g, '').trim();

    return parseCSVResponse(csvText);
  } catch (error) {
    console.error('Ollama processing error:', error);
    throw new Error(`Failed to process text with Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
