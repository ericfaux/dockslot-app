import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { sendDepositReminder } from '@/lib/email/resend';
import { subHours, format, parseISO } from 'date-fns';

/**
 * Cron job to send deposit reminders
 * Runs daily. Sends reminders for pending_deposit bookings created > 24h ago
 * that haven't already received a deposit reminder.
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
    // Find pending_deposit bookings created more than 24h ago
    const cutoff = subHours(new Date(), 24);

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, guest_name, guest_email, scheduled_start, management_token, captain_id, trip_type_id, vessel_id, deposit_paid_cents, total_price_cents')
      .eq('status', 'pending_deposit')
      .eq('payment_status', 'unpaid')
      .lt('created_at', cutoff.toISOString())
      .is('deposit_reminder_sent_at', null);

    if (bookingsError) {
      console.error('Error fetching bookings for deposit reminders:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ success: true, message: 'No deposit reminders to send', sent: 0 });
    }

    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        // Check captain email preferences
        const { data: prefs } = await supabase
          .from('email_preferences')
          .select('deposit_reminder_enabled, business_name_override, logo_url')
          .eq('captain_id', booking.captain_id)
          .single();

        // Skip if captain disabled deposit reminders
        if (prefs && !prefs.deposit_reminder_enabled) {
          return { bookingId: booking.id, skipped: true };
        }

        // Fetch related data
        const [tripTypeRes, vesselRes, profileRes] = await Promise.all([
          supabase.from('trip_types').select('title, deposit_amount').eq('id', booking.trip_type_id).single(),
          supabase.from('vessels').select('name').eq('id', booking.vessel_id).single(),
          supabase.from('profiles').select('full_name, business_name').eq('id', booking.captain_id).single(),
        ]);

        const tripType = tripTypeRes.data;
        const vessel = vesselRes.data;
        const profile = profileRes.data;
        const managementUrl = `${process.env.NEXT_PUBLIC_APP_URL}/manage/${booking.management_token}`;
        const formattedDate = format(parseISO(booking.scheduled_start), 'EEEE, MMMM d, yyyy');
        const formattedTime = format(parseISO(booking.scheduled_start), 'h:mm a');
        const depositAmount = tripType?.deposit_amount
          ? `$${(tripType.deposit_amount / 100).toFixed(2)}`
          : `$${((booking.total_price_cents - booking.deposit_paid_cents) / 100).toFixed(2)}`;

        const emailResult = await sendDepositReminder({
          to: booking.guest_email,
          guestName: booking.guest_name,
          tripType: tripType?.title || 'Charter Trip',
          date: formattedDate,
          time: formattedTime,
          vessel: vessel?.name || 'Charter Vessel',
          captainName: profile?.full_name || profile?.business_name || 'Your Captain',
          depositAmount,
          paymentUrl: managementUrl,
          businessName: prefs?.business_name_override || profile?.business_name || undefined,
          logoUrl: prefs?.logo_url || undefined,
        });

        if (!emailResult.success) {
          throw new Error(emailResult.error || 'Email send failed');
        }

        // Mark deposit reminder as sent
        await supabase
          .from('bookings')
          .update({ deposit_reminder_sent_at: new Date().toISOString() })
          .eq('id', booking.id);

        // Log
        await supabase.from('booking_logs').insert({
          booking_id: booking.id,
          actor: 'system',
          entry_type: 'guest_communication',
          entry_text: `Deposit reminder email sent to ${booking.guest_email}`,
          metadata: { email_id: emailResult.messageId, email_type: 'deposit_reminder' },
        });

        return { bookingId: booking.id, email: booking.guest_email };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: bookings.length,
      results: results.map((r, i) => ({
        bookingId: bookings[i].id,
        status: r.status,
        error: r.status === 'rejected' ? (r as PromiseRejectedResult).reason?.message : undefined,
      })),
    });
  } catch (error) {
    console.error('Error in send-deposit-reminders cron:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
