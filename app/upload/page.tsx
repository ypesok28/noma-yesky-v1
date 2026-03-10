"use client";

import Link from "next/link";
import { SyllabusUpload } from "@/components/syllabus-upload";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Navigation Bar */}
      <nav className="w-full px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-sm border-b border-blue-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-2xl font-bold text-blue-600">CalendarSync</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Upload Your <span className="text-blue-600">Syllabus</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload a photo or PDF of your syllabus. Our OCR will extract the raw text,
            then Ollama LLM will intelligently parse it into structured calendar events.
          </p>
        </div>

        <SyllabusUpload />
      </div>
    </div>
  );
}
