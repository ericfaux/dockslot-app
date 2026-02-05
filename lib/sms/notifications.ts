/**
 * SMS notification templates for critical guest communications
 * Keep messages short (160 chars ideal) — link to full details via email
 */

import { sendSMS } from './twilio';

/**
 * SMS booking confirmation
 */
export async function sendBookingConfirmationSMS(params: {
  to: string;
  guestName: string;
  tripType: string;
  date: string;
  time: string;
  managementUrl: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const message = `Hi ${params.guestName}! Your ${params.tripType} on ${params.date} at ${params.time} is confirmed. View details: ${params.managementUrl}`;

  return sendSMS({ to: params.to, message });
}

/**
 * SMS day-of trip reminder
 */
export async function sendDayOfReminderSMS(params: {
  to: string;
  guestName: string;
  tripType: string;
  time: string;
  meetingSpot: string;
  captainPhone?: string;
  managementUrl: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  let message = `Reminder: Your ${params.tripType} is today at ${params.time}. Meet at: ${params.meetingSpot}. Arrive 15 min early!`;
  if (params.captainPhone) {
    message += ` Captain: ${params.captainPhone}`;
  }
  // Trim to keep under SMS limit, add link
  if (message.length > 140) {
    message = message.slice(0, 137) + '...';
  }
  message += ` ${params.managementUrl}`;

  return sendSMS({ to: params.to, message });
}

/**
 * SMS weather hold notification
 */
export async function sendWeatherHoldSMS(params: {
  to: string;
  guestName: string;
  tripType: string;
  originalDate: string;
  rescheduleUrl: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const message = `Hi ${params.guestName}, your ${params.tripType} on ${params.originalDate} is on weather hold for safety. Choose a new date: ${params.rescheduleUrl}`;

  return sendSMS({ to: params.to, message });
}
