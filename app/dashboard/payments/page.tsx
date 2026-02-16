export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { PaymentsDashboardClient } from './PaymentsDashboardClient';

export default async function PaymentsPage() {
  const { user, supabase } = await requireAuth();

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete, business_name, email')
    .eq('id', user.id)
    .single();

  return (
    <div className="space-y-6">
      {/* Page Header */}
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
        stripeOnboardingComplete={profile?.stripe_onboarding_complete ?? false}
        businessName={profile?.business_name ?? ''}
        email={profile?.email ?? user.email ?? ''}
      />
    </div>
  );
}
