/**
 * Captain Availability Calculation Utility
 *
 * This module provides functions to calculate available booking slots
 * based on captain's availability windows, blackout dates, existing bookings,
 * and booking configuration settings.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  parseTime,
  createTimestamp,
  isValidUUID,
  isValidDate,
} from '@/lib/utils/validation';
import {
  addDays,
  addMinutes,
  format,
  parseISO,
  isValid,
  startOfDay,
  isBefore,
  isAfter,
  addHours,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// ============================================================================
// Types
// ============================================================================

export interface AvailableSlot {
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
}

export interface DateAvailabilityInfo {
  date: string; // YYYY-MM-DD
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  has_availability: boolean;
  is_blackout: boolean;
  blackout_reason?: string | null;
  is_past: boolean;
  is_beyond_advance_window: boolean;
  has_active_window: boolean;
}

export interface AvailabilitySlotsResult {
  success: boolean;
  data?: {
    date: string;
    captain_timezone: string;
    slots: AvailableSlot[];
    date_info: DateAvailabilityInfo;
  };
  error?: string;
  code?: 'VALIDATION' | 'NOT_FOUND' | 'UNAVAILABLE' | 'HIBERNATING' | 'DATABASE';
}

export interface DateRangeAvailabilityResult {
  success: boolean;
  data?: {
    dates: DateAvailabilityInfo[];
    captain_timezone: string;
  };
  error?: string;
  code?: 'VALIDATION' | 'NOT_FOUND' | 'HIBERNATING' | 'DATABASE';
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Parse a departure time string like "6:00 AM" or "2:30 PM" into hours and minutes.
 */
function parseDepartureTimeStr(timeStr: string): { hours: number; minutes: number } | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours !== 12) hours += 12;
  return { hours, minutes };
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Get available booking slots for a specific date
 *
 * This function:
 * 1. Checks if the date falls within the captain's advance_booking_days window
 * 2. Checks if the date is a blackout date (if so, returns empty array)
 * 3. Gets the day of week and checks availability_windows for that day
 * 4. If that day is not active, returns empty array
 * 5. Gets the trip type's duration_hours
 * 6. Gets the captain's booking_buffer_minutes
 * 7. Gets existing bookings for that date
 * 8. Calculates available start times by:
 *    - Starting from the availability window's start_time
 *    - Creating slots that fit the trip duration
 *    - Respecting buffer time between trips
 *    - Excluding times that conflict with existing bookings
 *    - Not creating slots too close to the window's end_time
 * 9. Returns array of available slots with ISO datetime strings
 */
