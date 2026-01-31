// app/api/bookings/[id]/reschedule/route.ts
// Guest reschedule API - allows guest to select from offered slots
// Public endpoint (no auth, booking ID is the security)

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';

interface RescheduleRequest {
  offer_id: string;
}

/**
 * POST /api/bookings/[id]/reschedule
 * 
 * Guest selects a reschedule offer and updates their booking
 * Public endpoint - anyone with booking ID can reschedule (intentional for guest convenience)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await context.params;
    const body: RescheduleRequest = await request.json();
    const { offer_id } = body;

    if (!offer_id) {
      return NextResponse.json(
        { error: 'offer_id is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceClient();

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify booking is on weather hold
    if (booking.status !== 'weather_hold') {
      return NextResponse.json(
        { error: 'Booking is not on weather hold' },
        { status: 400 }
      );
    }

    // Fetch the selected offer
    const { data: offer, error: offerError } = await supabase
      .from('reschedule_offers')
      .select('*')
      .eq('id', offer_id)
      .eq('booking_id', bookingId)
      .single();

    if (offerError || !offer) {
      return NextResponse.json(
        { error: 'Reschedule offer not found' },
        { status: 404 }
      );
    }

    // Verify offer hasn't been selected yet
    if (offer.is_selected) {
      return NextResponse.json(
        { error: 'This offer has already been selected' },
        { status: 400 }
      );
    }

    // Update booking with new dates and status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        scheduled_start: offer.proposed_start,
        scheduled_end: offer.proposed_end,
        status: 'rescheduled',
        weather_hold_reason: null, // Clear the hold reason
        // Keep original_date_if_rescheduled as is (already set when weather hold was created)
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // Mark the selected offer
    await supabase
      .from('reschedule_offers')
      .update({ is_selected: true })
      .eq('id', offer_id);

    // Delete other offers (no longer needed)
    await supabase
      .from('reschedule_offers')
      .delete()
      .eq('booking_id', bookingId)
      .neq('id', offer_id);

    // Create booking log entry
    await supabase
      .from('booking_logs')
      .insert({
        booking_id: bookingId,
        entry_type: 'rescheduled',
        description: `Guest rescheduled to ${offer.proposed_start}`,
        actor_type: 'guest',
        old_value: {
          scheduled_start: booking.scheduled_start,
          scheduled_end: booking.scheduled_end,
          status: 'weather_hold',
        },
        new_value: {
          scheduled_start: offer.proposed_start,
          scheduled_end: offer.proposed_end,
          status: 'rescheduled',
        },
      });

    // TODO: Send confirmation email to guest
    // TODO: Send notification to captain

    return NextResponse.json({
      success: true,
      booking: {
        id: bookingId,
        status: 'rescheduled',
        scheduled_start: offer.proposed_start,
        scheduled_end: offer.proposed_end,
      },
      message: 'Booking successfully rescheduled',
    });

  } catch (error) {
    console.error('Error in reschedule endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
