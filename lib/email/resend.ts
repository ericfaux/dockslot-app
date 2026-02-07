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
    console.warn('RESEND_API_KEY not configured — skipping email send');
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
  meetingSpotInstructions?: string;
  captainName: string;
  captainPhone?: string;
  totalPrice: string;
  depositPaid: string;
  balanceDue: string;
  managementUrl: string;
  waiverUrl?: string;
  cancellationPolicy?: string;
  whatToBring?: string;
  businessName?: string;
  logoUrl?: string;
  emailSignature?: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const whatToBringItems = params.whatToBring
    ? params.whatToBring.split('\n').filter(Boolean).map(item => `<li>${item.trim()}</li>`).join('')
    : `<li>Photo ID</li><li>Sunscreen &amp; sunglasses</li><li>Light jacket or windbreaker</li><li>Camera or phone for photos</li><li>Any medications you may need</li>`;

  const displayName = params.businessName || params.captainName;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #0c4a6e, #0f172a);">
        ${params.logoUrl ? `<img src="${params.logoUrl}" alt="${displayName}" style="max-height: 60px; margin-bottom: 10px;">` : ''}
        <h1 style="margin: 0; color: #06b6d4; font-size: 28px;">${displayName}</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">Charter Booking Confirmed</p>
      </td>
    </tr>

    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">Hi ${params.guestName}!</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          Your charter trip is confirmed! We can't wait to have you aboard.
        </p>

        <div style="background-color: #0f172a; border-left: 4px solid #06b6d4; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 15px; color: #06b6d4;">Trip Details</h3>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Trip:</strong> ${params.tripType}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Date &amp; Time:</strong> ${params.date} at ${params.time}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Vessel:</strong> ${params.vessel}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Captain:</strong> ${params.captainName}</p>
          ${params.captainPhone ? `<p style="margin: 5px 0; color: #cbd5e1;"><strong>Contact:</strong> ${params.captainPhone}</p>` : ''}
        </div>

        <div style="background-color: #0f172a; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 10px; color: #10b981;">Meeting Location</h3>
          <p style="margin: 0 0 5px; color: #cbd5e1; font-size: 16px;">${params.meetingSpot}</p>
          ${params.meetingSpotInstructions ? `<p style="margin: 10px 0 0; color: #94a3b8; font-size: 13px; font-style: italic;">${params.meetingSpotInstructions}</p>` : ''}
        </div>

        ${params.waiverUrl ? `
        <div style="background-color: #422006; border-left: 4px solid #fbbf24; padding: 15px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0 0 10px; color: #fde68a; font-size: 14px;">
            <strong>Waiver Required:</strong> Please sign the liability waiver before your trip.
          </p>
          <a href="${params.waiverUrl}" style="color: #fbbf24; text-decoration: underline; font-weight: 600;">Sign Waiver Now</a>
        </div>
        ` : ''}

        <div style="background-color: #0f172a; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 15px; color: #f1f5f9;">Payment Summary</h3>
          <p style="margin: 5px 0; color: #cbd5e1;">Total: ${params.totalPrice}</p>
          <p style="margin: 5px 0; color: #10b981;"><strong>Deposit Paid: ${params.depositPaid}</strong></p>
          <p style="margin: 5px 0; color: #06b6d4; font-size: 18px;"><strong>Balance Due: ${params.balanceDue}</strong></p>
          <p style="margin: 10px 0 0; color: #94a3b8; font-size: 12px;">Balance due at time of trip</p>
        </div>

        <div style="background-color: #0f172a; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 15px; color: #f1f5f9;">What to Bring</h3>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; line-height: 1.8;">
            ${whatToBringItems}
          </ul>
        </div>

        ${params.cancellationPolicy ? `
        <div style="background-color: #0f172a; padding: 15px; margin: 20px 0; border-radius: 6px; border: 1px solid #334155;">
          <h4 style="margin: 0 0 8px; color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Cancellation Policy</h4>
          <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">${params.cancellationPolicy}</p>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.managementUrl}" style="display: inline-block; background-color: #06b6d4; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Booking Details
          </a>
        </div>

        ${params.emailSignature ? `
        <div style="margin: 20px 0 0; padding-top: 15px; border-top: 1px solid #334155;">
          <p style="margin: 0; color: #94a3b8; font-size: 13px; white-space: pre-line;">${params.emailSignature}</p>
        </div>
        ` : ''}
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
    subject: `Booking Confirmed: ${params.tripType} on ${params.date}`,
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
          <p style="margin: 15px 0 0; color: #cbd5e1; font-size: 13px;">— ${params.captainName}</p>
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

/**
 * Send refund notification email
 */
export async function sendRefundNotification(params: {
  to: string;
  guestName: string;
  tripType: string;
  date: string;
  refundAmount: string;
  reason: string;
  managementUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #581c87, #0f172a);">
        <h1 style="margin: 0; color: #c084fc; font-size: 28px;">💰 Refund Processed</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">Payment Refund Notification</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">Hi ${params.guestName},</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          A refund has been processed for your booking.
        </p>
        
        <div style="background-color: #581c87; border-left: 4px solid: #c084fc; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 15px; color: #e9d5ff;">Refund Details</h3>
          <p style="margin: 5px 0; color: #f3e8ff;"><strong>Trip:</strong> ${params.tripType}</p>
          <p style="margin: 5px 0; color: #f3e8ff;"><strong>Date:</strong> ${params.date}</p>
          <p style="margin: 15px 0 5px; color: #c084fc; font-size: 24px;"><strong>${params.refundAmount}</strong></p>
          <p style="margin: 0; color: #e9d5ff; font-size: 12px;">Refund amount</p>
        </div>

        <div style="background-color: #0f172a; border-left: 4px solid #64748b; padding: 20px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px; color: #94a3b8;">Reason</h4>
          <p style="margin: 0; color: #cbd5e1; font-style: italic;">${params.reason}</p>
        </div>

        <p style="margin: 20px 0; color: #cbd5e1; line-height: 1.6;">
          The refund will appear in your original payment method within 5-10 business days.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.managementUrl}" style="display: inline-block; background-color: #c084fc; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
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
    subject: `💰 Refund Processed: ${params.tripType}`,
    html,
  });
}

/**
 * Send reschedule confirmation email
 */
export async function sendRescheduleConfirmation(params: {
  to: string;
  guestName: string;
  tripType: string;
  oldDate: string;
  newDate: string;
  newTime: string;
  vessel: string;
  managementUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #10b981, #0f172a);">
        <h1 style="margin: 0; color: #34d399; font-size: 28px;">✓ Trip Rescheduled</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">New Date Confirmed</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">Hi ${params.guestName}!</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          Your trip has been successfully rescheduled. We're excited to have you aboard on the new date!
        </p>
        
        <div style="background-color: #0f172a; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #fca5a5; font-size: 14px;"><strong>Original Date:</strong></p>
          <p style="margin: 5px 0 0; color: #f87171; text-decoration: line-through;">${params.oldDate}</p>
        </div>

        <div style="background-color: #064e3b; border-left: 4px solid #34d399; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px; color: #34d399;">New Trip Details</h3>
          <p style="margin: 5px 0; color: #d1fae5;"><strong>Trip:</strong> ${params.tripType}</p>
          <p style="margin: 5px 0; color: #d1fae5;"><strong>Date & Time:</strong> ${params.newDate} at ${params.newTime}</p>
          <p style="margin: 5px 0; color: #d1fae5;"><strong>Vessel:</strong> ${params.vessel}</p>
        </div>

        <p style="margin: 20px 0; color: #cbd5e1; line-height: 1.6;">
          Your payment and all other booking details remain the same.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.managementUrl}" style="display: inline-block; background-color: #34d399; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Updated Booking
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
    subject: `✓ Trip Rescheduled: ${params.tripType} - New Date ${params.newDate}`,
    html,
  });
}

/**
 * Send balance payment confirmation email  
 */
export async function sendBalancePaymentConfirmation(params: {
  to: string;
  guestName: string;
  tripType: string;
  date: string;
  amountPaid: string;
  managementUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #10b981, #0f172a);">
        <h1 style="margin: 0; color: #34d399; font-size: 28px;">✓ Payment Received</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">Balance Payment Confirmed</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">Hi ${params.guestName}!</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          Thank you! We've received your balance payment. You're all set for your trip!
        </p>
        
        <div style="background-color: #064e3b; border-left: 4px solid #34d399; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px; color: #34d399;">Payment Details</h3>
          <p style="margin: 5px 0; color: #d1fae5;"><strong>Trip:</strong> ${params.tripType}</p>
          <p style="margin: 5px 0; color: #d1fae5;"><strong>Date:</strong> ${params.date}</p>
          <p style="margin: 15px 0 5px; color: #34d399; font-size: 24px;"><strong>${params.amountPaid}</strong></p>
          <p style="margin: 0; color: #6ee7b7; font-size: 12px;">Balance payment received</p>
        </div>

        <div style="background-color: #10b981; padding: 15px; margin: 20px 0; border-radius: 6px; text-align: center;">
          <p style="margin: 0; color: #064e3b; font-weight: 600; font-size: 16px;">✓ FULLY PAID</p>
        </div>

        <p style="margin: 20px 0; color: #cbd5e1; line-height: 1.6;">
          We can't wait to see you on the water. See you soon!
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.managementUrl}" style="display: inline-block; background-color: #34d399; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
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
    subject: `✓ Payment Received: ${params.tripType} - Fully Paid!`,
    html,
  });
}

/**
 * Send custom message to guest
 */
export async function sendCustomGuestMessage(params: {
  to: string;
  guestName: string;
  subject: string;
  message: string;
  bookingId: string;
}) {
  const messageHtml = params.message.replace(/\n/g, '<br>');
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ⚓ Message from Your Captain
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Hi ${params.guestName},
              </p>
              
              <div style="margin: 24px 0; padding: 20px; background-color: #0f172a; border-left: 4px solid #06b6d4; border-radius: 6px;">
                <p style="margin: 0; color: #e2e8f0; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">
${messageHtml}
                </p>
              </div>

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #334155;">
                <p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px;">
                  Questions or need to reach us?
                </p>
                <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                  Simply reply to this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #0f172a; border-top: 1px solid #334155;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                Powered by <span style="color: #06b6d4;">DockSlot</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: params.to,
    subject: params.subject,
    html,
  });
}

/**
 * Send deposit reminder email
 * For pending_deposit bookings that haven't paid within 24h
 */
export async function sendDepositReminder(params: {
  to: string;
  guestName: string;
  tripType: string;
  date: string;
  time: string;
  vessel: string;
  captainName: string;
  depositAmount: string;
  paymentUrl: string;
  businessName?: string;
  logoUrl?: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const displayName = params.businessName || params.captainName;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #92400e, #0f172a);">
        ${params.logoUrl ? `<img src="${params.logoUrl}" alt="${displayName}" style="max-height: 60px; margin-bottom: 10px;">` : ''}
        <h1 style="margin: 0; color: #fbbf24; font-size: 28px;">Deposit Reminder</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">Complete Your Booking</p>
      </td>
    </tr>

    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">Hi ${params.guestName},</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          We noticed your deposit for the upcoming charter trip is still pending. Please complete your payment to secure your spot!
        </p>

        <div style="background-color: #0f172a; border-left: 4px solid #06b6d4; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 15px; color: #06b6d4;">Trip Details</h3>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Trip:</strong> ${params.tripType}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Date &amp; Time:</strong> ${params.date} at ${params.time}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Vessel:</strong> ${params.vessel}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Captain:</strong> ${params.captainName}</p>
        </div>

        <div style="background-color: #422006; border-left: 4px solid #fbbf24; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0 0 5px; color: #fde68a; font-size: 14px;">Deposit Required</p>
          <p style="margin: 0; color: #fbbf24; font-size: 28px; font-weight: 700;">${params.depositAmount}</p>
          <p style="margin: 10px 0 0; color: #fde68a; font-size: 13px;">Your spot is not confirmed until the deposit is received.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.paymentUrl}" style="display: inline-block; background-color: #fbbf24; color: #0f172a; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 16px;">
            Pay Deposit Now
          </a>
        </div>

        <p style="margin: 20px 0 0; color: #94a3b8; font-size: 13px; text-align: center;">
          If you've already paid or no longer wish to book, you can ignore this email.
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

  return sendEmail({
    to: params.to,
    subject: `Deposit Reminder: ${params.tripType} on ${params.date}`,
    html,
  });
}

/**
 * Send cancellation confirmation email
 */
export async function sendCancellationConfirmation(params: {
  to: string;
  guestName: string;
  tripType: string;
  date: string;
  time: string;
  vessel: string;
  captainName: string;
  reason?: string;
  refundInfo?: string;
  managementUrl: string;
  businessName?: string;
  logoUrl?: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const displayName = params.businessName || params.captainName;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #991b1b, #0f172a);">
        ${params.logoUrl ? `<img src="${params.logoUrl}" alt="${displayName}" style="max-height: 60px; margin-bottom: 10px;">` : ''}
        <h1 style="margin: 0; color: #fca5a5; font-size: 28px;">Booking Cancelled</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">Cancellation Confirmation</p>
      </td>
    </tr>

    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">Hi ${params.guestName},</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          Your booking has been cancelled. Here are the details:
        </p>

        <div style="background-color: #0f172a; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 15px; color: #fca5a5;">Cancelled Trip</h3>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Trip:</strong> ${params.tripType}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Date &amp; Time:</strong> ${params.date} at ${params.time}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Vessel:</strong> ${params.vessel}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Captain:</strong> ${params.captainName}</p>
        </div>

        ${params.reason ? `
        <div style="background-color: #0f172a; border-left: 4px solid #64748b; padding: 15px; margin: 20px 0; border-radius: 6px;">
          <h4 style="margin: 0 0 8px; color: #94a3b8;">Reason</h4>
          <p style="margin: 0; color: #cbd5e1; font-style: italic;">${params.reason}</p>
        </div>
        ` : ''}

        ${params.refundInfo ? `
        <div style="background-color: #064e3b; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 6px;">
          <h4 style="margin: 0 0 8px; color: #10b981;">Refund Information</h4>
          <p style="margin: 0; color: #d1fae5;">${params.refundInfo}</p>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.managementUrl}" style="display: inline-block; background-color: #06b6d4; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Booking Details
          </a>
        </div>

        <p style="margin: 20px 0 0; color: #94a3b8; font-size: 14px; text-align: center;">
          We hope to see you on the water in the future!
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

  return sendEmail({
    to: params.to,
    subject: `Booking Cancelled: ${params.tripType} on ${params.date}`,
    html,
  });
}
