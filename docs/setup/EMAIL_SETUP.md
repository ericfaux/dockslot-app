# Email Notifications Setup

DockSlot uses [Resend](https://resend.com) for transactional emails.

## Why Resend?

- **Free tier:** 3,000 emails/month, 100 emails/day
- **No credit card required** for free tier
- **Simple API:** One endpoint, easy integration
- **Great deliverability:** Built by ex-AWS SES team
- **Generous limits:** Perfect for growing charter operations

## Setup Instructions

### 1. Create Resend Account

1. Go to https://resend.com
2. Sign up (free, no credit card needed)
3. Verify your email address

### 2. Get API Key

1. In Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Name it "DockSlot Production" (or similar)
4. Copy the key (starts with `re_`)

### 3. Add to Vercel Environment Variables

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add new variable:
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_xxxxx` (your key from step 2)
   - **Environments:** Production, Preview, Development
3. Click "Save"
4. **Redeploy** your project for changes to take effect

### 4. Verify Domain (Optional but Recommended)

**Without domain verification:**
- Emails sent from `onboarding@resend.dev`
- May go to spam
- OK for testing

**With domain verification (recommended for production):**
1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `dockslot.app`)
4. Add DNS records Resend provides
5. Wait for verification (usually < 30 minutes)
6. Update `DEFAULT_FROM` in `lib/email/resend.ts` to use your domain:
   ```typescript
   const DEFAULT_FROM = 'DockSlot <bookings@yourdomain.com>';
   ```

## Email Templates Included

### 1. Booking Confirmation
**Triggered:** After successful payment/booking creation
**Sent to:** Guest email
**Contains:**
- Trip details (type, date, time, vessel)
- Meeting location
- Payment summary (total, deposit paid, balance due)
- Link to booking management portal
- What's next checklist

### 2. Weather Hold Notification
**Triggered:** When captain places booking on weather hold
**Sent to:** Guest email
**Contains:**
- Weather reason (from NOAA or captain input)
- Original trip date
- Link to reschedule page
- Reassurance (deposit safe, no extra charges)

## Future Email Templates (To Build)

- **Waiver Reminder:** Send if waiver not signed 48h before trip
- **Day-Before Reminder:** Trip details + meeting location 24h before
- **Balance Payment Request:** Captain requests remaining payment
- **Reschedule Confirmation:** Guest picked new date after weather hold
- **Cancellation Confirmation:** Trip cancelled with refund details
- **Post-Trip Thank You:** Feedback request + repeat booking discount

## Testing Emails Locally

```bash
# Set env var in .env.local
RESEND_API_KEY=re_your_test_key

# Test sending from Node console
node
> const { sendBookingConfirmation } = require('./lib/email/resend');
> await sendBookingConfirmation({
    to: 'your@email.com',
    guestName: 'Test Guest',
    tripType: 'Sunset Cruise',
    date: 'March 15, 2026',
    time: '6:00 PM',
    vessel: 'Test Vessel',
    meetingSpot: 'Test Marina',
    captainName: 'Captain Test',
    totalPrice: '$400',
    depositPaid: '$200',
    balanceDue: '$200',
    managementUrl: 'https://dockslot.app/manage/test123'
  });
```

## Monitoring & Limits

**Check usage:**
- Resend dashboard → Analytics
- View sends, opens, clicks, bounces

**Free tier limits:**
- 3,000 emails/month
- 100 emails/day
- Unlimited API requests

**Upgrade when:**
- Exceeding 3,000/month (~100 bookings/month)
- Need custom DKIM/SPF records
- Want dedicated IP
- Pricing: $20/month for 50k emails

## Deliverability Tips

1. **Verify domain** (biggest impact on inbox placement)
2. **Don't use no-reply@** (use bookings@ or hello@)
3. **Keep "from" name consistent** (always "DockSlot")
4. **Add plain-text version** (Resend auto-generates from HTML)
5. **Monitor bounces** and remove invalid emails

## Integration Points in Code

Emails are automatically sent from:
- `app/api/bookings/route.ts` → Booking confirmation
- `app/api/bookings/[id]/weather-hold/route.ts` → Weather hold notification

To disable emails (testing), set `RESEND_API_KEY=""` in environment.
