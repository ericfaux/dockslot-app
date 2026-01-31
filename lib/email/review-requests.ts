/**
 * Review request email template
 * Sent automatically after trip completion
 */

import { sendEmail } from './resend'

interface ReviewRequestParams {
  to: string
  guestName: string
  tripType: string
  vesselName: string
  tripDate: string
  captainName: string
  reviewUrl: string
}

export async function sendReviewRequest(params: ReviewRequestParams) {
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
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; text-align: center;">
                ⭐ How Was Your Trip?
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Hi ${params.guestName},
              </p>
              
              <p style="margin: 0 0 24px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Thank you for choosing ${params.captainName} for your recent trip! We hope you had an amazing experience aboard <strong>${params.vesselName}</strong>.
              </p>

              <!-- Trip Details Box -->
              <div style="margin: 24px 0; padding: 20px; background-color: #0f172a; border-left: 4px solid #06b6d4; border-radius: 6px;">
                <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Your Trip
                </p>
                <p style="margin: 0 0 4px; color: #e2e8f0; font-size: 16px; font-weight: 600;">
                  ${params.tripType}
                </p>
                <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                  ${params.tripDate} • ${params.vesselName}
                </p>
              </div>

              <p style="margin: 24px 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Your feedback helps us improve and helps other guests choose their perfect trip. Would you mind taking 2 minutes to share your experience?
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${params.reviewUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);">
                  ⭐ Leave a Review
                </a>
              </div>

              <p style="margin: 24px 0 0; color: #94a3b8; font-size: 14px; text-align: center;">
                Your review will be shared publicly to help other guests make informed decisions.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #0f172a; border-top: 1px solid #334155;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">
                Thanks for sailing with us! 🌊
              </p>
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
  `

  return sendEmail({
    to: params.to,
    subject: `⭐ How was your ${params.tripType}?`,
    html,
  })
}
