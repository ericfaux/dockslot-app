# SMS Setup with Twilio

DockSlot supports SMS messaging to guests via Twilio.

## Features

- Send text messages directly from booking detail panel
- Template support (same templates as email)
- Placeholder replacement (guest_name, date, time, vessel, meeting_spot)
- Audit logging and timeline tracking
- SMS segment detection (warns when >160 chars)
- US phone number formatting and validation

## Setup Steps

### 1. Create Twilio Account

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Get $15 in free trial credit

### 2. Get a Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select a number (filter by SMS capability)
3. Purchase the number (~$1/month)

### 3. Get Your Credentials

From the Twilio Console homepage:

- **Account SID** - starts with `AC...`
- **Auth Token** - click "Show" to reveal

### 4. Add to Vercel Environment Variables

In your Vercel project settings:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

### 5. Deploy

Push any change or redeploy to apply the new environment variables.

## Pricing

**Twilio Pricing (US)**
- **SMS:** $0.0079 per message sent
- **Phone Number:** $1.00/month
- **Free Trial:** $15 credit (send ~1,900 SMS for free)

**Example Usage:**
- 50 bookings/month
- Average 3 SMS per booking (reminder, weather update, confirmation)
- Cost: ~$1.20/month + $1 phone = **$2.20/month**

## Testing

1. SMS button appears in booking detail panel when guest has phone number
2. Click "Send Message" → select SMS tab
3. Type message (160 char recommended)
4. Send
5. Check booking timeline for SMS log entry

## Phone Number Format

DockSlot automatically handles US phone number formatting:

**Accepted formats:**
- `(555) 123-4567`
- `555-123-4567`
- `5551234567`
- `+15551234567`

All formats are normalized to `+1XXXXXXXXXX` for Twilio.

## Character Limits

- **Standard SMS:** 160 characters per message
- **Messages over 160 chars:** Split into multiple segments (higher cost)
- **UI Warning:** Shows segment count when >160 chars

## Troubleshooting

**"SMS service not configured"**
- Check environment variables are set in Vercel
- Redeploy after adding variables

**"Invalid phone number format"**
- Guest phone must be 10 digits (US)
- Check booking detail panel contact section

**"Failed to send SMS"**
- Check Twilio account balance
- Verify phone number is SMS-capable
- Check Twilio logs for detailed error

## Security

- Auth token is stored securely in environment variables
- Never exposed to client-side code
- All SMS sends are logged for audit trail
- Captain ownership verified before sending

## Features Ready

✅ SMS sending from booking panel
✅ Template integration
✅ Placeholder support
✅ Character count & segment warnings
✅ Timeline logging
✅ Audit trail
✅ Phone number validation

## Status

**Code:** ✅ Complete
**Testing:** Needs Twilio account
**Cost:** ~$2-5/month for typical usage
