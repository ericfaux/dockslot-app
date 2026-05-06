export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { PaymentsDashboardClient } from './PaymentsDashboardClient';
import type { StripeAccountStatus } from '@/lib/stripe/types';

const VALID_STATUSES: StripeAccountStatus[] = [
  'not_connected',
  'pending',
  'active',
  'restricted',
];

function coerceStatus(value: unknown): StripeAccountStatus {
  if (typeof value === 'string' && (VALID_STATUSES as string[]).includes(value)) {
    return value as StripeAccountStatus;
  }
  return 'not_connected';
}

export default async function PaymentsPage() {
  const { user, supabase } = await requireAuth();

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'stripe_account_id, stripe_account_status, stripe_charges_enabled, stripe_payouts_enabled, stripe_connected_at, business_name, email'
    )
    .eq('id', user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-800">
          Payments & Payouts
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your Stripe account, view payments, and track payouts.
        </p>
      </div>

      <PaymentsDashboardClient
        stripeAccountId={profile?.stripe_account_id ?? null}
        stripeAccountStatus={coerceStatus(profile?.stripe_account_status)}
        stripeChargesEnabled={profile?.stripe_charges_enabled ?? false}
        stripePayoutsEnabled={profile?.stripe_payouts_enabled ?? false}
        stripeConnectedAt={profile?.stripe_connected_at ?? null}
        businessName={profile?.business_name ?? ''}
        email={profile?.email ?? user.email ?? ''}
      />
    </div>
  );
}
