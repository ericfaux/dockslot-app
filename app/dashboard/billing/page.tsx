export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { BillingClient } from './BillingClient';
import { getStripe, getTierFromPriceId } from '@/lib/stripe/config';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import type { SubscriptionTier, SubscriptionStatus } from '@/lib/db/types';

export default async function BillingPage() {
  const { user, supabase } = await requireAuth();

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'subscription_tier, subscription_status, subscription_current_period_end, stripe_customer_id, stripe_subscription_id, business_name, full_name, email'
    )
    .eq('id', user.id)
    .single();

  // Safety net: if user has a Stripe subscription but tier is still deckhand,
  // verify against Stripe and fix the profile (handles missed webhooks)
  let syncedTier = (profile?.subscription_tier ?? 'deckhand') as SubscriptionTier;
  let syncedStatus = (profile?.subscription_status ?? 'active') as SubscriptionStatus;
  let syncedPeriodEnd = profile?.subscription_current_period_end ?? null;

  if (
    profile?.stripe_subscription_id &&
    (!profile.subscription_tier || profile.subscription_tier === 'deckhand')
  ) {
    try {
      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      const isActive = ['active', 'trialing'].includes(sub.status);

      if (isActive) {
        // Derive tier from price ID or subscription metadata
        const priceId = sub.items?.data?.[0]?.price?.id;
        let tier = priceId ? getTierFromPriceId(priceId) : 'deckhand';
        if (tier === 'deckhand') {
          const metadataTier = sub.metadata?.tier;
          if (metadataTier === 'captain' || metadataTier === 'fleet') {
            tier = metadataTier;
          }
        }

        if (tier !== 'deckhand') {
          const periodEnd = sub.items?.data?.[0]?.current_period_end;
          const serviceClient = createSupabaseServiceClient();
          await serviceClient
            .from('profiles')
            .update({
              subscription_tier: tier,
              subscription_status: sub.status === 'active' ? 'active' : 'trialing',
              ...(periodEnd && {
                subscription_current_period_end: new Date(periodEnd * 1000).toISOString(),
              }),
            })
            .eq('id', user.id);

          syncedTier = tier as SubscriptionTier;
          syncedStatus = (sub.status === 'active' ? 'active' : 'trialing') as SubscriptionStatus;
          if (periodEnd) {
            syncedPeriodEnd = new Date(periodEnd * 1000).toISOString();
          }
        }
      }
    } catch (err) {
      console.error('Billing page subscription sync failed:', err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section aria-label="Page Header">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Billing
          </span>
          <div className="h-px flex-1 bg-white" />
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Manage your DockSlot subscription and billing.
        </p>
      </section>

      <BillingClient
        subscriptionTier={syncedTier}
        subscriptionStatus={syncedStatus}
        periodEnd={syncedPeriodEnd}
        hasStripeCustomer={!!profile?.stripe_customer_id}
      />
    </div>
  );
}
