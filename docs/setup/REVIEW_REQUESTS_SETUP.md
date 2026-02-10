# Automated Review Request Emails

DockSlot automatically sends review request emails to guests after their trips are completed.

## How It Works

1. **Daily Cron Job** runs at 11 AM UTC every day
2. Finds all trips that were **completed yesterday**
3. Checks if guest has **already submitted a review** (skips if yes)
4. Sends beautiful email with **direct link to review page**
5. Logs the email in booking timeline

## Email Content

- **Subject:** "⭐ How was your [Trip Type]?"
- **Greeting:** Personalized with guest name
- **Trip Recap:** Trip type, vessel, date
- **CTA Button:** Direct link to `/review/[token]` page
- **Beautiful Design:** Maritime-themed HTML email

## Configuration

### Vercel Cron Schedule
```json
{
  "path": "/api/cron/send-review-requests",
  "schedule": "0 11 * * *"
}
```

**Schedule:** Daily at 11:00 AM UTC

### Environment Variables

**Required:**
- `RESEND_API_KEY` - For sending emails (see EMAIL_SETUP.md)
- `NEXT_PUBLIC_APP_URL` - Base URL for review links (defaults to vercel.app URL)

**Optional:**
- `CRON_SECRET` - Bearer token for securing cron endpoint

## Timing Logic

**Target:** Trips completed **1 day ago** (yesterday)

**Why 1 day?**
- Gives guests time to return home
- Experience is still fresh
- Not too long to forget details
- Higher response rate than immediate or delayed requests

**Date Calculation:**
```typescript
// Yesterday 12:00 AM to Today 12:00 AM
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)
yesterday.setHours(0, 0, 0, 0)

const today = new Date()
today.setHours(0, 0, 0, 0)
```

## Filtering

Emails are only sent when:
- ✅ Booking status = `completed`
- ✅ Trip date = yesterday (24 hours ago)
- ✅ Guest has email address
- ✅ No review has been submitted yet
- ✅ Resend API configured

## Response

The cron job returns:
```json
{
  "success": true,
  "message": "Review requests processed: 5 sent, 0 failed",
  "sent": 5,
  "failed": 0,
  "total": 5,
  "results": [...]
}
```

## Manual Trigger

For testing or manual sends:

```bash
curl https://your-app.vercel.app/api/cron/send-review-requests \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Logging

Each email sent is logged in `booking_logs`:
- **Event Type:** `guest_communication`
- **Details:** "Review request email sent"
- **Metadata:** Includes email type and timestamp

## Email Template

Beautiful maritime-themed HTML email featuring:
- Gradient header with star emoji
- Trip details card with booking info
- Large CTA button with gradient background
- Professional footer
- Mobile-responsive design
- Inline CSS for email client compatibility

## Monitoring

Check cron execution in Vercel dashboard:
- **Deployments** → **Functions** → **Cron Jobs**
- View execution logs and success/failure rates
- Monitor email delivery in Resend dashboard

## Customization

To modify the timing (e.g., send 2 days after):

1. Edit `/app/api/cron/send-review-requests/route.ts`
2. Change date calculation:
```typescript
const twoDaysAgo = new Date()
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
```
3. Redeploy

## Best Practices

✅ **DO:**
- Keep timing consistent (daily at same time)
- Track metrics (open rate, click rate, submission rate)
- A/B test email copy if needed
- Monitor for bounces or spam complaints

❌ **DON'T:**
- Send multiple review requests for same booking
- Change timing too frequently
- Send immediately after trip (give guests time)
- Send more than 7 days after (too long)

## Metrics to Track

1. **Emails Sent** - Total count per day
2. **Delivery Rate** - Successful sends vs failures
3. **Open Rate** - Via Resend analytics (if enabled)
4. **Click Rate** - Review link clicks
5. **Submission Rate** - Reviews actually submitted
6. **Time to Review** - Days between trip and review

## Troubleshooting

**No emails sending:**
- Check Resend API key is set
- Verify cron job is running (Vercel dashboard)
- Check for completed trips yesterday
- Ensure trips don't already have reviews

**Emails failing:**
- Check Resend account status
- Verify email addresses are valid
- Check rate limits (3k/month free tier)
- Review Resend error logs

**Wrong timing:**
- Verify timezone settings (UTC)
- Check date calculation logic
- Review cron schedule syntax

## Status

**Implementation:** ✅ Complete
**Testing:** Needs Resend API key
**Deployment:** Auto-runs via Vercel cron
**Cost:** Free (within Resend limits)
