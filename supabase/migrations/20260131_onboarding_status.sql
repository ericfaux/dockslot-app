-- Add onboarding status tracking to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Comments
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether captain has completed the onboarding wizard';
COMMENT ON COLUMN profiles.onboarding_step IS 'Current step in onboarding (0-4)';
COMMENT ON COLUMN profiles.onboarding_completed_at IS 'When onboarding was completed';

-- Index for finding incomplete onboarding
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed) WHERE onboarding_completed = FALSE;
