'use server';

/**
 * DockSlot Manifest Server Actions
 * Fetches upcoming bookings with passenger details for the captain's manifest view
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BookingWithPassengers, Booking, Passenger, TripType, Vessel } from '@/lib/db/types';

// ============================================================================
// Types
// ============================================================================

export type ManifestErrorCode = 'UNAUTHORIZED' | 'UNKNOWN';

export interface ManifestActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: ManifestErrorCode;
}

// Raw type from Supabase query before transformation
interface RawBookingWithPassengers extends Booking {
  trip_type: TripType | null;
  vessel: Vessel | null;
  passengers: Passenger[];
}

// ============================================================================
// Get Upcoming Bookings with Passengers
// ============================================================================

export async function getUpcomingBookingsWithPassengers(): Promise<
  ManifestActionResult<BookingWithPassengers[]>
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      trip_type:trip_types(*),
      vessel:vessels(*),
      passengers(*)
    `
    )
    .eq('captain_id', user.id)
    .in('status', ['confirmed', 'pending_deposit', 'weather_hold', 'rescheduled'])
    .gte('scheduled_start', new Date().toISOString())
    .order('scheduled_start', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming bookings:', error);
    return { success: false, error: 'Failed to fetch bookings', code: 'UNKNOWN' };
  }

  // Transform to properly typed BookingWithPassengers
  const bookings: BookingWithPassengers[] = (data as RawBookingWithPassengers[]).map((booking) => ({
    ...booking,
    trip_type: booking.trip_type
      ? {
          id: booking.trip_type.id,
          title: booking.trip_type.title,
          duration_hours: booking.trip_type.duration_hours,
          price_total: booking.trip_type.price_total,
          deposit_amount: booking.trip_type.deposit_amount,
        }
      : null,
    vessel: booking.vessel
      ? {
          id: booking.vessel.id,
          name: booking.vessel.name,
          capacity: booking.vessel.capacity,
        }
      : null,
    passengers: booking.passengers || [],
  }));

  return { success: true, data: bookings };
}
