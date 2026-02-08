import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { sendEmail } from '@/lib/email/resend';
import { format, parseISO } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const body = await request.json();
    const { bookingId, action } = body;

    if (!bookingId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['confirm', 'remind', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();

    // Get booking with trip type
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, trip_type:trip_types(id, title, deposit_amount, price_total)')
      .eq('id', bookingId)
      .eq('captain_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get captain profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, full_name, email, venmo_username, zelle_contact')
      .eq('id', user.id)
      .single();

    const shortId = `DK-${bookingId.slice(0, 4).toUpperCase()}`;
    const captainName = profile?.business_name || profile?.full_name || 'Captain';
    const methodLabel = booking.payment_method === 'venmo' ? 'Venmo' : booking.payment_method === 'zelle' ? 'Zelle' : 'Payment';
    const startDate = parseISO(booking.scheduled_start);
    const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
    const formattedTime = format(startDate, 'h:mm a');

    if (action === 'confirm') {
      const depositAmountCents = booking.trip_type
        ? Math.round(booking.trip_type.deposit_amount * 100)
        : booking.total_price_cents;
      const isFullPayment = depositAmountCents >= booking.total_price_cents;
      const newPaymentStatus = isFullPayment ? 'fully_paid' : 'deposit_paid';

      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: newPaymentStatus,
          deposit_paid_cents: depositAmountCents,
          balance_due_cents: Math.max(0, booking.total_price_cents - depositAmountCents),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
      }

      // Log
      await supabase.from('booking_logs').insert({
        booking_id: bookingId,
        entry_type: 'payment_received',
        description: `Captain confirmed ${methodLabel} payment received.`,
        new_value: { payment_status: newPaymentStatus, confirmed_by: user.id },
        actor_type: 'captain',
        actor_id: user.id,
      });

      // Send confirmation to guest
      const guestHtml = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #064e3b, #0f172a);">
        <h1 style="margin: 0; color: #10b981; font-size: 28px;">Payment Confirmed!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9;">Hi ${booking.guest_name}!</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          ${captainName} has confirmed receipt of your ${methodLabel} payment. Your trip is confirmed!
        </p>
        <div style="background-color: #064e3b; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 10px; color: #6ee7b7;">Trip Confirmed</h3>
          <p style="margin: 5px 0; color: #a7f3d0;"><strong>Trip:</strong> ${booking.trip_type?.title || 'Charter'}</p>
          <p style="margin: 5px 0; color: #a7f3d0;"><strong>Date:</strong> ${formattedDate} at ${formattedTime}</p>
          <p style="margin: 5px 0; color: #a7f3d0;"><strong>Reference:</strong> ${shortId}</p>
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

      await sendEmail({
        to: booking.guest_email,
        subject: `Payment Confirmed — Your Trip is Booked!`,
        html: guestHtml,
      });

      return NextResponse.json({ success: true, action: 'confirmed' });
    }

    if (action === 'remind') {
      // Check reminder count
      if ((booking.payment_reminder_count || 0) >= 2) {
        return NextResponse.json({
          error: 'Maximum reminders (2) already sent',
        }, { status: 400 });
      }

      const paymentContact = booking.payment_method === 'venmo'
        ? `@${(profile?.venmo_username || '').replace(/^@/, '')}`
        : profile?.zelle_contact || '';
      const depositAmount = booking.trip_type?.deposit_amount
        ? `$${booking.trip_type.deposit_amount}`
        : `$${(booking.total_price_cents / 100).toFixed(2)}`;

      const reminderHtml = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #92400e, #0f172a);">
        <h1 style="margin: 0; color: #fbbf24; font-size: 28px;">Payment Reminder</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9;">Hi ${booking.guest_name}!</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          Just a friendly reminder to complete your ${methodLabel} payment for your upcoming trip with ${captainName}.
        </p>
        <div style="background-color: #422006; border-left: 4px solid #fbbf24; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 10px; color: #fde68a;">Payment Details</h3>
          <p style="margin: 5px 0; color: #fde68a;"><strong>Amount:</strong> ${depositAmount}</p>
          <p style="margin: 5px 0; color: #fde68a;"><strong>Send ${methodLabel} to:</strong> ${paymentContact}</p>
          <p style="margin: 5px 0; color: #fde68a;"><strong>Reference:</strong> ${shortId}</p>
        </div>
        <div style="background-color: #0f172a; border-left: 4px solid #06b6d4; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Trip:</strong> ${booking.trip_type?.title || 'Charter'}</p>
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

      await sendEmail({
        to: booking.guest_email,
        subject: `Payment Reminder — Your Upcoming Trip`,
        html: reminderHtml,
      });

      // Update reminder count
      await supabase
        .from('bookings')
        .update({
          payment_reminder_count: (booking.payment_reminder_count || 0) + 1,
          payment_reminder_last_sent: new Date().toISOString(),
        })
        .eq('id', bookingId);

      await supabase.from('booking_logs').insert({
        booking_id: bookingId,
        entry_type: 'guest_communication',
        description: `Payment reminder sent to guest via email.`,
        actor_type: 'captain',
        actor_id: user.id,
      });

      return NextResponse.json({ success: true, action: 'reminded' });
    }

    if (action === 'cancel') {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          internal_notes: `${booking.internal_notes ? booking.internal_notes + '\n' : ''}Cancelled: ${methodLabel} payment not received.`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
      }

      await supabase.from('booking_logs').insert({
        booking_id: bookingId,
        entry_type: 'status_changed',
        description: `Booking cancelled due to ${methodLabel} payment not received.`,
        old_value: { status: booking.status },
        new_value: { status: 'cancelled' },
        actor_type: 'captain',
        actor_id: user.id,
      });

      return NextResponse.json({ success: true, action: 'cancelled' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
