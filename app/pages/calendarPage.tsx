"use client";

import { useState } from "react";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const currentYear = new Date().getFullYear();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const selectMonth = (selectedMonth: number) => {
    setCurrentDate(new Date(year, selectedMonth, 1));
    setShowMonthDropdown(false);
  };
  
  const selectYear = (selectedYear: number) => {
    setCurrentDate(new Date(selectedYear, month, 1));
    setShowYearDropdown(false);
  };
  
  const years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i);
  
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };
  
  const renderCalendarDays = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="h-16 flex items-center justify-center text-gray-300"
        />
      );
    }
    
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const isCurrentDay = isToday(i);
      days.push(
        <div
          key={`day-${i}`}
          className={`h-16 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 ${
            isCurrentDay
              ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/50 scale-105"
              : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium"
          }`}
        >
          {i}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={goToPreviousMonth}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg active:scale-95"
          >
            ← Previous
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowMonthDropdown(!showMonthDropdown);
                    setShowYearDropdown(false);
                  }}
                  className="text-4xl font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-2"
                >
                  <span>{monthNames[month]}</span>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-sm text-blue-500 transition-transform ${
                      showMonthDropdown ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {showMonthDropdown && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-blue-200 rounded-lg shadow-lg z-50 w-40 max-h-64 overflow-y-auto">
                    {monthNames.map((name, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectMonth(idx)}
                        className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${
                          idx === month ? "bg-blue-100 font-semibold" : ""
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowYearDropdown(!showYearDropdown);
                    setShowMonthDropdown(false);
                  }}
                  className="text-4xl font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-2"
                >
                  <span>{year}</span>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-sm text-blue-500 transition-transform ${
                      showYearDropdown ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {showYearDropdown && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-blue-200 rounded-lg shadow-lg z-50 w-24 max-h-64 overflow-y-auto">
                    {years.map((y) => (
                      <button
                        key={y}
                        onClick={() => selectYear(y)}
                        className={`w-full text-center px-4 py-2 hover:bg-blue-50 ${
                          y === year ? "bg-blue-100 font-semibold" : ""
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={goToToday}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline"
            >
              Go to Today
            </button>
          </div>
          
          <button
            onClick={goToNextMonth}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg active:scale-95"
          >
            Next →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {dayNames.map((day) => (
            <div
              key={day}
              className="h-12 flex items-center justify-center font-bold text-blue-600 text-sm uppercase tracking-wide"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {renderCalendarDays()}
        </div>
      </div>
    </div>
  );
}
