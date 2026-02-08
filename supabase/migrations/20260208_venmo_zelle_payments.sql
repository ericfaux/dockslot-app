-- Add Venmo and Zelle alternative payment method columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS venmo_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zelle_contact TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS venmo_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zelle_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auto_confirm_manual_payments BOOLEAN DEFAULT true;

-- Add payment_method column to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe';

-- Add payment_reminder_count to bookings for auto-reminder tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reminder_count INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reminder_last_sent TIMESTAMPTZ;

-- Add 'pending_verification' to payment_status if it's an enum
-- If payment_status is a text field, this is not needed
DO $$
BEGIN
  ALTER TYPE booking_payment_status ADD VALUE IF NOT EXISTS 'pending_verification';
EXCEPTION
  WHEN undefined_object THEN
    -- payment_status is likely a text column, no enum to alter
    NULL;
END $$;
