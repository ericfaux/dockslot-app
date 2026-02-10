# DockSlot QA Findings & Fixes
**Session:** 2026-01-31  
**Scope:** Comprehensive review of all features

## 🔴 CRITICAL ISSUES

### 1. Balance Payment Button Missing from Schedule
- **Issue:** Balance payment request API exists but no UI button to trigger it
- **Location:** Dashboard → Schedule → Booking detail panel
- **Fix:** Add "Request Balance Payment" button
- **Priority:** HIGH

### 2. Email Integration Not Connected
- **Issue:** Email functions exist but not called from booking flows
- **Location:** Booking confirmation, weather hold, balance requests
- **Fix:** Wire up email sends to actual booking events
- **Priority:** HIGH

### 3. Weather Monitoring Email Missing Captain Email
- **Issue:** Cron sends to `captain_id@example.com` instead of real email
- **Location:** `/api/cron/check-weather/route.ts`
- **Fix:** Fetch captain's actual email from profile
- **Priority:** HIGH

### 4. Trip Reports Not Auto-Linked to Bookings
- **Issue:** Creating trip report doesn't update booking status
- **Location:** `/api/trip-reports/route.ts`
- **Fix:** Properly link and update booking status
- **Priority:** MEDIUM

## 🟡 UX/UI IMPROVEMENTS

### 5. Dashboard Weather Data Silent Failure
- **Issue:** If no meeting spot configured, weather section shows nothing
- **Location:** Dashboard home page
- **Fix:** Show helpful message "Set meeting spot in Settings to see weather"
- **Priority:** HIGH

### 6. Export Buttons Lack Visual Feedback
- **Issue:** No loading state while generating CSV/iCal
- **Location:** Schedule & Analytics export buttons
- **Fix:** Add loading spinner during export
- **Priority:** MEDIUM

### 7. Guest Management Missing Action Buttons
- **Issue:** "Send Email" and "Offer Discount" buttons are placeholders
- **Location:** `/app/dashboard/guests/components/GuestsList.tsx`
- **Fix:** Implement mailto links and discount flow
- **Priority:** MEDIUM

### 8. Calendar Export Missing Verification Step
- **Issue:** Users might not know if calendar sync is working
- **Location:** Settings → Calendar Export
- **Fix:** Add "Test Calendar Feed" button
- **Priority:** LOW

### 9. Analytics Charts Missing Data Labels
- **Issue:** Revenue bars lack precise $ amounts on hover
- **Location:** `/app/dashboard/analytics/components/AnalyticsCharts.tsx`
- **Fix:** Add tooltips with exact values
- **Priority:** LOW

### 10. Manifest Print Button Not Labeled for Accessibility
- **Issue:** Print button has icon but no aria-label
- **Location:** `/app/dashboard/manifest/components/BookingCard.tsx`
- **Fix:** Add aria-label="Print passenger manifest"
- **Priority:** LOW

## 🟢 MISSING FEATURES

### 11. Booking Confirmation Emails Not Sent
- **Issue:** Guests don't receive confirmation after booking
- **Location:** Booking creation flow
- **Fix:** Call sendBookingConfirmation() after successful booking
- **Priority:** HIGH

### 12. Weather Hold Emails Not Sent
- **Issue:** Guests not notified when trip put on weather hold
- **Location:** Weather hold API endpoint
- **Fix:** Call sendWeatherHoldNotification() when weather hold set
- **Priority:** HIGH

### 13. Trip Report Detail View Missing
- **Issue:** Can't view individual trip report details
- **Location:** `/app/dashboard/reports/[id]/page.tsx` doesn't exist
- **Fix:** Create trip report detail page
- **Priority:** MEDIUM

### 14. Guest Notes/Preferences Missing
- **Issue:** No way to save notes about guests (allergies, preferences, etc.)
- **Location:** Guest management
- **Fix:** Add notes field to guest aggregation
- **Priority:** MEDIUM

### 15. Booking Search Missing
- **Issue:** Can't search bookings by guest name/email on schedule
- **Location:** Schedule page
- **Fix:** Add search bar above calendar
- **Priority:** LOW

### 16. Mobile Navigation Improvements Needed
- **Issue:** Sidebar takes full screen on mobile
- **Location:** Dashboard layout
- **Fix:** Improve mobile menu UX
- **Priority:** LOW

## ⚡ PERFORMANCE OPTIMIZATIONS

### 17. Dashboard Fetches Weather Every Load
- **Issue:** NOAA + buoy APIs called on every page load
- **Location:** Dashboard page
- **Fix:** Add caching (5-minute TTL)
- **Priority:** MEDIUM

### 18. Analytics Fetches All Bookings
- **Issue:** Could be slow with 1000+ bookings
- **Location:** Analytics page
- **Fix:** Add pagination or date range limits
- **Priority:** LOW

### 19. Guest List Loads All Guests
- **Issue:** Could be slow with many repeat customers
- **Location:** Guest management
- **Fix:** Add pagination (show 50 per page)
- **Priority:** LOW

## 🛡️ ERROR HANDLING

### 20. NOAA API Failures Not User-Visible
- **Issue:** Silent failure if NOAA is down
- **Location:** Weather functions
- **Fix:** Show error message to user
- **Priority:** LOW

### 21. Buoy Data Parse Errors Not Caught
- **Issue:** Malformed buoy data could crash
- **Location:** `/lib/weather/buoy.ts`
- **Fix:** Add try/catch around parsing
- **Priority:** MEDIUM

### 22. Calendar Token Generation Could Fail
- **Issue:** crypto.getRandomValues not available in some environments
- **Location:** Settings page, calendar endpoints
- **Fix:** Add fallback token generation
- **Priority:** LOW

## 📱 MOBILE RESPONSIVENESS

### 23. Analytics Charts Overflow on Mobile
- **Issue:** Chart bars too wide on small screens
- **Location:** Analytics page
- **Fix:** Make charts responsive (horizontal scroll or stack)
- **Priority:** MEDIUM

### 24. Export Dropdown Clips Off Screen
- **Issue:** Export menu goes off-screen on mobile
- **Location:** Schedule & Analytics export buttons
- **Fix:** Position dropdown to stay in viewport
- **Priority:** LOW

### 25. Manifest Cards Cramped on Mobile
- **Issue:** Booking cards too dense on small screens
- **Location:** Manifest page
- **Fix:** Adjust padding and font sizes for mobile
- **Priority:** LOW

## 📋 DOCUMENTATION GAPS

### 26. Missing Onboarding for First-Time Captains
- **Issue:** No guidance on what to do after signup
- **Location:** Dashboard
- **Fix:** Add onboarding checklist or tour
- **Priority:** MEDIUM

### 27. Calendar Export Instructions Could Be Clearer
- **Issue:** Users might not know how to subscribe
- **Location:** Settings → Calendar Export
- **Fix:** Add video or GIF showing the process
- **Priority:** LOW

### 28. Weather Data Source Not Explained
- **Issue:** Users don't know data comes from NOAA/buoys
- **Location:** Dashboard
- **Fix:** Add tooltip explaining data sources
- **Priority:** LOW

---

## PRIORITY SUMMARY

**Critical (Immediate):** 4 issues  
**High Priority:** 5 issues  
**Medium Priority:** 10 issues  
**Low Priority:** 9 issues  

**Total Issues Found:** 28  

---

**Next Steps:**
1. Fix critical issues first
2. Address high-priority UX gaps
3. Implement missing feature integrations
4. Polish with medium/low priority items
