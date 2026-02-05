-- Migration: Booking overlap prevention with optimistic locking
-- Description: Adds an exclusion constraint and a helper function to prevent
-- double-booking within the same captain's schedule using PostgreSQL's
-- tsrange type for time-range overlap detection.

-- Create the btree_gist extension (required for exclusion constraints with tsrange)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add an exclusion constraint to prevent overlapping active bookings per captain.
-- This uses PostgreSQL's native tsrange overlap operator (&&) to catch conflicts
-- at the database level, even under concurrent inserts.
-- Only applies to active booking statuses.
DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_active_bookings'
  ) THEN
    ALTER TABLE bookings
    ADD CONSTRAINT no_overlapping_active_bookings
    EXCLUDE USING gist (
      captain_id WITH =,
      tsrange(scheduled_start::timestamp, scheduled_end::timestamp) WITH &&
    )
    WHERE (status IN ('confirmed', 'pending_deposit', 'weather_hold', 'rescheduled'));
  END IF;
END $$;

-- Create a function for safe concurrent booking insertion.
-- Uses advisory locks per captain to serialize booking inserts,
-- preventing TOCTOU race conditions.
CREATE OR REPLACE FUNCTION insert_booking_safely(
  p_captain_id UUID,
  p_trip_type_id UUID,
  p_vessel_id UUID,
  p_guest_name TEXT,
  p_guest_email TEXT,
  p_guest_phone TEXT,
  p_party_size INTEGER,
  p_scheduled_start TIMESTAMPTZ,
  p_scheduled_end TIMESTAMPTZ,
  p_special_requests TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'pending_deposit',
  p_total_price_cents INTEGER DEFAULT 0,
  p_deposit_paid_cents INTEGER DEFAULT 0,
  p_balance_due_cents INTEGER DEFAULT 0,
  p_internal_notes TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}'::TEXT[],
  p_referral_code TEXT DEFAULT NULL,
  p_referral_discount_cents INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking_id UUID;
  v_conflict_count INTEGER;
BEGIN
  -- Acquire advisory lock for this captain (serializes concurrent inserts)
  PERFORM pg_advisory_xact_lock(hashtext(p_captain_id::text));

  -- Check for overlapping active bookings
  SELECT COUNT(*)
  INTO v_conflict_count
  FROM bookings
  WHERE captain_id = p_captain_id
    AND status IN ('confirmed', 'pending_deposit', 'weather_hold', 'rescheduled')
    AND scheduled_start < p_scheduled_end
    AND scheduled_end > p_scheduled_start;

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'SLOT_UNAVAILABLE: This time slot conflicts with an existing booking';
  END IF;

  -- Insert the booking
  INSERT INTO bookings (
    captain_id, trip_type_id, vessel_id,
    guest_name, guest_email, guest_phone,
    party_size, scheduled_start, scheduled_end,
    special_requests, status, payment_status,
    total_price_cents, deposit_paid_cents, balance_due_cents,
    internal_notes, tags,
    referral_code, referral_discount_cents
  )
  VALUES (
    p_captain_id, p_trip_type_id, p_vessel_id,
    p_guest_name, p_guest_email, p_guest_phone,
    p_party_size, p_scheduled_start, p_scheduled_end,
    p_special_requests, p_status, 'unpaid',
    p_total_price_cents, p_deposit_paid_cents, p_balance_due_cents,
    p_internal_notes, p_tags,
    p_referral_code, p_referral_discount_cents
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

COMMENT ON FUNCTION insert_booking_safely IS
  'Safely inserts a booking with advisory lock to prevent double-booking race conditions';

COMMENT ON CONSTRAINT no_overlapping_active_bookings ON bookings IS
  'Prevents overlapping bookings for the same captain using time range exclusion';
