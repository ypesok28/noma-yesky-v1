import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import type { ExtractedEvent } from '@/app/utils/ocrProcessor';
import { toGoogleEvent } from '@/app/utils/calendarEvents';

const MAX_EVENTS = 200;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accessToken: unknown = body?.accessToken;
    const events: unknown = body?.events;
    const timeZone: string = typeof body?.timeZone === 'string' ? body.timeZone : 'UTC';

    if (typeof accessToken !== 'string' || !accessToken) {
      return NextResponse.json({ error: 'Missing Google access token' }, { status: 401 });
    }
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }
    if (events.length > MAX_EVENTS) {
      return NextResponse.json({ error: `Too many events (max ${MAX_EVENTS})` }, { status: 400 });
    }

    // Use the user's token to act on their calendar
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth });

    let created = 0;
    const failed: { event: ExtractedEvent; reason: string }[] = [];

    // Insert one at a time to stay well under Google's rate limits
    for (const evt of events as ExtractedEvent[]) {
      const requestBody = toGoogleEvent(evt, timeZone);
      if (!requestBody) {
        failed.push({ event: evt, reason: `Invalid date "${evt.date}"` });
        continue;
      }

      try {
        await calendar.events.insert({ calendarId: 'primary', requestBody });
        created++;
      } catch (error) {
        const status = (error as { code?: number }).code;
        if (status === 401) {
          return NextResponse.json(
            { error: 'Google authorization expired. Please try again.', created },
            { status: 401 }
          );
        }
        failed.push({
          event: evt,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({ created, failed });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync with Google Calendar',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
