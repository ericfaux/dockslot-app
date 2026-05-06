import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getStripe } from '@/lib/stripe/config';
import type {
  ProfileStripeFields,
  StripeAccountStatus,
} from '@/lib/stripe/types';

interface CreateConnectedAccountInput {
  ownerEmail: string;
  ownerCountry?: string;
  captainId: string;
  businessName?: string | null;
}

export async function createConnectedAccount({
  ownerEmail,
  ownerCountry = 'US',
  captainId,
  businessName,
}: CreateConnectedAccountInput): Promise<Stripe.Account> {
  const stripe = getStripe();
  return stripe.accounts.create(
    {
      type: 'express',
      country: ownerCountry,
      email: ownerEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        name: businessName ?? undefined,
        product_description: 'Charter fishing and boating services',
        support_email: ownerEmail,
      },
      metadata: {
        captain_id: captainId,
      },
    },
    {
      // Idempotency keyed on the captain id: a retried onboard call for
      // the same captain reuses the original Stripe response instead of
      // minting a parallel acct_*.
      idempotencyKey: `dockslot:connect:account:${captainId}`,
    }
  );
}

interface CreateAccountLinkInput {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
  type?: 'account_onboarding' | 'account_update';
  collect?: 'currently_due' | 'eventually_due';
}

export async function createAccountLink({
  accountId,
  refreshUrl,
  returnUrl,
  type = 'account_onboarding',
  collect = 'eventually_due',
}: CreateAccountLinkInput): Promise<Stripe.AccountLink> {
  const stripe = getStripe();
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type,
    collect,
  });
}

export async function retrieveAccount(
  accountId: string
): Promise<Stripe.Account> {
  const stripe = getStripe();
  return stripe.accounts.retrieve(accountId);
}

export async function createLoginLink(
  accountId: string
): Promise<Stripe.LoginLink> {
  const stripe = getStripe();
  return stripe.accounts.createLoginLink(accountId);
}

export function deriveStripeFields(
  account: Stripe.Account
): Omit<ProfileStripeFields, 'stripe_account_id' | 'stripe_connected_at'> & {
  stripe_account_id: string;
} {
  const charges = account.charges_enabled ?? false;
  const payouts = account.payouts_enabled ?? false;
  const submitted = account.details_submitted ?? false;

  let status: StripeAccountStatus;
  if (!submitted) {
    status = 'pending';
  } else if (charges && payouts) {
    status = 'active';
  } else {
    status = 'restricted';
  }

  return {
    stripe_account_id: account.id,
    stripe_account_status: status,
    stripe_charges_enabled: charges,
    stripe_payouts_enabled: payouts,
    stripe_details_submitted: submitted,
  };
}

export async function syncAccountToProfile(
  supabase: SupabaseClient,
  account: Stripe.Account
): Promise<string | null> {
  const derived = deriveStripeFields(account);

  // The legacy stripe_onboarding_complete boolean is still read by the
  // dashboard home and settings pages. Keep it coherent with the new
  // status until those callers migrate.
  const update: Record<string, unknown> = {
    stripe_account_status: derived.stripe_account_status,
    stripe_charges_enabled: derived.stripe_charges_enabled,
    stripe_payouts_enabled: derived.stripe_payouts_enabled,
    stripe_details_submitted: derived.stripe_details_submitted,
    stripe_onboarding_complete: derived.stripe_account_status === 'active',
  };

  // Stamp stripe_connected_at on the FIRST transition into active so a
  // reconnect after disconnect preserves the original connection time.
  // Read first, write conditionally.
  if (derived.stripe_account_status === 'active') {
    const { data: existing } = await supabase
      .from('profiles')
      .select('stripe_connected_at')
      .eq('stripe_account_id', account.id)
      .maybeSingle();

    const alreadyStamped =
      (existing as { stripe_connected_at: string | null } | null)
        ?.stripe_connected_at != null;
    if (!alreadyStamped) {
      update.stripe_connected_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('stripe_account_id', account.id)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to sync Stripe account ${account.id}: ${error.message}`
    );
  }

  return (data as { id: string } | null)?.id ?? null;
}

export async function markAccountDisconnected(
  supabase: SupabaseClient,
  accountId: string
): Promise<void> {
  // Keep stripe_account_id and stripe_connected_at intact so a later
  // reconnect reuses the same Express account instead of orphaning it
  // at Stripe and minting a fresh acct_*. Status flip + capability
  // reset are sufficient to gate booking checkout from charging the
  // account in its disconnected state.
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_account_status: 'not_connected',
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
      stripe_details_submitted: false,
      stripe_onboarding_complete: false,
    })
    .eq('stripe_account_id', accountId);

  if (error) {
    throw new Error(
      `Failed to mark Stripe account ${accountId} as disconnected: ${error.message}`
    );
  }
}

export async function markAccountPending(
  supabase: SupabaseClient,
  accountId: string
): Promise<void> {
  // Reconnect retry: the captain has clicked Connect again on an Express
  // account that's already in {restricted, not_connected}. Flip status
  // back to pending immediately so the dashboard reflects the new
  // attempt; the return handler resyncs to active or restricted once
  // the captain finishes (or abandons) onboarding.
  const { error } = await supabase
    .from('profiles')
    .update({ stripe_account_status: 'pending' })
    .eq('stripe_account_id', accountId);

  if (error) {
    throw new Error(
      `Failed to mark Stripe account ${accountId} as pending: ${error.message}`
    );
  }
}

export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
