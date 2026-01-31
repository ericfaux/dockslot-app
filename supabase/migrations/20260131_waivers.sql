-- Create waiver templates table
CREATE TABLE IF NOT EXISTS waiver_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waiver signatures table
CREATE TABLE IF NOT EXISTS waiver_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  passenger_id UUID REFERENCES passengers(id) ON DELETE SET NULL,
  waiver_template_id UUID NOT NULL REFERENCES waiver_templates(id),
  
  -- Signer info
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255),
  
  -- Signature data
  signature_data TEXT, -- Base64 encoded signature image
  ip_address INET,
  
  -- Agreement
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  template_version INTEGER NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_waiver_templates_owner ON waiver_templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_waiver_templates_active ON waiver_templates(owner_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_waiver_signatures_booking ON waiver_signatures(booking_id);
CREATE INDEX IF NOT EXISTS idx_waiver_signatures_passenger ON waiver_signatures(passenger_id);
CREATE INDEX IF NOT EXISTS idx_waiver_signatures_template ON waiver_signatures(waiver_template_id);

-- Comments
COMMENT ON TABLE waiver_templates IS 'Reusable liability waiver templates for captains';
COMMENT ON TABLE waiver_signatures IS 'Signed waiver documents from guests';
COMMENT ON COLUMN waiver_signatures.signature_data IS 'Base64 encoded signature image (SVG or PNG)';

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
