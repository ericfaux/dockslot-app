-- Mirror Stripe account capability state on profiles so the captain
-- payments dashboard and (later) the booking checkout flow can gate on
-- the connected account's status without hitting the Stripe API on every
-- request. The Connect lifecycle webhook (separate story) will keep
-- these in sync via account.updated and account.application.deauthorized.
--
-- profiles.stripe_account_id already exists; this migration adds the
-- five status fields the foundation Connect helpers (lib/stripe/connect.ts)
-- read and write.
--
-- All defaults preserve existing-row behavior: any captain who already
-- has a stripe_account_id but hasn't been resync'd through the new
-- helpers reads as not_connected with all capability booleans false,
-- which renders correctly through the new dashboard logic. The next
-- onboard/return cycle (or the lifecycle webhook once it lands) will
-- resync them.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS stripe_account_status text NOT NULL DEFAULT 'not_connected',
    ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS stripe_details_submitted boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS stripe_connected_at timestamptz;

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_stripe_account_status_check;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_stripe_account_status_check
    CHECK (stripe_account_status IN ('not_connected', 'pending', 'active', 'restricted'));

COMMENT ON COLUMN public.profiles.stripe_account_status IS
    'Derived from Stripe account.charges_enabled / payouts_enabled / details_submitted. Lifecycle: not_connected -> pending -> active or restricted. Captain payments dashboard gates UI on this.';
COMMENT ON COLUMN public.profiles.stripe_charges_enabled IS
    'Mirror of Stripe account.charges_enabled. True when the connected account can accept charges.';
COMMENT ON COLUMN public.profiles.stripe_payouts_enabled IS
    'Mirror of Stripe account.payouts_enabled. True when the connected account can receive payouts.';
COMMENT ON COLUMN public.profiles.stripe_details_submitted IS
    'Mirror of Stripe account.details_submitted. True when the captain has completed Express onboarding requirements.';
COMMENT ON COLUMN public.profiles.stripe_connected_at IS
    'Timestamp of the first successful Express account return (charges_enabled and payouts_enabled both true). Null until that point; preserved across disconnect so reconnect history is retained.';
