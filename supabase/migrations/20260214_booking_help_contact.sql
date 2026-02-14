-- Booking Help: allow captains to share contact info on booking pages
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS booking_help_show_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS booking_help_show_phone boolean NOT NULL DEFAULT false;
