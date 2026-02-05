-- Add geocoding coordinate columns to profiles table
-- These columns store lat/lon derived from meeting_spot_address
-- enabling NOAA weather alerts, dashboard weather overlay, and cron-based weather checks.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS meeting_spot_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS meeting_spot_longitude DOUBLE PRECISION;

-- Optional: Add a check constraint to ensure coordinates are within valid ranges
ALTER TABLE profiles
  ADD CONSTRAINT meeting_spot_latitude_range
    CHECK (meeting_spot_latitude IS NULL OR (meeting_spot_latitude >= -90 AND meeting_spot_latitude <= 90)),
  ADD CONSTRAINT meeting_spot_longitude_range
    CHECK (meeting_spot_longitude IS NULL OR (meeting_spot_longitude >= -180 AND meeting_spot_longitude <= 180));
