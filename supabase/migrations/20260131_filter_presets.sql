-- Filter Presets for Bookings List
-- Allows captains to save frequently used filter combinations

CREATE TABLE IF NOT EXISTS filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_filter_presets_owner ON filter_presets(owner_id);

-- Only one default preset per owner
CREATE UNIQUE INDEX idx_filter_presets_default ON filter_presets(owner_id) WHERE is_default = true;

-- Comments
COMMENT ON TABLE filter_presets IS 'Saved filter configurations for the bookings list';
COMMENT ON COLUMN filter_presets.filters IS 'JSON object containing filter state (search, tags, statuses, payment_status, date_range)';
COMMENT ON COLUMN filter_presets.is_default IS 'If true, this preset is loaded automatically on page load';
