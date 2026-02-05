-- Add dock mode setting to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dock_mode_enabled BOOLEAN DEFAULT FALSE;

-- Comment
COMMENT ON COLUMN profiles.dock_mode_enabled IS 'Whether captain has enabled the simplified Dock Mode interface for use while on the water';
