import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { sendEmail } from '@/lib/email/resend';
import { format, parseISO } from 'date-fns';

/**
 * Cron job: Send automatic payment reminders for Venmo/Zelle bookings
 * that have been pending_verification for more than 24 hours.
 * Max 2 reminders per booking.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Find bookings with pending_verification older than 24h and fewer than 2 reminders
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id, guest_name, guest_email, total_price_cents, payment_method,
      created_at, scheduled_start, payment_reminder_count, last_payment_reminder_at,
      captain_id,
      trip_type:trip_types(title)
    `)
    .eq('payment_status', 'pending_verification')
    .lt('created_at', oneDayAgo)
    .lt('payment_reminder_count', 2)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    console.error('Error fetching pending bookings:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No reminders needed' });
  }

  let sentCount = 0;

  for (const booking of bookings) {
    // Don't send if last reminder was less than 24h ago
    if (booking.last_payment_reminder_at) {
      const lastReminder = new Date(booking.last_payment_reminder_at).getTime();
      if (Date.now() - lastReminder < 24 * 60 * 60 * 1000) {
        continue;
      }
    }

    // Get captain profile for payment info
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, full_name, venmo_username, zelle_contact')
      .eq('id', booking.captain_id)
      .single();

    const captainName = profile?.business_name || profile?.full_name || 'Captain';
    const methodLabel = booking.payment_method === 'venmo' ? 'Venmo' : 'Zelle';
    const paymentContact = booking.payment_method === 'venmo'
      ? `@${(profile?.venmo_username || '').replace(/^@/, '')}`
      : profile?.zelle_contact || '';
    const amount = `$${(booking.total_price_cents / 100).toFixed(2)}`;
    const shortId = `DK-${booking.id.slice(0, 4).toUpperCase()}`;
    const startDate = parseISO(booking.scheduled_start);
    const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
    const formattedTime = format(startDate, 'h:mm a');

    const html = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #92400e, #0f172a);">
        <h1 style="margin: 0; color: #fbbf24; font-size: 28px;">Payment Reminder</h1>
        <p style="margin: 10px 0 0; color: #fde68a;">Your Upcoming Trip</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9;">Hi ${booking.guest_name}!</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          Just a friendly reminder to complete your ${methodLabel} payment for your upcoming trip with ${captainName}.
          We want to make sure your spot is secured!
        </p>
        <div style="background-color: #422006; border-left: 4px solid #fbbf24; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 10px; color: #fde68a;">Payment Details</h3>
          <p style="margin: 5px 0; color: #fde68a;"><strong>Amount:</strong> ${amount}</p>
          <p style="margin: 5px 0; color: #fde68a;"><strong>Send ${methodLabel} to:</strong> ${paymentContact}</p>
          <p style="margin: 5px 0; color: #fde68a;"><strong>Reference:</strong> ${shortId}</p>
        </div>
        <div style="background-color: #0f172a; border-left: 4px solid #06b6d4; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Trip:</strong> ${(booking.trip_type as any)?.title || 'Charter'}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Date:</strong> ${formattedDate} at ${formattedTime}</p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; background-color: #0f172a; border-top: 1px solid #334155;">
        <p style="margin: 0; color: #64748b; font-size: 12px;">Powered by <span style="color: #06b6d4;">DockSlot</span></p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await sendEmail({
        to: booking.guest_email,
        subject: `Payment Reminder — Your Upcoming Trip with ${captainName}`,
        html,
      });

      // Update reminder count
      await supabase
        .from('bookings')
        .update({
          payment_reminder_count: (booking.payment_reminder_count || 0) + 1,
          last_payment_reminder_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      // Log
      await supabase.from('booking_logs').insert({
        booking_id: booking.id,
        entry_type: 'guest_communication',
        description: `Auto payment reminder #${(booking.payment_reminder_count || 0) + 1} sent.`,
        actor_type: 'system',
      });

      sentCount++;
    } catch (err) {
      console.error(`Failed to send reminder for booking ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ sent: sentCount, total: bookings.length });
}
