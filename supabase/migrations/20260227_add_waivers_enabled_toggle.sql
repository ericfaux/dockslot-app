-- Add waivers_enabled toggle to profiles table
-- Whether this captain requires waiver signatures for bookings
ALTER TABLE profiles ADD COLUMN waivers_enabled BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.waivers_enabled IS 'Whether this captain requires waiver signatures for bookings';

-- For existing captains who already have active waiver templates, set waivers_enabled = TRUE
-- so we don't break their existing setup
UPDATE profiles SET waivers_enabled = TRUE
WHERE id IN (SELECT DISTINCT owner_id FROM waiver_templates WHERE is_active = TRUE);
