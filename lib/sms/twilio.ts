/**
 * SMS service using Twilio
 * Setup: Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to environment variables
 */

interface SMSParams {
  to: string;
  message: string;
  from?: string;
}

export async function sendSMS({ to, message, from }: SMSParams): Promise<{
  success: boolean;
  error?: string;
  messageId?: string;
}> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = from || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    console.error('Twilio credentials not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  // Format phone number (remove non-digits, ensure +1 for US numbers)
  const cleanPhone = to.replace(/\D/g, '');
  const formattedTo = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedTo,
          From: twilioPhone,
          Body: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio API error:', data);
      return { 
        success: false, 
        error: data.message || `Failed to send SMS (${response.status})` 
      };
    }

    return { success: true, messageId: data.sid };
  } catch (error) {
    console.error('SMS send error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send SMS' 
    };
  }
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * Validate US phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
}
