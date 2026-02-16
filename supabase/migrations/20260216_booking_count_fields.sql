-- Add booking count tracking fields for Deckhand tier limit enforcement
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS monthly_booking_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booking_count_reset_date date NOT NULL DEFAULT CURRENT_DATE;
