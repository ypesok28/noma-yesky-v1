"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { ExtractedEvent } from "@/app/utils/ocrProcessor";
import { parseLocalDate, toGoogleEvent } from "@/app/utils/calendarEvents";
import { requestCalendarAccessToken } from "@/app/utils/googleAuth";

// Pre-filled "create event" link, used for adding a single event by hand
function buildGoogleCalendarUrl(event: ExtractedEvent): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const googleEvent = toGoogleEvent(event, timeZone);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${event.subject} - ${event.description}`,
    ctz: timeZone,
  });
  if (googleEvent) {
    const compact = (s: string) => s.replace(/[-:]/g, "");
    const start = googleEvent.start.dateTime ?? googleEvent.start.date!;
    const end = googleEvent.end.dateTime ?? googleEvent.end.date!;
    params.set("dates", `${compact(start)}/${compact(end)}`);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function SyllabusUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<ExtractedEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];
      if (!validTypes.includes(selectedFile.type)) {
        setError("Please upload a valid file (JPEG, PNG, WebP, or PDF)");
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setFile(selectedFile);
      setError(null);
      setEvents([]);
      setSyncMessage(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/syllabus/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process syllabus");
      }

      const data = await response.json();
      setEvents(data.events || []);

      if (!data.events || data.events.length === 0) {
        setError("No events found in the document.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to process file. Please try again.";
      console.error("Processing error:", err);
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncToCalendar = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncMessage(null);

    try {
      // Opens Google's consent popup; must run directly from the click
      const accessToken = await requestCalendarAccessToken();

      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          events,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to sync with Google Calendar");
      }

      const failedCount = data.failed?.length ?? 0;
      setSyncMessage(
        `Added ${data.created} event${data.created === 1 ? "" : "s"} to Google Calendar` +
          (failedCount > 0 ? ` (${failedCount} failed)` : "")
      );
      if (failedCount > 0) console.warn("Events that failed to sync:", data.failed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sync with Google Calendar");
    } finally {
      setIsSyncing(false);
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
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];
      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
        setError(null);
        setEvents([]);
      } else {
        setError("Please upload a valid file (JPEG, PNG, WebP, or PDF)");
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
          accept="image/*,.pdf,application/pdf"
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
                Supports: JPEG, PNG, WebP, PDF (Max 10MB)
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

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="text-center py-4">
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-600 mt-2">
            Analyzing syllabus with AI...
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Extracted Events */}
      {events.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">
              Extracted Events ({events.length})
            </h3>
            <Button
              onClick={handleSyncToCalendar}
              disabled={isSyncing}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSyncing ? "Adding to Google Calendar..." : "Add All to Google Calendar"}
            </Button>
          </div>
          {syncMessage && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 text-sm">{syncMessage}</p>
            </div>
          )}
          <div className="space-y-3">
            {events.map((evt, index) => (
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
                          {(parseLocalDate(evt.date) ?? new Date(evt.date)).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        {evt.time && (
                          <p className="text-sm text-gray-600">{evt.time}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-13 space-y-1">
                      <p className="font-semibold text-gray-900">
                        {evt.description}
                      </p>
                      <p className="text-sm text-blue-600">{evt.subject}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() =>
                      window.open(buildGoogleCalendarUrl(evt), "_blank")
                    }
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
