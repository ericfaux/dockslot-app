import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

/**
 * Calendar Export API - Generate iCal feed for captain's bookings
 * Supports: Apple Calendar, Google Calendar, Outlook, etc.
 * 
 * Usage: /api/calendar/export?token=SECRET_TOKEN
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse('Missing token', { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Verify token and get captain profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, calendar_token, business_name, full_name')
      .eq('calendar_token', token)
      .single();

    if (profileError || !profile) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Fetch all future bookings (next 6 months)
    const now = new Date();
    const sixMonthsOut = new Date();
    sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        created_at,
        updated_at,
        scheduled_start,
        scheduled_end,
        guest_name,
        guest_email,
        guest_phone,
        party_size,
        status,
        meeting_spot,
        special_requests,
        trip_type:trip_types(title, description),
        vessel:vessels(name)
      `)
      .eq('captain_id', profile.id)
      .gte('scheduled_start', now.toISOString())
      .lte('scheduled_start', sixMonthsOut.toISOString())
      .in('status', ['confirmed', 'pending_deposit', 'pending_approval', 'weather_hold'])
      .order('scheduled_start', { ascending: true });

    if (bookingsError) {
      console.error('Failed to fetch bookings:', bookingsError);
      return new NextResponse('Failed to fetch bookings', { status: 500 });
    }

    // Generate iCal format
    const ical = generateICalendar(
      bookings || [],
      profile.business_name || profile.full_name || 'DockSlot Calendar'
    );

    return new NextResponse(ical, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="dockslot-bookings.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Calendar export error:', error);
    return new NextResponse('Failed to export calendar', { status: 500 });
  }
}

function generateICalendar(bookings: any[], calendarName: string): string {
  const now = new Date();
  const timestamp = formatICalDate(now);

  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DockSlot//Charter Booking Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    'X-WR-TIMEZONE:UTC',
    'X-WR-CALDESC:Charter bookings from DockSlot',
  ];

  bookings.forEach((booking) => {
    const tripType = Array.isArray(booking.trip_type)
      ? booking.trip_type[0]
      : booking.trip_type;
    const vessel = Array.isArray(booking.vessel) ? booking.vessel[0] : booking.vessel;

    const summary = `${tripType?.title || 'Charter Trip'} - ${booking.guest_name}`;
    const description = buildEventDescription(booking, tripType, vessel);
    const location = booking.meeting_spot || 'TBD';

    const event = [
      'BEGIN:VEVENT',
      `UID:booking-${booking.id}@dockslot.app`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatICalDate(new Date(booking.scheduled_start))}`,
      `DTEND:${formatICalDate(new Date(booking.scheduled_end))}`,
      `SUMMARY:${escapeICalText(summary)}`,
      `DESCRIPTION:${escapeICalText(description)}`,
      `LOCATION:${escapeICalText(location)}`,
      `STATUS:${getICalStatus(booking.status)}`,
      `CREATED:${formatICalDate(new Date(booking.created_at))}`,
      `LAST-MODIFIED:${formatICalDate(new Date(booking.updated_at))}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${summary} tomorrow`,
      'END:VALARM',
      'END:VEVENT',
    ];

    ical.push(...event);
  });

  ical.push('END:VCALENDAR');

  return ical.join('\r\n');
}

function buildEventDescription(booking: any, tripType: any, vessel: any): string {
  const lines = [];

  lines.push(`Trip: ${tripType?.title || 'Charter'}`);
  if (tripType?.description) {
    lines.push(`Description: ${tripType.description}`);
  }

  lines.push('');
  lines.push(`Guest: ${booking.guest_name}`);
  lines.push(`Email: ${booking.guest_email}`);
  if (booking.guest_phone) {
    lines.push(`Phone: ${booking.guest_phone}`);
  }
  lines.push(`Party Size: ${booking.party_size} guests`);

  lines.push('');
  if (vessel?.name) {
    lines.push(`Vessel: ${vessel.name}`);
  }
  if (booking.meeting_spot) {
    lines.push(`Meeting Location: ${booking.meeting_spot}`);
  }

  if (booking.special_requests) {
    lines.push('');
    lines.push(`Special Requests: ${booking.special_requests}`);
  }

  lines.push('');
  lines.push(`Status: ${booking.status.replace(/_/g, ' ').toUpperCase()}`);
  lines.push('');
  lines.push('View booking: https://dockslot.app/dashboard/schedule');

  return lines.join('\\n');
}

function formatICalDate(date: Date): string {
  // Format: YYYYMMDDTHHmmssZ (UTC)
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function escapeICalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function getICalStatus(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'CONFIRMED';
    case 'pending_deposit':
    case 'pending_approval':
      return 'TENTATIVE';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return 'TENTATIVE';
  }
}
