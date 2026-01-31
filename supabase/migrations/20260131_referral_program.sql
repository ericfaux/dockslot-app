-- ============================================================================
-- Guest Referral Program
-- ============================================================================
-- Enable referral codes, tracking, and rewards for guest acquisition

-- Referral Settings (per captain)
CREATE TABLE IF NOT EXISTS referral_settings (
  captain_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Program settings
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  referrer_reward_type TEXT NOT NULL DEFAULT 'percentage' CHECK (referrer_reward_type IN ('percentage', 'fixed', 'free_trip')),
  referrer_reward_value INTEGER NOT NULL DEFAULT 10, -- percentage (1-100) or cents
  referee_reward_type TEXT NOT NULL DEFAULT 'percentage' CHECK (referee_reward_type IN ('percentage', 'fixed', 'free_trip')),
  referee_reward_value INTEGER NOT NULL DEFAULT 10, -- percentage (1-100) or cents
  
  -- Minimum booking value for referral to qualify (in cents)
  min_booking_value_cents INTEGER DEFAULT 0,
  
  -- Expiration
  reward_expiry_days INTEGER DEFAULT 90, -- how long rewards are valid
  
  -- Terms
  terms_text TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guest Referral Codes
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Code details
  code TEXT NOT NULL, -- unique code like "SARAH2024"
  guest_email TEXT NOT NULL, -- who owns this code
  guest_name TEXT NOT NULL,
  
  -- Stats
  times_used INTEGER NOT NULL DEFAULT 0,
  total_bookings_value_cents INTEGER NOT NULL DEFAULT 0,
  total_rewards_earned_cents INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(captain_id, code)
);

CREATE INDEX idx_referral_codes_captain ON referral_codes(captain_id);
CREATE INDEX idx_referral_codes_email ON referral_codes(guest_email);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);

-- Referral Tracking (who referred whom)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Referral details
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referrer_email TEXT NOT NULL, -- person who shared the code
  referrer_name TEXT NOT NULL,
  referee_email TEXT NOT NULL, -- person who used the code
  referee_name TEXT NOT NULL,
  
  -- Associated booking
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  booking_value_cents INTEGER NOT NULL DEFAULT 0,
  
  -- Rewards
  referrer_reward_cents INTEGER NOT NULL DEFAULT 0,
  referee_reward_cents INTEGER NOT NULL DEFAULT 0,
  referrer_reward_applied BOOLEAN NOT NULL DEFAULT false,
  referee_reward_applied BOOLEAN NOT NULL DEFAULT false,
  referrer_reward_expires_at TIMESTAMPTZ,
  referee_reward_expires_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'rewarded', 'expired')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrals_captain ON referrals(captain_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code_id);
CREATE INDEX idx_referrals_booking ON referrals(booking_id);
CREATE INDEX idx_referrals_referrer_email ON referrals(referrer_email);
CREATE INDEX idx_referrals_referee_email ON referrals(referee_email);
CREATE INDEX idx_referrals_status ON referrals(status);

-- Add referral tracking to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referral_discount_cents INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_referral_code ON bookings(referral_code);
CREATE INDEX IF NOT EXISTS idx_bookings_referral_id ON bookings(referral_id);

-- Function: Generate unique referral code for guest
CREATE OR REPLACE FUNCTION generate_referral_code(
  p_captain_id UUID,
  p_guest_name TEXT,
  p_guest_email TEXT
) RETURNS TEXT AS $$
DECLARE
  v_base_code TEXT;
  v_code TEXT;
  v_counter INTEGER := 0;
  v_exists BOOLEAN;
BEGIN
  -- Generate base code from name (first 4-6 chars + year)
  v_base_code := UPPER(
    REGEXP_REPLACE(
      SUBSTRING(p_guest_name FROM 1 FOR 6),
      '[^A-Z0-9]',
      '',
      'g'
    ) || TO_CHAR(NOW(), 'YY')
  );
  
  v_code := v_base_code;
  
  -- Check if code exists, add counter if needed
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM referral_codes
      WHERE captain_id = p_captain_id AND code = v_code
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
    
    v_counter := v_counter + 1;
    v_code := v_base_code || v_counter::TEXT;
    
    IF v_counter > 99 THEN
      -- Fallback to random
      v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate referral rewards
CREATE OR REPLACE FUNCTION calculate_referral_rewards(
  p_captain_id UUID,
  p_booking_value_cents INTEGER
) RETURNS TABLE(
  referrer_reward_cents INTEGER,
  referee_reward_cents INTEGER
) AS $$
DECLARE
  v_settings RECORD;
BEGIN
  -- Get captain's referral settings
  SELECT * INTO v_settings
  FROM referral_settings
  WHERE captain_id = p_captain_id AND is_enabled = true;
  
  IF NOT FOUND OR p_booking_value_cents < COALESCE(v_settings.min_booking_value_cents, 0) THEN
    RETURN QUERY SELECT 0, 0;
    RETURN;
  END IF;
  
  -- Calculate referrer reward
  IF v_settings.referrer_reward_type = 'percentage' THEN
    referrer_reward_cents := (p_booking_value_cents * v_settings.referrer_reward_value / 100)::INTEGER;
  ELSIF v_settings.referrer_reward_type = 'fixed' THEN
    referrer_reward_cents := v_settings.referrer_reward_value;
  ELSE -- free_trip
    referrer_reward_cents := p_booking_value_cents; -- full value
  END IF;
  
  -- Calculate referee reward
  IF v_settings.referee_reward_type = 'percentage' THEN
    referee_reward_cents := (p_booking_value_cents * v_settings.referee_reward_value / 100)::INTEGER;
  ELSIF v_settings.referee_reward_type = 'fixed' THEN
    referee_reward_cents := v_settings.referee_reward_value;
  ELSE -- free_trip
    referee_reward_cents := p_booking_value_cents; -- full value
  END IF;
  
  RETURN QUERY SELECT referrer_reward_cents, referee_reward_cents;
END;
$$ LANGUAGE plpgsql;

-- Function: Get referral stats for captain
CREATE OR REPLACE FUNCTION get_referral_stats(p_captain_id UUID)
RETURNS TABLE(
  total_referrals INTEGER,
  qualified_referrals INTEGER,
  total_bookings_value_cents BIGINT,
  total_rewards_given_cents BIGINT,
  active_codes INTEGER,
  top_referrers JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_referrals,
    COUNT(*) FILTER (WHERE status = 'qualified' OR status = 'rewarded')::INTEGER AS qualified_referrals,
    COALESCE(SUM(booking_value_cents), 0)::BIGINT AS total_bookings_value_cents,
    COALESCE(SUM(referrer_reward_cents + referee_reward_cents), 0)::BIGINT AS total_rewards_given_cents,
    (SELECT COUNT(*)::INTEGER FROM referral_codes WHERE captain_id = p_captain_id AND is_active = true) AS active_codes,
    (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT
          rc.code,
          rc.guest_name,
          rc.times_used,
          rc.total_bookings_value_cents,
          rc.total_rewards_earned_cents
        FROM referral_codes rc
        WHERE rc.captain_id = p_captain_id
        ORDER BY rc.times_used DESC, rc.total_bookings_value_cents DESC
        LIMIT 10
      ) t
    ) AS top_referrers
  FROM referrals
  WHERE captain_id = p_captain_id;
END;
$$ LANGUAGE plpgsql;
