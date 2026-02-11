-- Add custom payment instruction fields for Venmo and Zelle
-- These allow captains to provide custom instructions that guests see on the booking page

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS venmo_payment_instructions TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zelle_payment_instructions TEXT;
