# Setup Tasks - Requires External Accounts

These features are **built and ready** but require API keys/accounts to function.

## 📧 Email Notifications (READY - Needs Setup)

**Status:** ✅ Code complete, templates ready  
**Provider:** Resend (free tier: 3,000 emails/month)  
**Setup time:** ~5 minutes

**What's working:**
- Booking confirmation emails
- Weather hold notifications
- Balance payment requests
- Beautiful HTML templates with DockSlot branding

**To activate:**
1. Create free Resend account: https://resend.com
2. Get API key from dashboard
3. Add to Vercel env vars: `RESEND_API_KEY=re_...`
4. Redeploy (or wait for next deploy)

**See:** `EMAIL_SETUP.md` for detailed instructions

---

## 📱 SMS Notifications (FUTURE - Not Built Yet)

**Status:** 📝 Planned, not implemented  
**Provider:** Twilio (recommended)  
**Estimated cost:** ~$0.0079/SMS

**Useful for:**
- Weather hold urgent alerts
- Day-before trip reminders  
- Last-minute changes
- Payment reminders

**To implement later:**
1. Create Twilio account
2. Get phone number + API credentials
3. Build SMS service wrapper (similar to email)
4. Add opt-in/opt-out logic
5. Integrate into notification points

**Priority:** Low (email covers most needs)

---

## 🌤️ Automatic Weather Monitoring (READY - Needs Cron)

**Status:** ✅ Code complete, needs cron setup  
**Provider:** NOAA (free, no key needed) + Resend (for alerts)

**What's working:**
- Daily weather checks for upcoming trips
- NOAA marine forecast integration
- Captain email alerts for unsafe conditions
- Severity classification (safe/caution/dangerous)

**To activate:**
1. Already deployed with Vercel cron (runs daily at 8 AM UTC)
2. Optional: Add `CRON_SECRET` for security
3. Ensure captain profiles have lat/lon coordinates

**See:** `WEATHER_MONITORING.md` for details

---

## 💳 Stripe Payments (READY - Needs Keys)

**Status:** ✅ Code complete, awaiting keys  
**Provider:** Stripe (free to start, 2.9% + $0.30 per transaction)

**What's working:**
- Deposit payment checkout
- Balance payment requests
- Payment webhooks
- Success/cancel flows

**To activate:**
1. Create Stripe account: https://stripe.com
2. Get API keys (test mode to start)
3. Add to Vercel env vars:
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
   - `STRIPE_WEBHOOK_SECRET_PLATFORM=whsec_...` (booking + subscription events, "Your account" scope)
   - `STRIPE_WEBHOOK_SECRET_CONNECT=whsec_...` (Connect `account.*` events, "Connected accounts" scope)
4. Set up two webhook endpoints in Stripe dashboard (one per scope — see `STRIPE_SETUP.md`)

**See:** `STRIPE_SETUP.md` for complete guide

---

## 📝 Notes

**Eric's priority:** Build features that don't need external setup first  
**SMS/Email:** Can configure later when ready  
**Focus:** Tier 2-4 features that work standalone

**Built without external deps:**
- ✅ Captain Analytics Dashboard
- ✅ Waiver Template Management
- ✅ Weather Hold Workflow (UI)
- ✅ Blackout Dates
- ⏳ Trip Reports (next)
- ⏳ Repeat Guest Management (next)
- ⏳ Calendar Export (next)

