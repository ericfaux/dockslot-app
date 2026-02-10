# DockSlot URL Map - All Features

## 🎯 **LIVE URL:** https://dockslot-app.vercel.app

---

## Captain Dashboard (Requires Login)

### Main Navigation
- **Dashboard Home:** `/dashboard`
- **Trips:** `/dashboard/trips`
- **Schedule (Calendar):** `/dashboard/schedule`
- **All Bookings:** `/dashboard/bookings`
- **Modifications:** `/dashboard/modifications` ⭐ Build #43
- **Manifest:** `/dashboard/manifest`
- **Vessels:** `/dashboard/vessels`
- **Waivers:** `/dashboard/waivers`
- **Trip Reports:** `/dashboard/reports`
- **Analytics Reports:** `/dashboard/reports-advanced` ⭐ Build #40
- **Guests:** `/dashboard/guests`
- **Reviews:** `/dashboard/reviews` ⭐ Build #41
- **Analytics:** `/dashboard/analytics`
- **Payments (Stripe Connect):** `/dashboard/payments`
- **Settings:** `/dashboard/settings`

### Settings Subpages
- **Cancellation Policies:** `/dashboard/settings/cancellation` ⭐ Build #39
- **Message Templates:** `/dashboard/settings/templates` ⭐ Build #33
- **Availability:** `/dashboard/settings/availability`

### Booking Detail Features (In Sidebar)
- **Send Message (Email/SMS):** Integrated in booking detail panel ⭐ Build #37 & #38
- **Cancellation Policy Display:** Shows in booking detail ⭐ Build #39
- **Contact Quick Actions:** Copy, email, call, SMS ⭐ Build #35
- **Booking Timeline:** Activity log in detail panel ⭐ Build #27
- **Booking Notes & Tags:** Edit in detail panel ⭐ Build #25

---

## Guest-Facing Pages (No Login Required)

### Public Pages
- **Captain Public Profile:** `/captain/[slug]` ⭐ Build #44
  - SEO-optimized landing page
  - Reviews showcase
  - Fleet and trip types
  - Booking CTA

### Booking Flow
- **Captain Profile (Booking Start):** `/c/[captainId]`
- **Trip Selection:** `/book/[captainId]/[tripTypeId]`
- **Booking Confirmation:** `/book/[captainId]/[tripTypeId]/confirm`

### Guest Self-Service (Token-Based)
- **Manage Booking:** `/manage/[token]`
- **Review Submission:** `/review/[token]` ⭐ Build #41
- **Modification Request:** `/modify/[token]` ⭐ Build #43
- **Reschedule (Weather Hold):** `/reschedule/[token]`
- **Payment Success:** `/payment/success`

---

## API Endpoints (Backend)

### Booking Management
- `GET/POST /api/bookings` - List/create bookings
- `GET/PATCH /api/bookings/[id]` - Get/update booking
- `POST /api/bookings/[id]/send-message` - Send email ⭐ Build #37
- `POST /api/bookings/[id]/send-sms` - Send SMS ⭐ Build #38
- `GET /api/bookings/[id]/cancellation-policy` - Get policy ⭐ Build #39
- `GET /api/bookings/[id]/timeline` - Activity timeline ⭐ Build #27
- `PATCH /api/bookings/[id]/notes` - Update notes/tags ⭐ Build #25
- `POST /api/bookings/[id]/duplicate` - Duplicate booking ⭐ Build #29
- `POST /api/bookings/[id]/refund` - Process refund
- `POST /api/bookings/export` - Export CSV ⭐ Build #28

### Booking Modifications
- `POST /api/booking-modifications` - Submit modification ⭐ Build #43
- `GET /api/booking-modifications` - List modifications ⭐ Build #43
- `PATCH /api/booking-modifications/[id]` - Approve/reject ⭐ Build #43

### Reviews
- `POST /api/reviews` - Submit review (guest) ⭐ Build #41
- `GET /api/reviews?captainId=X` - List reviews ⭐ Build #41
- `PATCH /api/reviews/[id]` - Update review (captain) ⭐ Build #41
- `DELETE /api/reviews/[id]` - Delete review ⭐ Build #41

