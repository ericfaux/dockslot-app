// app/api/bookings/[id]/weather-hold/route.ts
// API endpoint for weather hold operations
// Allows captain to mark booking as weather hold + auto-generate reschedule offers

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { addDays, addHours, format, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';

interface WeatherHoldRequest {
  reason?: string;
  autoGenerateSlots?: boolean;
  proposedDates?: Array<{
    start: string; // ISO timestamp
    end: string;   // ISO timestamp
  }>;
}

/**
 * POST /api/bookings/[id]/weather-hold
 * 
 * Mark a booking as weather hold and optionally generate reschedule offers
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await context.params;

    // Authenticate
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: WeatherHoldRequest = await request.json();
    const { reason, autoGenerateSlots = true, proposedDates } = body;

    // Fetch booking to verify ownership
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, trip_type:trip_types(*)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify captain owns this booking
    if (booking.captain_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your booking' },
        { status: 403 }
      );
    }

    // Verify booking can be put on weather hold
    const validStates = ['confirmed', 'pending_deposit'];
    if (!validStates.includes(booking.status)) {
      return NextResponse.json(
        { error: `Cannot put ${booking.status} booking on weather hold` },
        { status: 400 }
      );
    }

    // Update booking status to weather_hold
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'weather_hold',
        weather_hold_reason: reason || 'Weather conditions require rescheduling',
        original_date_if_rescheduled: booking.scheduled_start, // Preserve original date
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // Create booking log entry
    await supabase
      .from('booking_logs')
      .insert({
        booking_id: bookingId,
        entry_type: 'weather_hold_set',
        description: reason || 'Booking placed on weather hold',
        actor_type: 'captain',
        actor_id: user.id,
        old_value: { status: booking.status },
        new_value: { status: 'weather_hold', reason },
      });

    // Generate reschedule offer slots
    let rescheduleOffers: any[] = [];

    if (autoGenerateSlots && !proposedDates) {
      // Auto-generate slots for next 7 days (same time of day)
      const originalStart = parseISO(booking.scheduled_start);
      const tripDuration = booking.trip_type?.duration_hours || 4;

      // Fetch captain's availability windows
      const dayOfWeek = originalStart.getDay();
      const { data: availabilityWindows } = await supabase
        .from('availability_windows')
        .select('*')
        .eq('owner_id', user.id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (availabilityWindows && availabilityWindows.length > 0) {
        // Generate slots for next 14 days on the same day of week
        const slots: Array<{ start: string; end: string }> = [];
        
        for (let i = 1; i <= 3; i++) { // Next 3 weeks, same day
          const proposedStart = addDays(originalStart, i * 7);
          
          // Skip if in the past
          if (isBefore(proposedStart, new Date())) continue;

          const proposedEnd = addHours(proposedStart, tripDuration);

          slots.push({
            start: proposedStart.toISOString(),
            end: proposedEnd.toISOString(),
          });
        }

        // Insert reschedule offers
        if (slots.length > 0) {
          const { data: offers, error: offerError } = await supabase
            .from('reschedule_offers')
            .insert(
              slots.map(slot => ({
                booking_id: bookingId,
                proposed_start: slot.start,
                proposed_end: slot.end,
                is_selected: false,
                expires_at: addDays(new Date(), 14).toISOString(), // Offers expire in 14 days
              }))
            )
            .select();

          if (!offerError && offers) {
            rescheduleOffers = offers;
          }
        }
      }
    } else if (proposedDates && proposedDates.length > 0) {
      // Use provided proposed dates
      const { data: offers, error: offerError } = await supabase
        .from('reschedule_offers')
        .insert(
          proposedDates.map(slot => ({
            booking_id: bookingId,
            proposed_start: slot.start,
            proposed_end: slot.end,
            is_selected: false,
            expires_at: addDays(new Date(), 14).toISOString(),
          }))
        )
        .select();

      if (!offerError && offers) {
        rescheduleOffers = offers;
      }
    }

    // TODO: Send email/SMS to guest with reschedule link

    return NextResponse.json({
      success: true,
      booking: {
        id: bookingId,
        status: 'weather_hold',
        weather_hold_reason: reason || 'Weather conditions require rescheduling',
      },
      reschedule_offers: rescheduleOffers,
      reschedule_url: rescheduleOffers.length > 0 
        ? `/reschedule/${bookingId}` 
        : null,
    });

  } catch (error) {
    console.error('Error in weather-hold endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bookings/[id]/weather-hold
 * 
 * Remove weather hold status (return to confirmed)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await context.params;

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.captain_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (booking.status !== 'weather_hold') {
      return NextResponse.json(
        { error: 'Booking is not on weather hold' },
        { status: 400 }
      );
    }

    // Remove weather hold
    await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        weather_hold_reason: null,
      })
      .eq('id', bookingId);

    // Delete reschedule offers
    await supabase
      .from('reschedule_offers')
      .delete()
      .eq('booking_id', bookingId);

    // Log it
    await supabase
      .from('booking_logs')
      .insert({
        booking_id: bookingId,
        entry_type: 'status_changed',
        description: 'Weather hold removed, booking confirmed',
        actor_type: 'captain',
        actor_id: user.id,
        old_value: { status: 'weather_hold' },
        new_value: { status: 'confirmed' },
      });

    return NextResponse.json({
      success: true,
      booking: {
        id: bookingId,
        status: 'confirmed',
      },
    });

  } catch (error) {
    console.error('Error removing weather hold:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
