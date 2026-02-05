-- Waiver system enhancements
-- Adds device info tracking, reminder throttling, and template versioning

-- Add device_info column to waiver_signatures for audit trail
ALTER TABLE waiver_signatures
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT NULL;

COMMENT ON COLUMN waiver_signatures.device_info IS 'Device/browser information at time of signing for audit trail';

-- Create waiver_reminders table to track reminder sends and throttling
CREATE TABLE IF NOT EXISTS waiver_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  sent_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email_sent_to VARCHAR(255),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for throttle checking (get most recent reminder per passenger/booking)
CREATE INDEX IF NOT EXISTS idx_waiver_reminders_throttle
  ON waiver_reminders(booking_id, passenger_id, sent_at DESC);

-- Index for captain querying their sent reminders
CREATE INDEX IF NOT EXISTS idx_waiver_reminders_sent_by
  ON waiver_reminders(sent_by, sent_at DESC);

COMMENT ON TABLE waiver_reminders IS 'Tracks waiver reminder emails for throttling (max 1 per 24h per passenger)';

-- Add updated_at column to waiver_templates if it doesn't exist
-- (it exists based on the schema, but ensure trigger exists)

-- Add previous_version_id for template versioning
ALTER TABLE waiver_templates
ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES waiver_templates(id) ON DELETE SET NULL;

COMMENT ON COLUMN waiver_templates.previous_version_id IS 'Links to the previous version of this template for version history';

-- Create a view for getting the latest reminder time for each passenger
CREATE OR REPLACE VIEW passenger_last_reminder AS
SELECT DISTINCT ON (booking_id, passenger_id)
  booking_id,
  passenger_id,
  sent_at as last_reminder_sent,
  email_sent_to
FROM waiver_reminders
ORDER BY booking_id, passenger_id, sent_at DESC;

-- Function to check if reminder can be sent (24h throttle)
CREATE OR REPLACE FUNCTION can_send_waiver_reminder(
  p_booking_id UUID,
  p_passenger_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  last_sent TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT sent_at INTO last_sent
  FROM waiver_reminders
  WHERE booking_id = p_booking_id AND passenger_id = p_passenger_id
  ORDER BY sent_at DESC
  LIMIT 1;

  -- If no reminder ever sent, or more than 24 hours ago, allow
  IF last_sent IS NULL OR last_sent < NOW() - INTERVAL '24 hours' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
