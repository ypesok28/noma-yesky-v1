import { NextRequest, NextResponse } from 'next/server';
import { processWithOllama } from '@/app/utils/ollamaProcessor';

export async function POST(request: NextRequest) {
  try {
    const { rawText } = await request.json();

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { error: 'rawText is required and must be a string' },
        { status: 400 }
      );
    }

    const events = await processWithOllama(rawText);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Ollama API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process text with Ollama',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