export async function getAvailableSlots(
  captainId: string,
  tripTypeId: string,
  date: Date | string
): Promise<AvailabilitySlotsResult> {
  // Normalize date to string format
  const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');

  // Validate inputs
  if (!captainId || !isValidUUID(captainId)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }
  if (!tripTypeId || !isValidUUID(tripTypeId)) {
    return { success: false, error: 'Invalid trip type ID', code: 'VALIDATION' };
  }
  if (!isValidDate(dateStr)) {
    return { success: false, error: 'Invalid date format', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Get captain profile for timezone and booking settings
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('timezone, booking_buffer_minutes, advance_booking_days, is_hibernating')
    .eq('id', captainId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Captain not found', code: 'NOT_FOUND' };
  }

  if (profile.is_hibernating) {
    return { success: false, error: 'Captain is not accepting bookings', code: 'HIBERNATING' };
  }

  // Get trip type for duration and departure times
  const { data: tripType, error: tripError } = await supabase
    .from('trip_types')
    .select('duration_hours, departure_times')
    .eq('id', tripTypeId)
    .eq('owner_id', captainId)
    .single();

  if (tripError || !tripType) {
    return { success: false, error: 'Trip type not found', code: 'NOT_FOUND' };
  }

  const timezone = profile.timezone || 'America/New_York';
  const bufferMinutes = profile.booking_buffer_minutes || 60;
  const advanceBookingDays = profile.advance_booking_days || 60;
  const tripDurationHours = tripType.duration_hours;

  const requestedDate = parseISO(dateStr);
  if (!isValid(requestedDate)) {
    return { success: false, error: 'Invalid date', code: 'VALIDATION' };
  }

  const today = startOfDay(new Date());
  const dayOfWeek = requestedDate.getDay();

  // Initialize date info
  const dateInfo: DateAvailabilityInfo = {
    date: dateStr,
    day_of_week: dayOfWeek,
    has_availability: false,
    is_blackout: false,
    is_past: isBefore(requestedDate, today),
    is_beyond_advance_window: false,
    has_active_window: false,
  };

  // Check if date is in the past
  if (dateInfo.is_past) {
    return {
      success: true,
      data: {
        date: dateStr,
        captain_timezone: timezone,
        slots: [],
        date_info: dateInfo,
      },
    };
  }

  // Check if date is too far in advance
  const maxAdvanceDate = addDays(today, advanceBookingDays);
  if (isAfter(requestedDate, maxAdvanceDate)) {
    dateInfo.is_beyond_advance_window = true;
    return {
      success: true,
      data: {
        date: dateStr,
        captain_timezone: timezone,
        slots: [],
        date_info: dateInfo,
      },
    };
  }

  // Check for blackout dates
  const { data: blackouts } = await supabase
    .from('blackout_dates')
    .select('blackout_date, reason')
    .eq('owner_id', captainId)
    .eq('blackout_date', dateStr);

  if (blackouts && blackouts.length > 0) {
    dateInfo.is_blackout = true;
    dateInfo.blackout_reason = blackouts[0].reason;
    return {
      success: true,
      data: {
        date: dateStr,
        captain_timezone: timezone,
        slots: [],
        date_info: dateInfo,
      },
    };
  }

  // Get availability windows for this day of week
  const { data: windows, error: windowError } = await supabase
    .from('availability_windows')
    .select('start_time, end_time')
    .eq('owner_id', captainId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true);

  if (windowError) {
    return { success: false, error: 'Failed to fetch availability', code: 'DATABASE' };
  }

  if (!windows || windows.length === 0) {
    return {
      success: true,
      data: {
        date: dateStr,
        captain_timezone: timezone,
        slots: [],
        date_info: dateInfo,
      },
    };
  }

  dateInfo.has_active_window = true;

  // Get existing bookings for this date (active statuses only)
  const dateStart = `${dateStr}T00:00:00`;
  const dateEnd = `${dateStr}T23:59:59`;

  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('scheduled_start, scheduled_end')
    .eq('captain_id', captainId)
    .gte('scheduled_start', dateStart)
    .lte('scheduled_start', dateEnd)
    .in('status', ['pending_deposit', 'confirmed', 'weather_hold', 'rescheduled']);

  // Calculate current time with buffer (for same-day booking restrictions)
  const now = new Date();
  const nowWithBuffer = addMinutes(now, bufferMinutes);

  // Check if trip type has specific departure times configured
  const hasDepartureTimes = Array.isArray(tripType.departure_times) && tripType.departure_times.length > 0;

  // Generate available slots from availability windows
  const slots: AvailableSlot[] = [];

  for (const window of windows) {
    const startParsed = parseTime(window.start_time);
    const endParsed = parseTime(window.end_time);

    if (!startParsed || !endParsed) continue;

    // Build the list of candidate start times (as {hours, minutes})
    const candidates: { hours: number; minutes: number }[] = [];

    if (hasDepartureTimes) {
      // Use specific departure times, filtered to fit within the window
      for (const dt of tripType.departure_times!) {
        const parsed = parseDepartureTimeStr(dt);
        if (!parsed) continue;

        const startInMinutes = parsed.hours * 60 + parsed.minutes;
        const endInMinutes = (parsed.hours + tripDurationHours) * 60 + parsed.minutes;
        const windowStartMinutes = startParsed.hours * 60 + startParsed.minutes;
        const windowEndMinutes = endParsed.hours * 60 + endParsed.minutes;

        // Only include if departure starts at/after window start and trip end fits within window
        if (startInMinutes >= windowStartMinutes && endInMinutes <= windowEndMinutes) {
          candidates.push(parsed);
        }
      }
    } else {
      // Fall back to 30-minute intervals
      let currentHour = startParsed.hours;
      let currentMinute = startParsed.minutes;

      while (true) {
        const slotEndHour = currentHour + tripDurationHours;
        const slotEndMinute = currentMinute;

        if (
          slotEndHour > endParsed.hours ||
          (slotEndHour === endParsed.hours && slotEndMinute > endParsed.minutes)
        ) {
          break;
        }

        candidates.push({ hours: currentHour, minutes: currentMinute });

        currentMinute += 30;
        if (currentMinute >= 60) {
          currentMinute = 0;
          currentHour += 1;
        }
        if (currentHour > 23) break;
      }
    }

    // Evaluate each candidate
    for (const candidate of candidates) {
      const slotStartTime = `${String(candidate.hours).padStart(2, '0')}:${String(candidate.minutes).padStart(2, '0')}`;
      const slotEndHour = candidate.hours + tripDurationHours;
      const slotEndTime = `${String(slotEndHour).padStart(2, '0')}:${String(candidate.minutes).padStart(2, '0')}`;

      const slotStartTs = createTimestamp(dateStr, slotStartTime, timezone);
      const slotEndTs = createTimestamp(dateStr, slotEndTime, timezone);

      if (slotStartTs && slotEndTs) {
        let isAvailable = true;
        const slotStartDate = new Date(slotStartTs);

        // Check if slot is too soon (within buffer time from now)
        if (isBefore(slotStartDate, nowWithBuffer)) {
          isAvailable = false;
        }

        // Check if slot conflicts with existing bookings
        if (isAvailable && existingBookings) {
          const slotStart = slotStartDate.getTime();
          const slotEnd = new Date(slotEndTs).getTime();

          for (const booking of existingBookings) {
            const bookingStart = new Date(booking.scheduled_start).getTime();
            const bookingEnd = new Date(booking.scheduled_end).getTime();

            // Check for overlap (including buffer time)
            const bookingStartWithBuffer = bookingStart - bufferMinutes * 60 * 1000;
            const bookingEndWithBuffer = bookingEnd + bufferMinutes * 60 * 1000;

            if (slotStart < bookingEndWithBuffer && slotEnd > bookingStartWithBuffer) {
              isAvailable = false;
              break;
            }
          }
        }

        if (isAvailable) {
          slots.push({
            start_time: slotStartTs,
            end_time: slotEndTs,
          });
        }
      }
    }
  }

  dateInfo.has_availability = slots.length > 0;

  return {
    success: true,
    data: {
      date: dateStr,
      captain_timezone: timezone,
      slots,
      date_info: dateInfo,
    },
  };
}

/**
 * Get availability information for a range of dates
 *
 * Returns information about each date including:
 * - Whether it's a blackout date
 * - Whether there's an active availability window for that day of week
 * - Whether it's in the past
 * - Whether it's beyond the advance booking window
 *
 * This is useful for pre-filtering the calendar to show/disable dates
 * without fetching detailed slot information.
 */
export async function getDateRangeAvailability(
  captainId: string,
  days: number = 60
): Promise<DateRangeAvailabilityResult> {
  if (!captainId || !isValidUUID(captainId)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Get captain profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('advance_booking_days, is_hibernating, timezone')
    .eq('id', captainId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Captain not found', code: 'NOT_FOUND' };
  }

  if (profile.is_hibernating) {
    return { success: false, error: 'Captain is not accepting bookings', code: 'HIBERNATING' };
  }

  const timezone = profile.timezone || 'America/New_York';
  const maxDays = Math.min(days, profile.advance_booking_days || 60);

  // Get all active availability windows
  const { data: windows } = await supabase
    .from('availability_windows')
    .select('day_of_week')
    .eq('owner_id', captainId)
    .eq('is_active', true);

  const availableDaysOfWeek = new Set(
    (windows || []).map((w: { day_of_week: number }) => w.day_of_week)
  );

  // Get all blackout dates in range
  const today = startOfDay(new Date());
  const startDate = format(today, 'yyyy-MM-dd');
  const endDate = format(addDays(today, maxDays), 'yyyy-MM-dd');

  const { data: blackouts } = await supabase
    .from('blackout_dates')
    .select('blackout_date, reason')
    .eq('owner_id', captainId)
    .gte('blackout_date', startDate)
    .lte('blackout_date', endDate);

  const blackoutMap = new Map<string, string | null>();
  for (const b of blackouts || []) {
    blackoutMap.set(b.blackout_date, b.reason);
  }

  // Generate date information
  const dates: DateAvailabilityInfo[] = [];

  for (let i = 0; i <= maxDays; i++) {
    const currentDate = addDays(today, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayOfWeek = currentDate.getDay();

    const isBlackout = blackoutMap.has(dateStr);
    const hasActiveWindow = availableDaysOfWeek.has(dayOfWeek);
    const hasAvailability = hasActiveWindow && !isBlackout;

    dates.push({
      date: dateStr,
      day_of_week: dayOfWeek,
      has_availability: hasAvailability,
      is_blackout: isBlackout,
      blackout_reason: blackoutMap.get(dateStr) || null,
      is_past: false, // None in this range are past since we start from today
      is_beyond_advance_window: false, // None in this range are beyond since we limit to maxDays
      has_active_window: hasActiveWindow,
    });
  }

  return {
    success: true,
    data: {
      dates,
      captain_timezone: timezone,
    },
  };
}

/**
 * Format an ISO datetime to a display time in the captain's timezone
 */
export function formatSlotTime(isoDateTime: string, timezone: string): string {
  const date = parseISO(isoDateTime);
  if (!isValid(date)) return '';

  const zonedDate = toZonedTime(date, timezone);
  const hours = zonedDate.getHours();
  const minutes = zonedDate.getMinutes();

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Format an ISO datetime to HH:MM format in the captain's timezone
 */
export function formatSlotTimeHHMM(isoDateTime: string, timezone: string): string {
  const date = parseISO(isoDateTime);
  if (!isValid(date)) return '';

  const zonedDate = toZonedTime(date, timezone);
  const hours = zonedDate.getHours();
  const minutes = zonedDate.getMinutes();

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
