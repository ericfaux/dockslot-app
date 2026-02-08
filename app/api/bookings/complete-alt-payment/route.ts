import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { sendEmail } from '@/lib/email/resend';
import { format, parseISO } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, paymentMethod } = body;

    if (!bookingId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing bookingId or paymentMethod' },
        { status: 400 }
      );
    }

    if (!['venmo', 'zelle'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceClient();

    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, trip_type:trip_types(id, title, deposit_amount, price_total)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status !== 'pending_deposit' || booking.payment_status !== 'unpaid') {
      return NextResponse.json(
        { error: 'Booking is not awaiting payment' },
        { status: 400 }
      );
    }

    // Get captain profile for auto-confirm setting
    const { data: profile } = await supabase
      .from('profiles')
      .select('auto_confirm_alt_payments, business_name, full_name, email, venmo_username, zelle_contact')
      .eq('id', booking.captain_id)
      .single();

    const autoConfirm = profile?.auto_confirm_alt_payments ?? true;
    const shortId = `DK-${bookingId.slice(0, 4).toUpperCase()}`;

    // Determine booking status based on captain's auto-confirm preference
    const newStatus = autoConfirm ? 'confirmed' : 'pending_deposit';

    // Update the booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: newStatus,
        payment_status: 'pending_verification',
        payment_method: paymentMethod,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // Log the event
    await supabase
      .from('booking_logs')
      .insert({
        booking_id: bookingId,
        entry_type: 'payment_received',
        description: `Guest indicated ${paymentMethod} payment sent. Awaiting captain verification.`,
        new_value: { payment_method: paymentMethod, payment_status: 'pending_verification' },
        actor_type: 'guest',
      });

    // Format date for emails
    const startDate = parseISO(booking.scheduled_start);
    const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
    const formattedTime = format(startDate, 'h:mm a');
    const depositAmount = booking.trip_type?.deposit_amount
      ? `$${booking.trip_type.deposit_amount}`
      : `$${(booking.total_price_cents / 100).toFixed(2)}`;
    const methodLabel = paymentMethod === 'venmo' ? 'Venmo' : 'Zelle';
    const captainName = profile?.business_name || profile?.full_name || 'Captain';

    // Send confirmation email to guest
    const guestEmailHtml = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #0c4a6e, #0f172a);">
        <h1 style="margin: 0; color: #06b6d4; font-size: 28px;">${captainName}</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">Booking Received</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9;">Hi ${booking.guest_name}!</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          Your booking has been received. Please complete your ${methodLabel} payment to confirm your trip.
        </p>

        <div style="background-color: #422006; border-left: 4px solid #fbbf24; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 10px; color: #fde68a;">Complete Your Payment</h3>
          <p style="margin: 5px 0; color: #fde68a;"><strong>Amount:</strong> ${depositAmount}</p>
          <p style="margin: 5px 0; color: #fde68a;"><strong>Method:</strong> ${methodLabel}</p>
          <p style="margin: 5px 0; color: #fde68a;"><strong>Send to:</strong> ${paymentMethod === 'venmo' ? `@${(profile?.venmo_username || '').replace(/^@/, '')}` : profile?.zelle_contact || ''}</p>
          <p style="margin: 5px 0; color: #fde68a;"><strong>Reference:</strong> ${shortId}</p>
          <p style="margin: 15px 0 0; color: #fbbf24; font-size: 13px; font-weight: 600;">Please send within 24 hours</p>
        </div>

        <div style="background-color: #0f172a; border-left: 4px solid #06b6d4; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 15px; color: #06b6d4;">Trip Details</h3>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Trip:</strong> ${booking.trip_type?.title || 'Charter'}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Date:</strong> ${formattedDate} at ${formattedTime}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Party Size:</strong> ${booking.party_size} guests</p>
        </div>

        <p style="margin: 20px 0; color: #94a3b8; font-size: 13px;">
          Your booking is confirmed pending payment verification. The captain will verify receipt of your ${methodLabel} payment.
        </p>
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
      subject: `Booking Received — Complete Your ${methodLabel} Payment`,
      html: guestEmailHtml,
    });

    // Send notification email to captain
    if (profile?.email) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.dockslot.com';
      const verifyUrl = `${baseUrl}/dashboard/bookings?detail=${bookingId}`;

      const captainEmailHtml = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #92400e, #0f172a);">
        <h1 style="margin: 0; color: #fbbf24; font-size: 28px;">New Booking — Verify Payment</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9;">New booking from ${booking.guest_name}</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          A guest has booked a trip and indicated they sent a ${methodLabel} payment.
        </p>

        <div style="background-color: #422006; border-left: 4px solid #fbbf24; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 10px; color: #fde68a;">Verify ${methodLabel} Payment</h3>
          <p style="margin: 5px 0; color: #fde68a;"><strong>Amount:</strong> ${depositAmount}</p>
          <p style="margin: 5px 0; color: #fde68a;"><strong>Booking Ref:</strong> ${shortId}</p>
          <p style="margin: 5px 0; color: #fde68a;"><strong>Guest:</strong> ${booking.guest_name}</p>
        </div>

        <div style="background-color: #0f172a; border-left: 4px solid #06b6d4; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Trip:</strong> ${booking.trip_type?.title || 'Charter'}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Date:</strong> ${formattedDate} at ${formattedTime}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Party Size:</strong> ${booking.party_size}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background-color: #fbbf24; color: #0f172a; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 700;">
            Verify Payment
          </a>
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
        to: profile.email,
        subject: `New Booking — Verify ${methodLabel} Payment of ${depositAmount}`,
        html: captainEmailHtml,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing alt payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
