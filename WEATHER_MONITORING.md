# Automatic Weather Monitoring

DockSlot automatically checks weather conditions for upcoming trips and alerts captains to potential issues.

## How It Works

1. **Daily Cron Job** runs at 8 AM (configurable)
2. Checks all bookings scheduled for **next 24-48 hours**
3. Queries **NOAA Marine Weather** for each trip location
4. If unsafe/caution conditions detected:
   - Sends email alert to captain
   - Includes NOAA weather reason
   - Provides recommended actions
   - Links to dashboard for Weather Hold

## Setup

### Option A: Vercel Cron (Recommended)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-weather",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Schedule formats:**
- `0 8 * * *` - Every day at 8 AM UTC
- `0 8,20 * * *` - 8 AM and 8 PM UTC
- `0 */6 * * *` - Every 6 hours

### Option B: External Cron Service

Use any service (cron-job.org, EasyCron, etc.):

**URL:** `https://dockslot.app/api/cron/check-weather`  
**Method:** GET  
**Schedule:** Daily at 8 AM  
**Authorization:** `Bearer YOUR_CRON_SECRET`

Add `CRON_SECRET` to environment variables for security.

## Environment Variables

```bash
# Required
CRON_SECRET=your-random-secret-here  # Generate with: openssl rand -base64 32

# Already configured
RESEND_API_KEY=re_...  # For email alerts
```

## Captain Alert Email

When unsafe weather detected, captain receives:

**Subject:** `⚠️ Weather Alert: [Trip Type] in [Hours]h`

**Contains:**
- Severity level (DANGEROUS/CAUTION)
- Trip details (guest, date, time)
- NOAA weather reason & active alerts
- Recommended actions
- Link to dashboard

**Example:**
```
⚠️ DANGEROUS weather conditions detected

NOAA: "Gale Warning: Southwest winds 35-45 kt. Seas 12-16 feet."

Recommended Actions:
- Consider canceling for guest safety
- Contact guest immediately
- Place on Weather Hold if needed
```

## Weather Severity Levels

### DANGEROUS (Red Alert)
- **Conditions:** Gale warnings, severe/extreme alerts
- **Recommendation:** Cancel or reschedule
- **Action:** Contact guest immediately, likely Weather Hold

### CAUTION (Amber Alert)
- **Conditions:** Small Craft Advisory, 20-25 mph winds
- **Recommendation:** Monitor closely, prepare contingency
- **Action:** Brief guest on conditions, have plan B

### SAFE (No Alert)
- **Conditions:** No alerts, wind < 20 mph
- **Recommendation:** Normal operations
- **Action:** None required

## Requirements for Weather Monitoring

For a trip to be monitored, the captain's profile must have:
- `meeting_spot_latitude` (decimal degrees)
- `meeting_spot_longitude` (decimal degrees)

**To add location:**
1. Dashboard → Settings
2. Meeting Spot section
3. Enter address OR coordinates
4. System auto-geocodes address to lat/lon

Trips without location data are skipped (logged).

## Response Format

The cron endpoint returns:

```json
{
  "success": true,
  "checked": 12,
  "results": [
    {
      "bookingId": "uuid",
      "status": "notified",
      "recommendation": "caution",
      "reason": "Small Craft Advisory: Winds 20-25 kt"
    },
    {
      "bookingId": "uuid",
      "status": "safe",
      "recommendation": "safe"
    }
  ],
  "timestamp": "2026-01-31T12:00:00.000Z"
}
```

## Monitoring & Logs

Check cron execution:
- **Vercel:** Deployments → Functions → Logs
- **External:** Service's dashboard

Failed checks are logged but don't block the job.

## Captain Workflow

1. Receive weather alert email
2. Review NOAA conditions
3. Decide: proceed, monitor, or hold
4. If hold needed:
   - Click dashboard link in email
   - Navigate to booking
   - Click "Weather Hold"
   - System auto-notifies guest with reschedule options

## Disable Weather Monitoring

Set `CRON_SECRET=""` or remove cron configuration.

Individual trips can't be excluded (feature request).

## Future Enhancements

- [ ] SMS alerts (in addition to email)
- [ ] Captain notification preferences (email, SMS, both)
- [ ] Custom weather thresholds per captain
- [ ] Weather forecast in dashboard
- [ ] Historical weather data for trip reports
