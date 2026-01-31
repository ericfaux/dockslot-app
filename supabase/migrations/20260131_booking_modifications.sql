-- Create booking modification requests table
CREATE TABLE IF NOT EXISTS booking_modification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Request details
  requested_by VARCHAR(10) NOT NULL CHECK (requested_by IN ('guest', 'captain')),
  modification_type VARCHAR(20) NOT NULL CHECK (modification_type IN ('date_time', 'party_size', 'both')),
  
  -- Requested changes
  new_scheduled_start TIMESTAMP WITH TIME ZONE,
  new_scheduled_end TIMESTAMP WITH TIME ZONE,
  new_party_size INTEGER,
  
  -- Original values (for reference)
  original_scheduled_start TIMESTAMP WITH TIME ZONE,
  original_scheduled_end TIMESTAMP WITH TIME ZONE,
  original_party_size INTEGER,
  
  -- Request metadata
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  
  -- Captain response
  captain_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (
    new_scheduled_start IS NULL OR new_scheduled_end IS NULL OR new_scheduled_start < new_scheduled_end
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_modification_booking_id ON booking_modification_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_modification_status ON booking_modification_requests(status);
CREATE INDEX IF NOT EXISTS idx_modification_created_at ON booking_modification_requests(created_at DESC);

-- Comments
COMMENT ON TABLE booking_modification_requests IS 'Guest and captain requests to modify existing bookings';
COMMENT ON COLUMN booking_modification_requests.modification_type IS 'Type of modification: date_time, party_size, or both';
COMMENT ON COLUMN booking_modification_requests.status IS 'Request status: pending, approved, rejected, cancelled';

-- Function to apply approved modification to booking
CREATE OR REPLACE FUNCTION apply_booking_modification(modification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  mod_record RECORD;
  booking_record RECORD;
BEGIN
  -- Get modification request
  SELECT * INTO mod_record
  FROM booking_modification_requests
  WHERE id = modification_id AND status = 'approved';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Modification not found or not approved';
  END IF;
  
  -- Get booking
  SELECT * INTO booking_record
  FROM bookings
  WHERE id = mod_record.booking_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  -- Apply changes
  UPDATE bookings
  SET
    scheduled_start = COALESCE(mod_record.new_scheduled_start, scheduled_start),
    scheduled_end = COALESCE(mod_record.new_scheduled_end, scheduled_end),
    party_size = COALESCE(mod_record.new_party_size, party_size),
    updated_at = NOW()
  WHERE id = mod_record.booking_id;
  
  -- Log in booking_logs
  INSERT INTO booking_logs (booking_id, event_type, details, metadata)
  VALUES (
    mod_record.booking_id,
    'booking_modified',
    CASE
      WHEN mod_record.modification_type = 'date_time' THEN 'Date/time modified'
      WHEN mod_record.modification_type = 'party_size' THEN 'Party size modified'
      ELSE 'Booking details modified'
    END,
    jsonb_build_object(
      'modification_id', modification_id,
      'requested_by', mod_record.requested_by,
      'old_start', mod_record.original_scheduled_start,
      'new_start', mod_record.new_scheduled_start,
      'old_party_size', mod_record.original_party_size,
      'new_party_size', mod_record.new_party_size
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_modification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER modification_updated_at
  BEFORE UPDATE ON booking_modification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_modification_updated_at();
