import type { ExtractedEvent } from './ocrProcessor';

// Shape accepted by the Google Calendar API (events.insert requestBody)
export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad = (n: number) => n.toString().padStart(2, '0');

/**
 * Parse "YYYY-MM-DD" as a local date. `new Date("2024-01-15")` is parsed as
 * UTC midnight, which shows as the previous day in US time zones.
 */
export function parseLocalDate(date: string): Date | null {
  const match = DATE_RE.exec(date.trim());
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  return new Date(y, m - 1, d);
}

/** Add days to a "YYYY-MM-DD" string without touching time zones. */
function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Move a "YYYY-MM-DD" date forward (0-6 days) to the given weekday.
 * Syllabus tables often label each row with the week's start date and put
 * events under day-of-week columns; the LLM reads the column reliably but
 * is unreliable at the date arithmetic, so we do that part in code.
 */
export function alignToWeekday(date: string, weekday: string | null | undefined): string {
  const local = parseLocalDate(date);
  const target = weekday ? WEEKDAYS.indexOf(weekday.trim().toLowerCase()) : -1;
  if (!local || target === -1) return date;

  const shift = (target - local.getDay() + 7) % 7;
  return addDays(date, shift);
}

/** Parse "3:00 PM", "3pm", "15:00" (or the start of "3:00 PM - 4:30 PM") into hours/minutes. */
export function parseTime(time: string): { hours: number; minutes: number } | null {
  const match = /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i.exec(time);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3]?.toLowerCase().replace(/\./g, '');

  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;

  return { hours, minutes };
}

/**
 * Convert an extracted event into a Google Calendar event.
 * Events with a time get a 1-hour block; events without one become all-day.
 * Returns null if the date isn't a valid YYYY-MM-DD.
 */
export function toGoogleEvent(evt: ExtractedEvent, timeZone: string): GoogleCalendarEvent | null {
  const date = evt.date.trim();
  if (!parseLocalDate(date)) return null;

  const summary = `${evt.subject} - ${evt.description}`;
  const time = evt.time ? parseTime(evt.time) : null;

  if (!time) {
    // All-day events use an exclusive end date, so end on the next day
    return { summary, start: { date }, end: { date: addDays(date, 1) } };
  }

  const startMinutes = time.hours * 60 + time.minutes;
  const endMinutes = startMinutes + 60;
  const endDate = endMinutes >= 24 * 60 ? addDays(date, 1) : date;
  const endTotal = endMinutes % (24 * 60);

  return {
    summary,
    start: {
      dateTime: `${date}T${pad(time.hours)}:${pad(time.minutes)}:00`,
      timeZone,
    },
    end: {
      dateTime: `${endDate}T${pad(Math.floor(endTotal / 60))}:${pad(endTotal % 60)}:00`,
      timeZone,
    },
  };
}
