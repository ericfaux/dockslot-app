-- Add cancellation policy to trip_types table
ALTER TABLE trip_types
ADD COLUMN IF NOT EXISTS cancellation_policy_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS cancellation_refund_percentage INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS cancellation_policy_text TEXT;

-- Add comments
COMMENT ON COLUMN trip_types.cancellation_policy_hours IS 'Hours before trip start that full refund is available (e.g., 24 = full refund if cancelled 24h+ before)';
COMMENT ON COLUMN trip_types.cancellation_refund_percentage IS 'Percentage refunded if cancelled within the policy window (0-100)';
COMMENT ON COLUMN trip_types.cancellation_policy_text IS 'Custom cancellation policy text shown to guests (optional)';

-- Add cancellation_requested_at to bookings for tracking
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

COMMENT ON COLUMN bookings.cancellation_requested_at IS 'When guest/captain requested cancellation';
COMMENT ON COLUMN bookings.cancellation_reason IS 'Reason for cancellation (guest-provided or captain notes)';

-- Create function to calculate refund amount based on policy
CREATE OR REPLACE FUNCTION calculate_cancellation_refund(
  booking_id_param UUID,
  OUT refund_percentage INTEGER,
  OUT refund_amount INTEGER,
  OUT policy_description TEXT
) AS $$
DECLARE
  booking_record RECORD;
  hours_until_trip NUMERIC;
BEGIN
  -- Get booking with trip type policy
  SELECT 
    b.*,
    tt.cancellation_policy_hours,
    tt.cancellation_refund_percentage,
    tt.cancellation_policy_text
  INTO booking_record
  FROM bookings b
  JOIN trip_types tt ON b.trip_type_id = tt.id
  WHERE b.id = booking_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Calculate hours until trip starts
  hours_until_trip := EXTRACT(EPOCH FROM (booking_record.scheduled_start - NOW())) / 3600;

  -- Determine refund based on policy
  IF hours_until_trip >= booking_record.cancellation_policy_hours THEN
    -- Full refund (outside policy window)
    refund_percentage := 100;
    policy_description := format(
      'Full refund - cancelled %s hours before trip (policy requires %s hours)',
      ROUND(hours_until_trip, 1),
      booking_record.cancellation_policy_hours
    );
  ELSE
    -- Partial or no refund (within policy window)
    refund_percentage := booking_record.cancellation_refund_percentage;
    policy_description := format(
      '%s%% refund - cancelled %s hours before trip (less than %s hour policy)',
      refund_percentage,
      ROUND(hours_until_trip, 1),
      booking_record.cancellation_policy_hours
    );
  END IF;

  -- Calculate actual refund amount
  refund_amount := ROUND((booking_record.total_price * refund_percentage) / 100.0);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
