-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  captain_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Rating fields
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  vessel_rating INTEGER CHECK (vessel_rating >= 1 AND vessel_rating <= 5),
  captain_rating INTEGER CHECK (captain_rating >= 1 AND captain_rating <= 5),
  experience_rating INTEGER CHECK (experience_rating >= 1 AND experience_rating <= 5),
  
  -- Review content
  review_title VARCHAR(200),
  review_text TEXT,
  
  -- Guest info (denormalized for display)
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255),
  
  -- Metadata
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  
  -- Response from captain
  captain_response TEXT,
  captain_response_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT one_review_per_booking UNIQUE (booking_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_captain_id ON reviews(captain_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_is_public ON reviews(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_reviews_overall_rating ON reviews(overall_rating);

-- Comments
COMMENT ON TABLE reviews IS 'Guest reviews and ratings for completed trips';
COMMENT ON COLUMN reviews.overall_rating IS 'Overall trip rating (1-5 stars)';
COMMENT ON COLUMN reviews.is_featured IS 'Featured on captain profile (captain selects)';
COMMENT ON COLUMN reviews.is_approved IS 'Captain approval (auto-approved by default)';
COMMENT ON COLUMN reviews.is_public IS 'Visible on public profile';

-- Function to calculate average ratings for a captain
CREATE OR REPLACE FUNCTION get_captain_ratings(captain_id_param UUID)
RETURNS TABLE (
  total_reviews BIGINT,
  average_overall NUMERIC,
  average_vessel NUMERIC,
  average_captain NUMERIC,
  average_experience NUMERIC,
  rating_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_reviews,
    ROUND(AVG(overall_rating), 2) AS average_overall,
    ROUND(AVG(vessel_rating), 2) AS average_vessel,
    ROUND(AVG(captain_rating), 2) AS average_captain,
    ROUND(AVG(experience_rating), 2) AS average_experience,
    jsonb_build_object(
      '5', COUNT(*) FILTER (WHERE overall_rating = 5),
      '4', COUNT(*) FILTER (WHERE overall_rating = 4),
      '3', COUNT(*) FILTER (WHERE overall_rating = 3),
      '2', COUNT(*) FILTER (WHERE overall_rating = 2),
      '1', COUNT(*) FILTER (WHERE overall_rating = 1)
    ) AS rating_distribution
  FROM reviews
  WHERE captain_id = captain_id_param
    AND is_public = TRUE
    AND is_approved = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();
