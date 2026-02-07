-- Captain Subscription Fields
-- Adds subscription tracking to the profiles table for DockSlot SaaS billing

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- Constrain subscription_tier values
ALTER TABLE profiles
ADD CONSTRAINT chk_subscription_tier
CHECK (subscription_tier IN ('starter', 'pro'));

-- Constrain subscription_status values
ALTER TABLE profiles
ADD CONSTRAINT chk_subscription_status
CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid'));

-- Index for quick lookups by Stripe IDs
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON profiles(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON COLUMN profiles.subscription_tier IS 'Current plan: starter (free) or pro ($29/mo)';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe Customer ID for subscription billing';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Stripe Subscription ID for the active plan';
COMMENT ON COLUMN profiles.subscription_status IS 'Stripe subscription status: active, trialing, past_due, canceled, unpaid';
COMMENT ON COLUMN profiles.subscription_current_period_end IS 'When the current billing period ends (used for grace periods)';
