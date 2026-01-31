// app/api/availability/[captainId]/[tripTypeId]/route.ts
// API endpoint to fetch available booking slots for a trip type
// Returns date-keyed object with available time slots

import { createSupabaseServiceClient } from "@/utils/supabase/service";
import { NextRequest, NextResponse } from "next/server";
import { 
  format, 
  parseISO, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  addHours,
  parse,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns";

interface TimeSlot {
  start: string; // HH:MM
  end: string;   // HH:MM
  available: boolean;
}

interface AvailabilityResponse {
  availability: Record<string, TimeSlot[]>;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ captainId: string; tripTypeId: string }> }
) {
  const { captainId, tripTypeId } = await context.params;
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month'); // format: YYYY-MM

  if (!monthParam) {
    return NextResponse.json(
      { error: 'Month parameter required (format: YYYY-MM)' },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseServiceClient();

    // Fetch trip type to get duration
    const { data: tripType, error: tripError } = await supabase
      .from('trip_types')
      .select('duration_hours, owner_id')
      .eq('id', tripTypeId)
      .single();

    if (tripError || !tripType) {
      return NextResponse.json(
        { error: 'Trip type not found' },
        { status: 404 }
      );
    }

    // Verify captain owns this trip type
    if (tripType.owner_id !== captainId) {
      return NextResponse.json(
        { error: 'Trip type does not belong to this captain' },
        { status: 403 }
      );
    }

    // Fetch captain's profile for buffer settings
    const { data: profile } = await supabase
      .from('profiles')
      .select('booking_buffer_minutes, advance_booking_days')
      .eq('id', captainId)
      .single();

    const bufferMinutes = profile?.booking_buffer_minutes || 60;
    const maxAdvanceDays = profile?.advance_booking_days || 90;

    // Fetch availability windows (weekly schedule)
    const { data: availabilityWindows } = await supabase
      .from('availability_windows')
      .select('*')
      .eq('owner_id', captainId)
      .eq('is_active', true);

    // Fetch blackout dates for the month
    const monthStart = startOfMonth(parseISO(`${monthParam}-01`));
    const monthEnd = endOfMonth(monthStart);

    const { data: blackoutDates } = await supabase
      .from('blackout_dates')
      .select('blackout_date, reason')
      .eq('owner_id', captainId)
      .gte('blackout_date', format(monthStart, 'yyyy-MM-dd'))
      .lte('blackout_date', format(monthEnd, 'yyyy-MM-dd'));

    const blackoutSet = new Set(
      blackoutDates?.map(b => b.blackout_date) || []
    );

    // Fetch existing bookings for the month (to block out booked slots)
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('scheduled_start, scheduled_end, status')
      .eq('captain_id', captainId)
      .gte('scheduled_start', monthStart.toISOString())
      .lte('scheduled_start', monthEnd.toISOString())
      .in('status', ['confirmed', 'pending_deposit', 'weather_hold']);

    // Build availability map
    const availability: Record<string, TimeSlot[]> = {};
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const now = new Date();
    const maxBookingDate = addDays(now, maxAdvanceDays);

    for (const day of daysInMonth) {
      const dateKey = format(day, 'yyyy-MM-dd');

      // Skip if in the past
      if (isBefore(day, startOfDay(now))) {
        continue;
      }

      // Skip if beyond advance booking window
      if (isAfter(day, maxBookingDate)) {
        continue;
      }

      // Skip if blackout date
      if (blackoutSet.has(dateKey)) {
        continue;
      }

      // Get availability window for this day of week
      const dayOfWeek = day.getDay(); // 0 = Sunday
      const windowsForDay = availabilityWindows?.filter(
        w => w.day_of_week === dayOfWeek
      ) || [];

      if (windowsForDay.length === 0) {
        continue; // No availability on this day of week
      }

      // Generate time slots from availability windows
      const slots: TimeSlot[] = [];

      for (const window of windowsForDay) {
        const windowStart = parse(window.start_time, 'HH:mm:ss', day);
        const windowEnd = parse(window.end_time, 'HH:mm:ss', day);

        // Generate slots at 30-minute intervals
        let slotStart = windowStart;

        while (isBefore(addHours(slotStart, tripType.duration_hours), windowEnd)) {
          const slotEnd = addHours(slotStart, tripType.duration_hours);

          // Check if this slot overlaps with any existing bookings
          const isBooked = existingBookings?.some(booking => {
            const bookingStart = parseISO(booking.scheduled_start);
            const bookingEnd = parseISO(booking.scheduled_end);

            // Check for overlap
            return (
              (isBefore(slotStart, bookingEnd) && isAfter(slotEnd, bookingStart))
            );
          });

          // Check if slot is within buffer time from now
          const isWithinBuffer = isBefore(slotStart, addHours(now, bufferMinutes / 60));

          slots.push({
            start: format(slotStart, 'HH:mm'),
            end: format(slotEnd, 'HH:mm'),
            available: !isBooked && !isWithinBuffer,
          });

          // Move to next slot (30-minute intervals)
          slotStart = addHours(slotStart, 0.5);
        }
      }

      if (slots.length > 0) {
        availability[dateKey] = slots;
      }
    }

    return NextResponse.json({ availability } as AvailabilityResponse);

  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
