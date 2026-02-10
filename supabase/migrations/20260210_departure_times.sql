-- Add departure_times JSONB column to trip_types
-- Allows captains to configure specific departure times per trip type
-- e.g., ["6:00 AM", "10:00 AM", "2:00 PM", "6:00 PM"]
-- When null or empty, the system falls back to 30-minute interval generation

ALTER TABLE trip_types
ADD COLUMN IF NOT EXISTS departure_times JSONB DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN trip_types.departure_times IS 'JSON array of departure time strings in "h:mm AM/PM" format. Null or empty falls back to 30-minute intervals.';
