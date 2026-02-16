-- ============================================================================
-- Migration: 3-Tier Pricing (Deckhand / Captain / Fleet)
--
-- Renames existing tiers:
--   'starter' → 'deckhand' (free tier)
--   'pro'     → 'captain'  ($29/month or $249/year)
-- Adds new tier:
--   'fleet'               ($79/month or $699/year)
-- ============================================================================

-- 1. Drop the existing CHECK constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_subscription_tier;

-- 2. Migrate existing data
UPDATE profiles SET subscription_tier = 'deckhand' WHERE subscription_tier = 'starter';
UPDATE profiles SET subscription_tier = 'captain' WHERE subscription_tier = 'pro';

-- 3. Update the default value
ALTER TABLE profiles ALTER COLUMN subscription_tier SET DEFAULT 'deckhand';

-- 4. Add the new CHECK constraint with all three tiers
ALTER TABLE profiles
ADD CONSTRAINT chk_subscription_tier
CHECK (subscription_tier IN ('deckhand', 'captain', 'fleet'));

-- 5. Add comment for documentation
COMMENT ON COLUMN profiles.subscription_tier IS 'Current plan: deckhand (free), captain ($29/mo or $249/yr), or fleet ($79/mo or $699/yr)';
