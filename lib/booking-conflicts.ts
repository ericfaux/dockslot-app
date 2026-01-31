/**
 * Booking Conflict Detection
 * Prevents double-booking and scheduling conflicts
 */

import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { parseISO, areIntervalsOverlapping } from 'date-fns';

export interface ConflictCheck {
  hasConflict: boolean;
  conflictingBookings?: Array<{
    id: string;
    guest_name: string;
    scheduled_start: string;
    scheduled_end: string;
    status: string;
  }>;
  reason?: string;
}

/**
 * Check if a proposed booking conflicts with existing bookings
 */
export async function checkBookingConflict(params: {
  profileId: string;
  vesselId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  excludeBookingId?: string; // For rescheduling existing bookings
}): Promise<ConflictCheck> {
  const supabase = createSupabaseServiceClient();

  // Query for overlapping bookings on the same vessel
  const { data: existingBookings, error } = await supabase
    .from('bookings')
    .select('id, guest_name, scheduled_start, scheduled_end, status')
    .eq('profile_id', params.profileId)
    .eq('vessel_id', params.vesselId)
    .in('status', ['confirmed', 'rescheduled', 'pending_deposit'])
    .gte('scheduled_end', params.scheduledStart.toISOString())
    .lte('scheduled_start', params.scheduledEnd.toISOString());

  if (error) {
    console.error('Error checking booking conflicts:', error);
    return {
      hasConflict: false,
      reason: 'Unable to verify conflicts',
    };
  }

  // Filter out the booking being rescheduled
  const relevantBookings = existingBookings?.filter(
    (b) => b.id !== params.excludeBookingId
  ) || [];

  if (relevantBookings.length === 0) {
    return { hasConflict: false };
  }

  // Check for actual time overlap using date-fns
  const conflicting = relevantBookings.filter((booking) => {
    const bookingStart = parseISO(booking.scheduled_start);
    const bookingEnd = parseISO(booking.scheduled_end);

    return areIntervalsOverlapping(
      { start: params.scheduledStart, end: params.scheduledEnd },
      { start: bookingStart, end: bookingEnd },
      { inclusive: false } // Exact end/start times don't conflict
    );
  });

  if (conflicting.length > 0) {
    return {
      hasConflict: true,
      conflictingBookings: conflicting,
      reason: `Conflicts with ${conflicting.length} existing booking${conflicting.length > 1 ? 's' : ''}`,
    };
  }

  return { hasConflict: false };
}

/**
 * Check if captain has sufficient buffer time between bookings
 */
export async function checkBufferTime(params: {
  profileId: string;
  vesselId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  bufferMinutes: number;
  excludeBookingId?: string;
}): Promise<ConflictCheck> {
  if (params.bufferMinutes === 0) {
    return { hasConflict: false };
  }

  const supabase = createSupabaseServiceClient();

  // Calculate buffer windows
  const bufferMs = params.bufferMinutes * 60 * 1000;
  const bufferStart = new Date(params.scheduledStart.getTime() - bufferMs);
  const bufferEnd = new Date(params.scheduledEnd.getTime() + bufferMs);

  // Query for bookings within buffer window
  const { data: nearbyBookings, error } = await supabase
    .from('bookings')
    .select('id, guest_name, scheduled_start, scheduled_end, status')
    .eq('profile_id', params.profileId)
    .eq('vessel_id', params.vesselId)
    .in('status', ['confirmed', 'rescheduled'])
    .gte('scheduled_end', bufferStart.toISOString())
    .lte('scheduled_start', bufferEnd.toISOString());

  if (error) {
    console.error('Error checking buffer time:', error);
    return { hasConflict: false };
  }

  // Filter out the booking being rescheduled
  const relevantBookings = nearbyBookings?.filter(
    (b) => b.id !== params.excludeBookingId
  ) || [];

  if (relevantBookings.length === 0) {
    return { hasConflict: false };
  }

  // Check each nearby booking for buffer violations
  const violations = relevantBookings.filter((booking) => {
    const bookingStart = parseISO(booking.scheduled_start);
    const bookingEnd = parseISO(booking.scheduled_end);

    // Check if bookings are too close together
    const timeBetween = Math.min(
      Math.abs(params.scheduledStart.getTime() - bookingEnd.getTime()),
      Math.abs(bookingStart.getTime() - params.scheduledEnd.getTime())
    );

    return timeBetween < bufferMs;
  });

  if (violations.length > 0) {
    return {
      hasConflict: true,
      conflictingBookings: violations,
      reason: `Insufficient buffer time (${params.bufferMinutes} min required)`,
    };
  }

  return { hasConflict: false };
}

/**
 * Check all conflict types (overlap + buffer)
 */
export async function checkAllConflicts(params: {
  profileId: string;
  vesselId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  bufferMinutes?: number;
  excludeBookingId?: string;
}): Promise<ConflictCheck> {
  // Check for direct overlaps first
  const overlapCheck = await checkBookingConflict(params);
  if (overlapCheck.hasConflict) {
    return overlapCheck;
  }

  // Check buffer time if specified
  if (params.bufferMinutes && params.bufferMinutes > 0) {
    const bufferCheck = await checkBufferTime({
      ...params,
      bufferMinutes: params.bufferMinutes,
    });
    if (bufferCheck.hasConflict) {
      return bufferCheck;
    }
  }

  return { hasConflict: false };
}