### Reports & Analytics
- `GET /api/reports/bookings` - Advanced reports ⭐ Build #40
- `GET /api/dashboard/quick-stats` - Dashboard metrics ⭐ Build #32

### Message Templates
- `GET/POST /api/message-templates` - List/create templates ⭐ Build #33
- `PATCH/DELETE /api/message-templates/[id]` - Update/delete ⭐ Build #33

### Trip Types
- `PATCH /api/trip-types/[id]` - Update policies ⭐ Build #39

### Cron Jobs (Automated)
- `GET /api/cron/check-weather` - Daily weather check (8 AM UTC)
- `GET /api/cron/send-reminders` - Trip reminders (10 AM UTC)
- `GET /api/cron/send-review-requests` - Review requests (11 AM UTC) ⭐ Build #42

---

## Feature Integration Map

### Build #37: Guest Communication Center
- **Location:** Booking detail panel → "Send Message" button
- **Features:** Email templates, placeholder replacement
- **Access:** Captain dashboard → Schedule → Click booking

### Build #38: SMS Integration
- **Location:** Booking detail panel → "Send Message" → SMS tab
- **Features:** Twilio SMS, character counter, segment warnings
- **Access:** Same as Build #37 (integrated modal)

### Build #39: Cancellation Policy Management
- **Admin:** `/dashboard/settings/cancellation`
- **Display:** Booking detail panel (shows policy automatically)
- **Features:** Per-trip-type policies, refund calculator

### Build #40: Advanced Booking Reports
- **URL:** `/dashboard/reports-advanced`
- **Features:** Filters, metrics cards, charts, breakdowns
- **Access:** Dashboard navigation → "Analytics Reports"

### Build #41: Guest Review & Rating System
- **Captain:** `/dashboard/reviews`
- **Guest:** `/review/[token]` (sent via email after trip)
- **Features:** 5-star ratings, written reviews, captain responses
- **Access:** Dashboard navigation → "Reviews"

### Build #42: Automated Review Request Emails
- **Type:** Automated cron job
- **Schedule:** Daily at 11 AM UTC
- **Features:** Sends emails 1 day after completed trips
- **Testing:** Check Vercel cron logs

### Build #43: Guest Self-Service Modifications
- **Captain:** `/dashboard/modifications`
- **Guest:** `/modify/[token]`
- **Features:** Request date/time or party size changes
- **Access:** Dashboard navigation → "Modifications"

### Build #44: Captain Public Profile & SEO Landing Page
- **URL:** `/captain/[slug]`
- **Features:** Public profile, reviews showcase, SEO optimization
- **Access:** Direct link (shareable), future captain settings

---

## Testing Checklist

### Captain Dashboard Features
- [ ] Login to dashboard
- [ ] Navigate to each menu item
- [ ] Check Analytics Reports renders
- [ ] Check Reviews page loads
- [ ] Check Modifications page loads
- [ ] Check Settings → Cancellation page

### Booking Detail Features
- [ ] Open any booking from schedule
- [ ] Test "Send Message" button (email/SMS tabs)
- [ ] Verify cancellation policy displays
- [ ] Check contact quick actions (copy, call, email)
- [ ] View booking timeline
- [ ] Edit notes and tags

### Guest Pages (Use Booking Token)
- [ ] Access `/review/[token]` - Submit review form
- [ ] Access `/modify/[token]` - Modification request form
- [ ] Verify token validation works

### API Testing
- [ ] POST message (check email/SMS)
- [ ] Submit review as guest
- [ ] Submit modification request
- [ ] Approve modification in dashboard

---

## Known Requirements

### For Full Functionality
1. **Resend API Key** - Email notifications (Builds #21, #37, #42)
2. **Twilio Credentials** - SMS messaging (Build #38)
3. **Stripe Connect** - Payments (Build #19)
4. **Supabase** - Database (already configured ✅)

### Optional Enhancements
- Add slug field to profiles table for Build #44
- Configure CRON_SECRET for security
- Set NEXT_PUBLIC_APP_URL for review links

---

**All features are deployed and accessible! 🚢**
