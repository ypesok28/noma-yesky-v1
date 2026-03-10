# Ollama Setup Instructions

This project uses Ollama LLM to process OCR-extracted text and convert it into structured JSON events.

## Prerequisites

1. **Install Ollama**: Download and install Ollama from [https://ollama.ai](https://ollama.ai)

2. **Install a Model**: Pull a model (recommended: llama3.2)
   ```bash
   ollama pull llama3.2
   ```

3. **Start Ollama**: Make sure Ollama is running
   ```bash
   ollama serve
   ```
   By default, Ollama runs on `http://localhost:11434`

## Environment Variables

Add these to your `.env.local` file (optional - defaults are provided):

```env
# Ollama Configuration (optional)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Or use NEXT_PUBLIC_ prefix for client-side access
NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434
NEXT_PUBLIC_OLLAMA_MODEL=llama3.2
```

## How It Works

1. **OCR Step**: User uploads a syllabus image
   - Uses Tesseract.js to extract raw text from the image
   - Returns unprocessed text

2. **LLM Step**: Raw text is sent to Ollama
   - Ollama processes the text with a structured prompt
   - Returns JSON array of events with:
     - `date`: ISO format date string
     - `time`: Optional time string
     - `description`: Event description
     - `subject`: Course name/code

3. **Display**: Events are displayed in a user-friendly format

## Testing

1. Make sure Ollama is running: `ollama serve`
2. Test the model: `ollama run llama3.2`
3. Upload a syllabus image at `/upload`
4. Check the browser console for any errors

## Troubleshooting

- **Connection Error**: Make sure Ollama is running on the correct port
- **Model Not Found**: Run `ollama pull llama3.2` to download the model
- **Slow Processing**: Larger models are slower but more accurate. Consider using a smaller model for faster results.
