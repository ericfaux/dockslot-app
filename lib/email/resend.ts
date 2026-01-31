/**
 * Email service using Resend
 * Free tier: 3,000 emails/month, 100 emails/day
 * Setup: Add RESEND_API_KEY to environment variables
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const DEFAULT_FROM = 'DockSlot <bookings@dockslot.app>';

export async function sendEmail({ to, subject, html, from = DEFAULT_FROM }: EmailParams): Promise<{
  success: boolean;
  error?: string;
  messageId?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation(params: {
  to: string;
  guestName: string;
  tripType: string;
  date: string;
  time: string;
  vessel: string;
  meetingSpot: string;
  captainName: string;
  totalPrice: string;
  depositPaid: string;
  balanceDue: string;
  managementUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #0c4a6e, #0f172a);">
        <h1 style="margin: 0; color: #06b6d4; font-size: 28px;">⚓ DockSlot</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">Charter Booking Confirmed</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">Hi ${params.guestName}! 🎉</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          Your charter trip is confirmed! We can't wait to have you aboard.
        </p>
        
        <div style="background-color: #0f172a; border-left: 4px solid #06b6d4; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px; color: #06b6d4;">Trip Details</h3>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Trip:</strong> ${params.tripType}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Date & Time:</strong> ${params.date} at ${params.time}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Vessel:</strong> ${params.vessel}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Captain:</strong> ${params.captainName}</p>
        </div>

        <div style="background-color: #0f172a; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px; color: #10b981;">Meeting Location</h3>
          <p style="margin: 0; color: #cbd5e1;">${params.meetingSpot}</p>
        </div>

        <div style="background-color: #0f172a; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px; color: #f1f5f9;">Payment Summary</h3>
          <p style="margin: 5px 0; color: #cbd5e1;">Total: ${params.totalPrice}</p>
          <p style="margin: 5px 0; color: #10b981;"><strong>Deposit Paid: ${params.depositPaid}</strong></p>
          <p style="margin: 5px 0; color: #06b6d4; font-size: 18px;"><strong>Balance Due: ${params.balanceDue}</strong></p>
          <p style="margin: 10px 0 0; color: #94a3b8; font-size: 12px;">Balance due at time of trip</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.managementUrl}" style="display: inline-block; background-color: #06b6d4; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Booking Details
          </a>
        </div>
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

  return sendEmail({
    to: params.to,
    subject: `⚓ Booking Confirmed: ${params.tripType} on ${params.date}`,
    html,
  });
}

/**
 * Send weather hold notification email
 */
export async function sendWeatherHoldNotification(params: {
  to: string;
  guestName: string;
  tripType: string;
  originalDate: string;
  reason: string;
  rescheduleUrl: string;
  captainName: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #713f12, #0f172a);">
        <h1 style="margin: 0; color: #fbbf24; font-size: 28px;">⚠️ Weather Hold</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">Trip Rescheduling Required</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">Hi ${params.guestName},</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          Due to weather conditions, your trip on <strong style="color: #fbbf24;">${params.originalDate}</strong> has been placed on weather hold for your safety.
        </p>
        
        <div style="background-color: #422006; border-left: 4px solid #fbbf24; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; color: #fde68a; font-style: italic;">"${params.reason}"</p>
          <p style="margin: 15px 0 0; color: #cbd5e1; font-size: 13px;">— Captain ${params.captainName}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.rescheduleUrl}" style="display: inline-block; background-color: #fbbf24; color: #0f172a; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 700;">
            Choose a New Date
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
</html>
  `;

  return sendEmail({
    to: params.to,
    subject: `⚠️ Weather Hold: ${params.tripType} - Action Required`,
    html,
  });
}
