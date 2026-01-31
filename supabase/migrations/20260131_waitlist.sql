-- ============================================================================
-- Waitlist System
-- ============================================================================
-- Allow guests to join waitlist when desired slots are fully booked

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_type_id UUID NOT NULL REFERENCES trip_types(id) ON DELETE CASCADE,
  
  -- Guest info
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  party_size INTEGER NOT NULL CHECK (party_size >= 1 AND party_size <= 6),
  
  -- Desired date/time window
  preferred_date DATE NOT NULL,
  preferred_time_start TIME,
  preferred_time_end TIME,
  flexible_dates BOOLEAN NOT NULL DEFAULT false, -- can do nearby dates
  
  -- Special requests
  special_requests TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'notified', 'converted', 'cancelled', 'expired')),
  notified_at TIMESTAMPTZ,
  notified_for_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  converted_to_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_waitlist_captain ON waitlist_entries(captain_id);
CREATE INDEX idx_waitlist_trip_type ON waitlist_entries(trip_type_id);
CREATE INDEX idx_waitlist_status ON waitlist_entries(status);
CREATE INDEX idx_waitlist_date ON waitlist_entries(preferred_date);
CREATE INDEX idx_waitlist_email ON waitlist_entries(guest_email);
CREATE INDEX idx_waitlist_expires ON waitlist_entries(expires_at) WHERE status = 'active';

-- Function: Find matching waitlist entries for a newly available slot
CREATE OR REPLACE FUNCTION find_matching_waitlist_entries(
  p_captain_id UUID,
  p_trip_type_id UUID,
  p_date DATE,
  p_time_start TIME,
  p_time_end TIME
) RETURNS TABLE(
  id UUID,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  party_size INTEGER,
  special_requests TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    we.id,
    we.guest_name,
    we.guest_email,
    we.guest_phone,
    we.party_size,
    we.special_requests,
    we.created_at
  FROM waitlist_entries we
  WHERE we.captain_id = p_captain_id
    AND we.trip_type_id = p_trip_type_id
    AND we.status = 'active'
    AND we.expires_at > NOW()
    AND (
      -- Exact date match
      (we.preferred_date = p_date AND NOT we.flexible_dates)
      OR
      -- Flexible dates (within 3 days)
      (we.flexible_dates AND we.preferred_date BETWEEN p_date - INTERVAL '3 days' AND p_date + INTERVAL '3 days')
    )
    AND (
      -- No time preference (any time works)
      (we.preferred_time_start IS NULL AND we.preferred_time_end IS NULL)
      OR
      -- Time preference matches
      (
        we.preferred_time_start IS NOT NULL 
        AND we.preferred_time_end IS NOT NULL
        AND p_time_start >= we.preferred_time_start
        AND p_time_end <= we.preferred_time_end
      )
    )
  ORDER BY we.created_at ASC; -- First come, first served
END;
$$ LANGUAGE plpgsql;

-- Function: Get waitlist stats for captain
CREATE OR REPLACE FUNCTION get_waitlist_stats(p_captain_id UUID)
RETURNS TABLE(
  total_active INTEGER,
  total_notified INTEGER,
  total_converted INTEGER,
  total_expired INTEGER,
  conversion_rate NUMERIC,
  avg_wait_time_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'active')::INTEGER AS total_active,
    COUNT(*) FILTER (WHERE status = 'notified')::INTEGER AS total_notified,
    COUNT(*) FILTER (WHERE status = 'converted')::INTEGER AS total_converted,
    COUNT(*) FILTER (WHERE status = 'expired')::INTEGER AS total_expired,
    CASE 
      WHEN COUNT(*) FILTER (WHERE status IN ('notified', 'converted')) > 0
      THEN ROUND(
        100.0 * COUNT(*) FILTER (WHERE status = 'converted') / 
        NULLIF(COUNT(*) FILTER (WHERE status IN ('notified', 'converted')), 0),
        1
      )
      ELSE 0
    END AS conversion_rate,
    ROUND(
      AVG(
        EXTRACT(EPOCH FROM (COALESCE(notified_at, NOW()) - created_at)) / 3600
      )::NUMERIC,
      1
    ) AS avg_wait_time_hours
  FROM waitlist_entries
  WHERE captain_id = p_captain_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-expire old waitlist entries (run via cron)
CREATE OR REPLACE FUNCTION expire_old_waitlist_entries()
RETURNS TABLE(
  expired_count INTEGER
) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE waitlist_entries
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE status = 'active'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on changes
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER waitlist_updated_at
  BEFORE UPDATE ON waitlist_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_updated_at();
