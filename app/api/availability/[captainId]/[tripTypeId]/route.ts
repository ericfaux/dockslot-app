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
  setHours,
  setMinutes,
} from "date-fns";

/**
 * Parse a departure time string like "6:00 AM" or "2:30 PM" into hours and minutes.
 */
function parseDepartureTime(timeStr: string): { hours: number; minutes: number } | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours !== 12) hours += 12;
  return { hours, minutes };
}

interface TimeSlot {
  start: string; // HH:MM
  end: string;   // HH:MM
  available: boolean;
  booked_count: number;
  total_capacity: number;
  remaining_capacity: number;
}

interface AvailabilityResponse {
  availability: Record<string, TimeSlot[]>;
  captain_timezone: string;
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

    // Fetch trip type to get duration and departure times (only if active)
    const { data: tripType, error: tripError } = await supabase
      .from('trip_types')
      .select('duration_hours, owner_id, departure_times')
      .eq('id', tripTypeId)
      .eq('is_active', true)
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

    // Fetch captain's profile for buffer settings and timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('booking_buffer_minutes, advance_booking_days, timezone')
      .eq('id', captainId)
      .single();

    const bufferMinutes = profile?.booking_buffer_minutes || 60;
    const maxAdvanceDays = profile?.advance_booking_days || 90;
    const captainTimezone = profile?.timezone || 'America/New_York';

    // Fetch all vessels for this captain to calculate aggregate capacity
    const { data: vessels } = await supabase
      .from('vessels')
      .select('id, capacity')
      .eq('owner_id', captainId);

    const totalCapacity = vessels?.reduce((sum, v) => sum + v.capacity, 0) || 6;
    // Max capacity of a single vessel — this is what a customer can actually book
    const maxVesselCapacity = vessels && vessels.length > 0
      ? Math.max(...vessels.map(v => v.capacity))
      : 6;

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

    // Fetch existing bookings for the month (to block out booked slots and track capacity)
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('scheduled_start, scheduled_end, status, party_size')
      .eq('captain_id', captainId)
      .gte('scheduled_start', monthStart.toISOString())
      .lte('scheduled_start', monthEnd.toISOString())
      .in('status', ['confirmed', 'pending_deposit', 'weather_hold', 'rescheduled']);

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

      // Check if trip type has specific departure times configured
      const hasDepartureTimes = Array.isArray(tripType.departure_times) && tripType.departure_times.length > 0;

      for (const window of windowsForDay) {
        const windowStart = parse(window.start_time, 'HH:mm:ss', day);
        const windowEnd = parse(window.end_time, 'HH:mm:ss', day);

        // Build the list of candidate start times
        const candidateStarts: Date[] = [];

        if (hasDepartureTimes) {
          // Use specific departure times
          for (const dt of tripType.departure_times!) {
            const parsed = parseDepartureTime(dt);
            if (!parsed) continue;
            const candidate = setMinutes(setHours(day, parsed.hours), parsed.minutes);
            // Only include if it falls within this availability window
            const tripEnd = addHours(candidate, tripType.duration_hours);
            if (
              (isAfter(candidate, windowStart) || candidate.getTime() === windowStart.getTime()) &&
              (isBefore(tripEnd, windowEnd) || tripEnd.getTime() === windowEnd.getTime())
            ) {
              candidateStarts.push(candidate);
            }
          }
        } else {
          // Fall back to 30-minute intervals
          let slotStart = windowStart;
          while (isBefore(addHours(slotStart, tripType.duration_hours), windowEnd)) {
            candidateStarts.push(slotStart);
            slotStart = addHours(slotStart, 0.5);
          }
        }

        // Evaluate each candidate start time
        for (const slotStart of candidateStarts) {
          const slotEnd = addHours(slotStart, tripType.duration_hours);

          // Count overlapping bookings for this slot (for capacity tracking)
          const overlappingBookings = existingBookings?.filter(booking => {
            const bookingStart = parseISO(booking.scheduled_start);
            const bookingEnd = parseISO(booking.scheduled_end);
            return isBefore(slotStart, bookingEnd) && isAfter(slotEnd, bookingStart);
          }) || [];

          const bookedCount = overlappingBookings.length;
          const combinedRemaining = Math.max(0, totalCapacity - overlappingBookings.reduce((sum, b) => sum + (b.party_size || 1), 0));
          // Display per-vessel capacity so customers see the max their party can be
          const displayRemaining = Math.min(combinedRemaining, maxVesselCapacity);

          // Check if slot is within buffer time from now
          const isWithinBuffer = isBefore(slotStart, addHours(now, bufferMinutes / 60));

          // Slot is available as long as any vessel has remaining capacity
          const isAvailable = combinedRemaining > 0 && !isWithinBuffer;

          slots.push({
            start: format(slotStart, 'HH:mm'),
            end: format(slotEnd, 'HH:mm'),
            available: isAvailable,
            booked_count: bookedCount,
            total_capacity: maxVesselCapacity,
            remaining_capacity: isWithinBuffer ? 0 : displayRemaining,
          });
        }
      }

      if (slots.length > 0) {
        availability[dateKey] = slots;
      }
    }

    return NextResponse.json({ availability, captain_timezone: captainTimezone } as AvailabilityResponse);

  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
