/**
 * Trip reminder email template
 * Sent 24 or 48 hours before scheduled departure
 */

import { sendEmail, containsPlaceholderText } from './resend';

export async function sendTripReminder(params: {
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
  passengerCount: number;
  managementUrl: string;
  waiverUrl?: string;
  waiverSigned?: boolean;
  weatherForecast?: string;
  weatherTemp?: string;
  weatherWind?: string;
  whatToBring?: string;
  businessName?: string;
  logoUrl?: string;
  emailSignature?: string;
  reminderTiming?: string; // '24h' or '48h'
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const whatToBringItems = params.whatToBring
    ? params.whatToBring.split('\n').filter(Boolean).map(item => `<li>${item.trim()}</li>`).join('')
    : `<li>Photo ID</li><li>Sunscreen &amp; sunglasses</li><li>Light jacket or windbreaker</li><li>Camera or phone for photos</li><li>Any medications you may need</li><li>Snacks &amp; beverages (if allowed)</li>`;

  // Strip placeholder values from branding fields, falling back to real data
  const safeBusinessName = params.businessName && !containsPlaceholderText(params.businessName) ? params.businessName : undefined;
  const safeLogoUrl = params.logoUrl && !containsPlaceholderText(params.logoUrl) ? params.logoUrl : undefined;
  const safeEmailSignature = params.emailSignature && !containsPlaceholderText(params.emailSignature) ? params.emailSignature : undefined;
  const displayName = safeBusinessName || 'DockSlot';
  const timingLabel = params.reminderTiming === '48h' ? 'in 2 days' : 'tomorrow';

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
        ${safeLogoUrl ? `<img src="${safeLogoUrl}" alt="${displayName}" style="max-height: 60px; margin-bottom: 10px;">` : ''}
        <h1 style="margin: 0; color: #06b6d4; font-size: 28px;">Trip Reminder</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">Your charter is ${timingLabel}!</p>
      </td>
    </tr>

    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">Hi ${params.guestName}!</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          This is a friendly reminder that your <strong>${params.tripType}</strong> charter is ${timingLabel}!
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

        ${params.weatherForecast ? `
        <div style="background-color: #0f172a; border-left: 4px solid #38bdf8; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 10px; color: #38bdf8;">Weather Forecast</h3>
          <p style="margin: 0 0 5px; color: #e0f2fe;">${params.weatherForecast}</p>
          ${params.weatherTemp ? `<p style="margin: 5px 0; color: #bae6fd; font-size: 13px;">Temperature: ${params.weatherTemp}</p>` : ''}
          ${params.weatherWind ? `<p style="margin: 5px 0; color: #bae6fd; font-size: 13px;">Wind: ${params.weatherWind}</p>` : ''}
        </div>
        ` : ''}

        <div style="background-color: #064e3b; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 10px; color: #10b981;">Meeting Location</h3>
          <p style="margin: 0 0 5px; color: #d1fae5; font-size: 16px;">${params.meetingSpot}</p>
          ${params.meetingSpotInstructions ? `<p style="margin: 10px 0 0; color: #a7f3d0; font-size: 13px; font-style: italic;">${params.meetingSpotInstructions}</p>` : ''}
        </div>

        ${params.waiverUrl && !params.waiverSigned ? `
        <div style="background-color: #422006; border-left: 4px solid #fbbf24; padding: 15px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0 0 10px; color: #fde68a; font-size: 14px;">
            <strong>Waiver Not Yet Signed:</strong> Please sign your liability waiver before your trip.
          </p>
          <a href="${params.waiverUrl}" style="color: #fbbf24; text-decoration: underline; font-weight: 600;">Sign Waiver Now</a>
        </div>
        ` : ''}

        <div style="background-color: #0f172a; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 15px; color: #f1f5f9;">What to Bring</h3>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; line-height: 1.8;">
            ${whatToBringItems}
          </ul>
        </div>

        <div style="background-color: #422006; border-left: 4px solid #fbbf24; padding: 15px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0; color: #fde68a; font-size: 14px;">
            <strong>Important:</strong> Please arrive 15 minutes early. Check the weather and contact your captain if you have any questions!
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.managementUrl}" style="display: inline-block; background-color: #06b6d4; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Booking Details
          </a>
        </div>

        ${safeEmailSignature ? `
        <div style="margin: 20px 0 0; padding-top: 15px; border-top: 1px solid #334155;">
          <p style="margin: 0; color: #94a3b8; font-size: 13px; white-space: pre-line;">${safeEmailSignature}</p>
        </div>
        ` : `
        <p style="margin: 30px 0 0; color: #94a3b8; text-align: center; font-size: 14px;">
          We can't wait to see you on the water!
        </p>
        `}
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
    subject: `Trip Reminder: ${params.tripType} - ${params.date} at ${params.time}`,
    html,
  });
}
