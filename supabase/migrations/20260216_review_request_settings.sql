-- Add review request customization columns to email_preferences
-- Allows captains to control timing, custom message, and Google Reviews link

ALTER TABLE email_preferences
  ADD COLUMN IF NOT EXISTS review_request_timing TEXT NOT NULL DEFAULT '24h',
  ADD COLUMN IF NOT EXISTS review_request_custom_message TEXT,
  ADD COLUMN IF NOT EXISTS google_review_link TEXT,
  ADD COLUMN IF NOT EXISTS include_google_review_link BOOLEAN NOT NULL DEFAULT false;

-- Add constraint for valid timing values
ALTER TABLE email_preferences
  ADD CONSTRAINT check_review_request_timing
  CHECK (review_request_timing IN ('immediate', '8h', '24h', '48h'));
