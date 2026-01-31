-- Create waiver templates table
CREATE TABLE IF NOT EXISTS waiver_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  name VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT one_default_per_captain UNIQUE (captain_id, is_default) WHERE is_default = TRUE
);

-- Create waiver signatures table
CREATE TABLE IF NOT EXISTS waiver_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  waiver_template_id UUID NOT NULL REFERENCES waiver_templates(id),
  
  -- Signer info
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255),
  
  -- Signature data
  signature_data TEXT NOT NULL, -- Base64 encoded signature image
  ip_address INET,
  user_agent TEXT,
  
  -- Agreement
  agreed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  waiver_content_snapshot TEXT NOT NULL, -- Copy of waiver at time of signing
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create passenger waivers junction table
CREATE TABLE IF NOT EXISTS passenger_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  waiver_signature_id UUID REFERENCES waiver_signatures(id) ON DELETE SET NULL,
  
  passenger_name VARCHAR(255) NOT NULL,
  passenger_age INTEGER,
  is_minor BOOLEAN DEFAULT FALSE,
  guardian_name VARCHAR(255), -- If minor
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_waiver_templates_captain ON waiver_templates(captain_id);
CREATE INDEX IF NOT EXISTS idx_waiver_templates_default ON waiver_templates(captain_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_waiver_signatures_booking ON waiver_signatures(booking_id);
CREATE INDEX IF NOT EXISTS idx_passenger_waivers_booking ON passenger_waivers(booking_id);
CREATE INDEX IF NOT EXISTS idx_passenger_waivers_status ON passenger_waivers(status);

-- Comments
COMMENT ON TABLE waiver_templates IS 'Reusable liability waiver templates for captains';
COMMENT ON TABLE waiver_signatures IS 'Signed waiver documents from guests';
COMMENT ON TABLE passenger_waivers IS 'Per-passenger waiver tracking for each booking';
COMMENT ON COLUMN waiver_signatures.signature_data IS 'Base64 encoded signature image (SVG or PNG)';
COMMENT ON COLUMN waiver_signatures.waiver_content_snapshot IS 'Immutable copy of waiver text at signing time';

-- Function to check if all passengers have signed waivers
CREATE OR REPLACE FUNCTION check_booking_waivers_complete(booking_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_passengers INTEGER;
  signed_passengers INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_passengers
  FROM passenger_waivers
  WHERE booking_id = booking_id_param;
  
  SELECT COUNT(*) INTO signed_passengers
  FROM passenger_waivers
  WHERE booking_id = booking_id_param
    AND status = 'signed';
  
  RETURN total_passengers > 0 AND total_passengers = signed_passengers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update passenger_waivers updated_at
CREATE OR REPLACE FUNCTION update_passenger_waivers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER passenger_waivers_updated_at
  BEFORE UPDATE ON passenger_waivers
  FOR EACH ROW
  EXECUTE FUNCTION update_passenger_waivers_updated_at();

-- Trigger to update waiver_templates updated_at
CREATE OR REPLACE FUNCTION update_waiver_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER waiver_templates_updated_at
  BEFORE UPDATE ON waiver_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_waiver_templates_updated_at();
