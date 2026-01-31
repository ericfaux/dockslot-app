import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { sendEmail } from '@/lib/email/resend';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await context.params;
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch booking with details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        trip_type:trip_types(id, title, duration_hours),
        vessel:vessels(id, name),
        profile:profiles(id, business_name, full_name)
      `)
      .eq('id', bookingId)
      .eq('captain_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if balance is already paid
    if (booking.balance_due_cents === 0) {
      return NextResponse.json(
        { error: 'Balance already paid' },
        { status: 400 }
      );
    }

    // Get guest token for payment link
    const { data: token } = await supabase
      .from('guest_tokens')
      .select('token')
      .eq('booking_id', bookingId)
      .single();

    if (!token) {
      return NextResponse.json(
        { error: 'Guest token not found' },
        { status: 404 }
      );
    }

    const paymentUrl = `${request.nextUrl.origin}/manage/${token.token}?payment=balance`;

    // Send balance payment email
    const emailResult = await sendEmail({
      to: booking.guest_email,
      subject: `💳 Balance Payment Required: ${booking.trip_type.title}`,
      html: balancePaymentEmailTemplate({
        guestName: booking.guest_name,
        tripType: booking.trip_type.title,
        date: new Date(booking.scheduled_start).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        balanceDue: `$${(booking.balance_due_cents / 100).toFixed(2)}`,
        totalPrice: `$${(booking.total_price_cents / 100).toFixed(2)}`,
        depositPaid: `$${(booking.deposit_paid_cents / 100).toFixed(2)}`,
        paymentUrl,
        captainName: booking.profile.business_name || booking.profile.full_name,
      }),
    });

    if (!emailResult.success) {
      console.error('Failed to send balance payment email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email notification' },
        { status: 500 }
      );
    }

    // Log the balance request
    await supabase.from('booking_logs').insert({
      booking_id: bookingId,
      actor: 'captain',
      entry_type: 'balance_payment_requested',
      entry_text: `Balance payment request sent to ${booking.guest_email}`,
      metadata: {
        amount_cents: booking.balance_due_cents,
        email_id: emailResult.messageId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Balance payment request sent',
      emailSent: true,
    });
  } catch (error) {
    console.error('Balance request error:', error);
    return NextResponse.json(
      { error: 'Failed to send balance payment request' },
      { status: 500 }
    );
  }
}

function balancePaymentEmailTemplate(params: {
  guestName: string;
  tripType: string;
  date: string;
  balanceDue: string;
  totalPrice: string;
  depositPaid: string;
  paymentUrl: string;
  captainName: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #0c4a6e, #0f172a);">
        <h1 style="margin: 0; color: #06b6d4; font-size: 28px;">💳 Balance Payment Due</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">Your charter trip is coming up!</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">Hi ${params.guestName},</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          Your <strong>${params.tripType}</strong> charter trip on <strong style="color: #06b6d4;">${params.date}</strong> is coming up soon!
        </p>
        
        <div style="background-color: #0f172a; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin: 0 0 15px; color: #f1f5f9;">Payment Summary</h3>
          <table width="100%" cellpadding="8" cellspacing="0">
            <tr>
              <td style="color: #94a3b8;">Total Price:</td>
              <td style="color: #f1f5f9; text-align: right;">${params.totalPrice}</td>
            </tr>
            <tr>
              <td style="color: #10b981;">Deposit Paid:</td>
              <td style="color: #10b981; text-align: right;">-${params.depositPaid}</td>
            </tr>
            <tr style="border-top: 2px solid #334155;">
              <td style="color: #06b6d4; font-size: 18px; font-weight: 600; padding-top: 12px;">Balance Due:</td>
              <td style="color: #06b6d4; font-size: 18px; font-weight: 600; text-align: right; padding-top: 12px;">${params.balanceDue}</td>
            </tr>
          </table>
        </div>

        <p style="margin: 20px 0; color: #cbd5e1; line-height: 1.6;">
          Please complete your balance payment at your earliest convenience. Your captain is looking forward to having you aboard!
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.paymentUrl}" style="display: inline-block; background-color: #06b6d4; color: #0f172a; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 18px;">
            Pay Balance Now
          </a>
        </div>

        <div style="background-color: #0f172a; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin: 0 0 10px; color: #f1f5f9;">Payment Details</h3>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; line-height: 1.8;">
            <li>Secure payment via Stripe</li>
            <li>Balance due before departure</li>
            <li>Card payments accepted</li>
            <li>Receipt emailed immediately</li>
          </ul>
        </div>

        <p style="margin: 30px 0 0; color: #94a3b8; font-size: 14px; text-align: center;">
          Questions about payment? Contact ${params.captainName} directly or reply to this email.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 20px; text-align: center; background-color: #0f172a; border-top: 1px solid #334155;">
        <p style="margin: 0; color: #64748b; font-size: 12px;">
          Powered by <span style="color: #06b6d4;">DockSlot</span>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
