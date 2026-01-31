/**
 * Trip reminder email template
 * Sent 24 hours before scheduled departure
 */

import { sendEmail } from './resend';

export async function sendTripReminder(params: {
  to: string;
  guestName: string;
  tripType: string;
  date: string;
  time: string;
  vessel: string;
  meetingSpot: string;
  captainName: string;
  captainPhone?: string;
  passengerCount: number;
  managementUrl: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #0c4a6e, #0f172a);">
        <h1 style="margin: 0; color: #06b6d4; font-size: 28px;">⚓ Trip Reminder</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">Your charter is tomorrow!</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">Hi ${params.guestName}! 🎉</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          This is a friendly reminder that your <strong>${params.tripType}</strong> charter is tomorrow!
        </p>
        
        <div style="background-color: #0c4a6e; border-left: 4px solid #06b6d4; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 15px; color: #06b6d4;">Trip Details</h3>
          <p style="margin: 5px 0; color: #e0f2fe;"><strong>Date:</strong> ${params.date}</p>
          <p style="margin: 5px 0; color: #e0f2fe;"><strong>Time:</strong> ${params.time}</p>
          <p style="margin: 5px 0; color: #e0f2fe;"><strong>Vessel:</strong> ${params.vessel}</p>
          <p style="margin: 5px 0; color: #e0f2fe;"><strong>Party Size:</strong> ${params.passengerCount} ${params.passengerCount === 1 ? 'guest' : 'guests'}</p>
          <p style="margin: 5px 0; color: #e0f2fe;"><strong>Captain:</strong> ${params.captainName}</p>
          ${params.captainPhone ? `<p style="margin: 5px 0; color: #e0f2fe;"><strong>Phone:</strong> ${params.captainPhone}</p>` : ''}
        </div>

        <div style="background-color: #064e3b; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 10px; color: #10b981;">Meeting Location</h3>
          <p style="margin: 0; color: #d1fae5; font-size: 16px;">${params.meetingSpot}</p>
        </div>

        <div style="background-color: #0f172a; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 15px; color: #f1f5f9;">What to Bring</h3>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; line-height: 1.8;">
            <li>Photo ID</li>
            <li>Sunscreen & sunglasses</li>
            <li>Light jacket or windbreaker</li>
            <li>Camera or phone for photos</li>
            <li>Any medications you may need</li>
            <li>Snacks & beverages (if allowed)</li>
          </ul>
        </div>

        <div style="background-color: #422006; border-left: 4px solid #fbbf24; padding: 15px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0; color: #fde68a; font-size: 14px;">
            ⚠️ <strong>Important:</strong> Please arrive 15 minutes early. Check the weather and contact your captain if you have any questions!
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.managementUrl}" style="display: inline-block; background-color: #06b6d4; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Booking Details
          </a>
        </div>

        <p style="margin: 30px 0 0; color: #94a3b8; text-align: center; font-size: 14px;">
          We can't wait to see you on the water! 🌊
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
    subject: `⚓ Tomorrow: ${params.tripType} at ${params.time}`,
    html,
  });
}
