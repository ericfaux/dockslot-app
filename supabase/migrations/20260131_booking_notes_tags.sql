-- Add notes and tags to bookings table
ALTER TABLE bookings 
ADD COLUMN captain_notes TEXT,
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create index for tag searches
CREATE INDEX idx_bookings_tags ON bookings USING GIN (tags);

-- Add comment
COMMENT ON COLUMN bookings.captain_notes IS 'Private notes from captain about this booking (special requests, preferences, etc.)';
COMMENT ON COLUMN bookings.tags IS 'Searchable tags for categorizing bookings (VIP, first-timer, anniversary, etc.)';
