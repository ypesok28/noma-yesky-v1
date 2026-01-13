"use client";

import { useState } from "react";

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const [day, setDay] = useState(new Date().getDate());
  
  const goToPreviousMonth = () => {
    setMonth(month - 1);
  }
  const goToNextMonth = () => {
    setMonth(month + 1);
  }
  const goToToday = () => {
    setMonth(new Date().getMonth());
    setYear(new Date().getFullYear());
    setDay(new Date().getDate());

  }
  const renderCalendarDays = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 flex items-center justify-center font-semibold text-blue-600 bg-blue-100 rounded-md"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(<div key={`day-${i}`} className="h-12 flex items-center justify-center font-semibold text-blue-600 bg-blue-100 rounded-md">{i}</div>);
    }

    return days;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            ← Previous
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-600">
              {monthNames[month]} {year}
            </h1>
            <button
              onClick={goToToday}
              className="mt-2 text-sm text-blue-500 hover:text-blue-700 underline"
            >
              Go to Today
            </button>
          </div>
          
          <button
            onClick={goToNextMonth}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Next →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {dayNames.map((day) => (
            <div
              key={day}
              className="h-12 flex items-center justify-center font-semibold text-blue-600 bg-blue-100 rounded-md"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          <div className="col-span-7 grid grid-cols-7 gap-1 -mt-2">
            {renderCalendarDays()}
          </div>
        </div>
      </div>
    </div>
  );
}
