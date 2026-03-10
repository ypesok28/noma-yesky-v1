"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { processSyllabusFile } from "@/app/utils/ocrProcessor";
import type { ExtractedEvent } from "@/app/utils/ocrProcessor";

export function SyllabusUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [llmProgress, setLlmProgress] = useState(0);
  const [events, setEvents] = useState<ExtractedEvent[]>([]);
  const [rawText, setRawText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (selectedFile.type === 'application/pdf') {
        setError('PDF files are not yet supported. Please convert your PDF to an image (JPEG, PNG) and upload that instead.');
        return;
      }
      if (!validImageTypes.includes(selectedFile.type)) {
        setError('Please upload a valid image file (JPEG, PNG, WebP)');
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
      setEvents([]);
      setRawText("");
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setOcrProgress(0);
    setLlmProgress(0);
    setError(null);

    try {
      // Step 1: OCR - Extract raw text
      setOcrProgress(10);
      const ocrData = await processSyllabusFile(file);
      setRawText(ocrData.rawText);
      setOcrProgress(100);

      // Step 2: Send to Ollama via API route
      setLlmProgress(10);
      const response = await fetch('/api/ollama/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawText: ocrData.rawText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process with Ollama');
      }

      setLlmProgress(50);
      const data = await response.json();
      setLlmProgress(100);
      setEvents(data.events || []);

      if (!data.events || data.events.length === 0) {
        setError('No events found in the document. The LLM may not have detected any dates or events.');
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Failed to process file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (droppedFile.type === 'application/pdf') {
        setError('PDF files are not yet supported. Please convert your PDF to an image (JPEG, PNG) and upload that instead.');
        return;
      }
      if (validImageTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
        setError(null);
        setEvents([]);
        setRawText("");
      } else {
        setError('Please upload a valid image file (JPEG, PNG, WebP)');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          file
            ? "border-blue-400 bg-blue-50"
            : "border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!file ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Upload Your Syllabus
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Choose File
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                Supports: JPEG, PNG, WebP (Max 10MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-600">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="flex gap-3 justify-center mt-4">
                <Button
                  onClick={() => {
                    setFile(null);
                    setEvents([]);
                    setRawText("");
                    setError(null);
                  }}
                  variant="outline"
                  className="border-blue-200 text-gray-700 hover:bg-blue-50"
                >
                  Remove
                </Button>
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isProcessing ? "Processing..." : "Extract Events"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bars */}
      {isProcessing && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>OCR Processing</span>
              <span>{ocrProgress}%</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>LLM Processing (Ollama)</span>
              <span>{llmProgress}%</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${llmProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Raw Text Preview (Collapsible) */}
      {rawText && (
        <details className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
            View Raw OCR Text
          </summary>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto mt-2">
            {rawText.substring(0, 1000)}{rawText.length > 1000 ? '...' : ''}
          </pre>
        </details>
      )}

      {/* Extracted Events */}
      {events.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">
            Extracted Events ({events.length})
          </h3>
          <div className="space-y-3">
            {events.map((event, index) => (
              <div
                key={index}
                className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {event.time && (
                          <p className="text-sm text-gray-600">{event.time}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-13 space-y-1">
                      <p className="font-semibold text-gray-900">
                        {event.description}
                      </p>
                      <p className="text-sm text-blue-600">{event.subject}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    Add to Calendar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
