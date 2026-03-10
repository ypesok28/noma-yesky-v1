import type { ExtractedEvent } from './ocrProcessor';

// Get Ollama URL from environment (works on both client and server)
const getOllamaUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use NEXT_PUBLIC env var
    return process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434';
  }
  // Server-side: can use regular env var or NEXT_PUBLIC
  return process.env.OLLAMA_URL || process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434';
};

const getOllamaModel = () => {
  return process.env.OLLAMA_MODEL || process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'llama3.2';
};

/**
 * Send raw OCR text to Ollama LLM and get structured JSON response
 */
export async function processWithOllama(rawText: string): Promise<ExtractedEvent[]> {
  try {
    const prompt = `You are a helpful assistant that extracts calendar events from syllabus text. 
Analyze the following text extracted from a syllabus document and extract all important dates, assignments, exams, and events.

Extract the following information for each event:
- date: The date in ISO format (YYYY-MM-DD)
- time: The time if mentioned (HH:MM format or "3:00 PM" format)
- description: A clear description of the event (e.g., "Midterm Exam", "Assignment 1 Due", "Project Presentation")
- subject: The course name or code (e.g., "CS 101", "MATH 200", "Introduction to Computer Science")

Return ONLY a valid JSON array of events in this exact format:
[
  {
    "date": "2024-01-15",
    "time": "3:00 PM",
    "description": "Midterm Exam",
    "subject": "CS 101"
  },
  {
    "date": "2024-02-20",
    "description": "Final Project Due",
    "subject": "CS 101"
  }
]

If no time is mentioned, omit the "time" field. If no subject/course is found, use "Unknown Subject" or use context clues to determine a general subject an example could be "Computer Science" or "Math".

Text to analyze:
${rawText}

Return only the JSON array, no other text:`;

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
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract JSON from response
    let jsonText = data.response || data.text || '';
    
    // Clean up the response - remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to extract JSON array from the response
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const events: ExtractedEvent[] = JSON.parse(jsonText);
    
    // Validate and clean the events
    return events.map((event) => ({
      date: event.date || '',
      time: event.time,
      description: event.description || 'Event',
      subject: event.subject || 'Unknown Subject',
    }));
  } catch (error) {
    console.error('Ollama processing error:', error);
    throw new Error(`Failed to process text with Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Combined function: Process OCR text and then send to Ollama for structured extraction
 */
export async function processOCRWithOllama(rawText: string): Promise<ExtractedEvent[]> {
  console.log('Sending to Ollama for processing...');
  const events = await processWithOllama(rawText);
  console.log(`Ollama extracted ${events.length} events`);
  return events;
}
