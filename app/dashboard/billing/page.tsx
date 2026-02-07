export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { BillingClient } from './BillingClient';

export default async function BillingPage() {
  const { user, supabase } = await requireAuth();

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'subscription_tier, subscription_status, subscription_current_period_end, stripe_customer_id, stripe_subscription_id, business_name, full_name, email'
    )
    .eq('id', user.id)
    .single();

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
        subscriptionTier={profile?.subscription_tier ?? 'starter'}
        subscriptionStatus={profile?.subscription_status ?? 'active'}
        periodEnd={profile?.subscription_current_period_end ?? null}
        hasStripeCustomer={!!profile?.stripe_customer_id}
      />
    </div>
  );
}
