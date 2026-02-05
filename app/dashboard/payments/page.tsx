// app/dashboard/payments/page.tsx
// Stripe Connect Onboarding & Payment Settings
// Design: Maritime Chart Plotter Aesthetic with Dark Theme

export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { PaymentsClient } from './PaymentsClient';

export default async function PaymentsPage() {
  const { user, supabase } = await requireAuth()

  // Fetch profile with Stripe account info
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('[Payments] Profile query failed for user:', user.id, profileError);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section aria-label="Page Header">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Payment Settings
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Connect your Stripe account to accept deposits and payments from guests.
        </p>
      </section>

      {/* Payments Client Component */}
      <PaymentsClient
        stripeAccountId={profile?.stripe_account_id ?? null}
        stripeOnboardingComplete={profile?.stripe_onboarding_complete ?? false}
        businessName={profile?.business_name || profile?.full_name || ''}
        email={user.email || ''}
      />

      {/* Bottom Accent Bar */}
      <div
        className="mx-auto h-1 w-32 rounded-full"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)',
        }}
      />
    </div>
  );
}
