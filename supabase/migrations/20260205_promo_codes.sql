-- ============================================================================
-- Promo Code System
-- ============================================================================
-- Captain-managed promo codes for direct booking incentives
-- Supports percentage and fixed-amount discounts with date ranges and usage limits

-- Promo Codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Code details
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0), -- percentage (1-100) or cents

  -- Validity
  valid_from DATE,
  valid_to DATE,
  max_uses INTEGER, -- NULL = unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,

  -- Applicable trip types (empty array = all trip types)
  trip_type_ids UUID[] NOT NULL DEFAULT '{}',

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Tracking
  total_discount_cents BIGINT NOT NULL DEFAULT 0, -- total discount given via this code
  total_booking_revenue_cents BIGINT NOT NULL DEFAULT 0, -- total booking value from this code

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(captain_id, code),
  CHECK (discount_type != 'percentage' OR (discount_value >= 1 AND discount_value <= 100))
);

CREATE INDEX idx_promo_codes_captain ON promo_codes(captain_id);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(captain_id, is_active) WHERE is_active = true;

-- Add promo code tracking to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_discount_cents INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_bookings_promo_code_id ON bookings(promo_code_id);

-- RLS Policies
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Captains can view own promo codes"
  ON promo_codes FOR SELECT
  USING (auth.uid() = captain_id);

CREATE POLICY "Captains can insert own promo codes"
  ON promo_codes FOR INSERT
  WITH CHECK (auth.uid() = captain_id);

CREATE POLICY "Captains can update own promo codes"
  ON promo_codes FOR UPDATE
  USING (auth.uid() = captain_id);

CREATE POLICY "Captains can delete own promo codes"
  ON promo_codes FOR DELETE
  USING (auth.uid() = captain_id);

-- Service role can read promo codes (for public validation endpoint)
CREATE POLICY "Service role can read all promo codes"
  ON promo_codes FOR SELECT
  USING (auth.role() = 'service_role');

-- Function: Validate a promo code and return discount info
CREATE OR REPLACE FUNCTION validate_promo_code(
  p_captain_id UUID,
  p_code TEXT,
  p_trip_type_id UUID,
  p_booking_value_cents INTEGER
) RETURNS TABLE(
  is_valid BOOLEAN,
  promo_code_id UUID,
  discount_type TEXT,
  discount_value INTEGER,
  discount_cents INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_promo RECORD;
  v_discount_cents INTEGER;
BEGIN
  -- Find the promo code
  SELECT * INTO v_promo
  FROM promo_codes pc
  WHERE pc.captain_id = p_captain_id
    AND UPPER(pc.code) = UPPER(p_code)
    AND pc.is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, 0, 'Invalid promo code'::TEXT;
    RETURN;
  END IF;

  -- Check date range
  IF v_promo.valid_from IS NOT NULL AND CURRENT_DATE < v_promo.valid_from THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, 0, 'This promo code is not yet active'::TEXT;
    RETURN;
  END IF;

  IF v_promo.valid_to IS NOT NULL AND CURRENT_DATE > v_promo.valid_to THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, 0, 'This promo code has expired'::TEXT;
    RETURN;
  END IF;

  -- Check usage limit
  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, 0, 'This promo code has reached its usage limit'::TEXT;
    RETURN;
  END IF;

  -- Check trip type applicability
  IF array_length(v_promo.trip_type_ids, 1) > 0 AND NOT (p_trip_type_id = ANY(v_promo.trip_type_ids)) THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, 0, 'This promo code does not apply to this trip type'::TEXT;
    RETURN;
  END IF;

  -- Calculate discount
  IF v_promo.discount_type = 'percentage' THEN
    v_discount_cents := (p_booking_value_cents * v_promo.discount_value / 100)::INTEGER;
  ELSE -- fixed
    v_discount_cents := LEAST(v_promo.discount_value, p_booking_value_cents);
  END IF;

  RETURN QUERY SELECT
    true,
    v_promo.id,
    v_promo.discount_type,
    v_promo.discount_value,
    v_discount_cents,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function: Get promo code stats for captain
CREATE OR REPLACE FUNCTION get_promo_code_stats(p_captain_id UUID)
RETURNS TABLE(
  total_codes INTEGER,
  active_codes INTEGER,
  total_uses INTEGER,
  total_discount_given_cents BIGINT,
  total_revenue_from_promos_cents BIGINT,
  top_codes JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_codes,
    COUNT(*) FILTER (WHERE pc.is_active = true)::INTEGER AS active_codes,
    COALESCE(SUM(pc.current_uses), 0)::INTEGER AS total_uses,
    COALESCE(SUM(pc.total_discount_cents), 0)::BIGINT AS total_discount_given_cents,
    COALESCE(SUM(pc.total_booking_revenue_cents), 0)::BIGINT AS total_revenue_from_promos_cents,
    (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT
          pc2.id,
          pc2.code,
          pc2.discount_type,
          pc2.discount_value,
          pc2.current_uses,
          pc2.max_uses,
          pc2.total_discount_cents,
          pc2.total_booking_revenue_cents,
          pc2.is_active,
          pc2.valid_from,
          pc2.valid_to
        FROM promo_codes pc2
        WHERE pc2.captain_id = p_captain_id
        ORDER BY pc2.current_uses DESC, pc2.total_booking_revenue_cents DESC
        LIMIT 10
      ) t
    ) AS top_codes
  FROM promo_codes pc
  WHERE pc.captain_id = p_captain_id;
END;
$$ LANGUAGE plpgsql;
