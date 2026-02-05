/**
 * Hibernation-related email notifications
 */

import { sendEmail } from './resend';

/**
 * Send "We're Back!" notification to subscribers when hibernation ends
 */
export async function sendHibernationEndNotification(params: {
  to: string;
  subscriberName: string | null;
  businessName: string;
  bookingUrl: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const greeting = params.subscriberName
    ? `Hi ${params.subscriberName}!`
    : 'Hi there!';

  const html = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #10b981, #0f172a);">
        <h1 style="margin: 0; color: #34d399; font-size: 32px;">We're Back!</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">Now Accepting Bookings</p>
      </td>
    </tr>

    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">${greeting}</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          Great news! <strong style="color: #34d399;">${params.businessName}</strong> is back from the off-season and ready to hit the water again.
        </p>

        <div style="background-color: #064e3b; border-left: 4px solid #34d399; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; color: #d1fae5; font-size: 16px; line-height: 1.6;">
            Our booking calendar is now open! Secure your spot before the best dates fill up.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.bookingUrl}" style="display: inline-block; background-color: #34d399; color: #0f172a; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 16px;">
            Book Your Trip Now
          </a>
        </div>

        <p style="margin: 20px 0 0; color: #94a3b8; line-height: 1.6; font-size: 14px; text-align: center;">
          See you on the water!
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 20px; text-align: center; background-color: #0f172a; border-top: 1px solid #334155;">
        <p style="margin: 0 0 10px; color: #64748b; font-size: 12px;">
          You received this email because you signed up to be notified when ${params.businessName} resumed bookings.
        </p>
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
    subject: `${params.businessName} is Back! Book Your Trip Now`,
    html,
  });
}

/**
 * Send notification to captain that hibernation has ended
 */
export async function sendCaptainHibernationEndNotification(params: {
  to: string;
  captainName: string;
  businessName: string;
  subscriberCount: number;
  dashboardUrl: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const subscriberMessage = params.subscriberCount > 0
    ? `We've also sent "We're Back!" notifications to <strong>${params.subscriberCount} subscriber${params.subscriberCount === 1 ? '' : 's'}</strong> who signed up during your off-season.`
    : 'No subscribers signed up during your off-season.';

  const html = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #06b6d4, #0f172a);">
        <h1 style="margin: 0; color: #22d3ee; font-size: 28px;">Hibernation Ended</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">Your Booking Page is Now Live!</p>
      </td>
    </tr>

    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">Hi ${params.captainName}!</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          Your scheduled hibernation period has ended, and <strong style="color: #22d3ee;">${params.businessName}</strong> is now accepting bookings again.
        </p>

        <div style="background-color: #0c4a6e; border-left: 4px solid #22d3ee; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; color: #bae6fd; font-size: 16px; line-height: 1.6;">
            ${subscriberMessage}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.dashboardUrl}" style="display: inline-block; background-color: #22d3ee; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Go to Dashboard
          </a>
        </div>

        <p style="margin: 20px 0 0; color: #94a3b8; line-height: 1.6; font-size: 14px;">
          Welcome back! If you need to extend your hibernation or make any changes, you can do so from your settings page.
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
    subject: `Your Booking Page is Now Live!`,
    html,
  });
}
