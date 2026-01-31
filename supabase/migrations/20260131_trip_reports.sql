-- Trip Reports table for post-trip documentation
CREATE TABLE IF NOT EXISTS trip_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- References
  captain_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
  
  -- Trip Timeline
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL,
  
  -- Passengers
  actual_passengers INTEGER NOT NULL,
  passenger_names TEXT[], -- Optional detailed list
  
  -- Conditions
  conditions_summary TEXT NOT NULL, -- "Calm", "Moderate", "Rough"
  weather_conditions JSONB, -- Structured weather data
  
  -- Safety & Incidents
  incidents TEXT, -- Any incidents, injuries, equipment issues
  safety_equipment_checked BOOLEAN DEFAULT false,
  
  -- Operational Notes
  notes TEXT,
  fuel_used DECIMAL(10, 2), -- Gallons
  hours_operated DECIMAL(10, 2), -- Engine hours
  
  -- Media
  photos TEXT[], -- URLs to stored photos
  
  CONSTRAINT valid_times CHECK (arrival_time > departure_time),
  CONSTRAINT valid_passengers CHECK (actual_passengers > 0)
);

-- Indexes
CREATE INDEX idx_trip_reports_captain ON trip_reports(captain_id);
CREATE INDEX idx_trip_reports_booking ON trip_reports(booking_id);
CREATE INDEX idx_trip_reports_departure ON trip_reports(departure_time DESC);

-- RLS Policies
ALTER TABLE trip_reports ENABLE ROW LEVEL SECURITY;

-- Captains can view/edit their own reports
CREATE POLICY "Captains can view own trip reports"
  ON trip_reports FOR SELECT
  USING (auth.uid() = captain_id);

CREATE POLICY "Captains can create trip reports"
  ON trip_reports FOR INSERT
  WITH CHECK (auth.uid() = captain_id);

CREATE POLICY "Captains can update own trip reports"
  ON trip_reports FOR UPDATE
  USING (auth.uid() = captain_id)
  WITH CHECK (auth.uid() = captain_id);

CREATE POLICY "Captains can delete own trip reports"
  ON trip_reports FOR DELETE
  USING (auth.uid() = captain_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_trip_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_trip_reports_updated_at
  BEFORE UPDATE ON trip_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_reports_updated_at();

-- Add foreign key to bookings (optional reverse link)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trip_report_id UUID REFERENCES trip_reports(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_trip_report ON bookings(trip_report_id);

COMMENT ON TABLE trip_reports IS 'Post-trip documentation for safety, compliance, and records';
COMMENT ON COLUMN trip_reports.conditions_summary IS 'Quick summary: Calm, Moderate, Rough, etc.';
COMMENT ON COLUMN trip_reports.weather_conditions IS 'Structured NOAA or manual weather data';
COMMENT ON COLUMN trip_reports.incidents IS 'Any safety incidents, injuries, or equipment issues';
