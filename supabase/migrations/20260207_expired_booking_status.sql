-- Add 'expired' to the booking_status enum
-- Expired bookings are those with status 'pending_deposit' where the
-- scheduled_start date has passed without the deposit being received.

ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'expired';
