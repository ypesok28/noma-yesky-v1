// @ts-ignore - tesseract.js types may not be available until package is installed
import Tesseract from 'tesseract.js';

export interface ExtractedEvent {
  date: string; // ISO date string
  time?: string;
  description: string;
  subject: string;
}

export interface RawOCRData {
  rawText: string;
}

/**
 * Process an image file and extract raw text using OCR
 */
export async function extractTextFromImage(file: File): Promise<string> {
  try {
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Process an image file and extract raw text
 */
export async function processSyllabusFile(file: File): Promise<RawOCRData> {
  console.log('Starting OCR processing...');
  const rawText = await extractTextFromImage(file);
  console.log('OCR Text extracted:', rawText.substring(0, 200));

  return { rawText };
}
