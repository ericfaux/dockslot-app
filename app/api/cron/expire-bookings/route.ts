import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';

/**
 * Cron job to expire overdue pending_deposit bookings.
 * Finds all bookings with status 'pending_deposit' where scheduled_start
 * is in the past and transitions them to 'expired'.
 *
 * Runs daily at 6:00 AM UTC.
 * Security: CRON_SECRET bearer token check.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createSupabaseServiceClient();

  try {
    const now = new Date().toISOString();

    // Find all pending_deposit bookings with past scheduled_start
    const { data: overdueBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, guest_name, captain_id')
      .eq('status', 'pending_deposit')
      .lt('scheduled_start', now);

    if (fetchError) {
      console.error('Error fetching overdue bookings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch overdue bookings', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!overdueBookings || overdueBookings.length === 0) {
      return NextResponse.json({
        success: true,
        expired: 0,
        message: 'No overdue bookings found',
      });
    }

    const bookingIds = overdueBookings.map((b) => b.id);

    // Batch update all overdue bookings to expired
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .in('id', bookingIds);

    if (updateError) {
      console.error('Error expiring bookings:', updateError);
      return NextResponse.json(
        { error: 'Failed to expire bookings', details: updateError.message },
        { status: 500 }
      );
    }

    // Log each expiration
    const logEntries = overdueBookings.map((booking) => ({
      booking_id: booking.id,
      entry_type: 'status_changed',
      description: 'Booking expired — deposit not received before scheduled date',
      old_value: { status: 'pending_deposit' },
      new_value: { status: 'expired' },
      actor_type: 'system',
      actor_id: null,
    }));

    const { error: logError } = await supabase
      .from('booking_logs')
      .insert(logEntries);

    if (logError) {
      console.error('Error logging expired bookings:', logError);
    }

    console.log(`Expire bookings cron: ${bookingIds.length} booking(s) expired`);

    return NextResponse.json({
      success: true,
      expired: bookingIds.length,
      bookingIds,
    });
  } catch (error) {
    console.error('Error in expire-bookings cron job:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
