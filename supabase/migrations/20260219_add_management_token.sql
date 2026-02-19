-- Add management_token column to bookings table
-- This token is used for guest-facing management URLs (manage, review, modify pages)
-- and for authenticating guest actions on their bookings.

ALTER TABLE public.bookings
  ADD COLUMN management_token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex') UNIQUE;

-- Create index for fast lookups by management_token
CREATE INDEX idx_bookings_management_token ON public.bookings (management_token);
