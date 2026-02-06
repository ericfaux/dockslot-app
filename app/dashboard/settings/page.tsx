// app/dashboard/settings/page.tsx
// Settings Page - Tabbed Captain Profile & Configuration
// Design: Maritime Chart Plotter Aesthetic with Dark Theme

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { getProfile } from '@/app/actions/profile';
import { getAvailabilityWindows, ensureAvailabilityExists } from '@/app/actions/availability';
import { getTripTypes } from '@/app/actions/trips';
import { getVessels } from '@/app/actions/vessels';
import { SettingsTabs } from './components/SettingsTabs';

export default async function SettingsPage() {
  const { user, supabase } = await requireAuth()

  // Ensure user has availability windows (creates defaults if missing)
  await ensureAvailabilityExists(user.id);

  // Fetch all data in parallel
  const [profileResult, availabilityResult, tripTypesResult, vesselsResult, waiversResult, stripeProfile] = await Promise.all([
    getProfile(),
    getAvailabilityWindows(),
    getTripTypes(),
    getVessels(),
    supabase
      .from('waiver_templates')
      .select('*')
      .eq('owner_id', user.id)
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', user.id)
      .single(),
  ]);

  const profile = profileResult.success && profileResult.data ? profileResult.data : null;
  const availabilityWindows = availabilityResult.success && availabilityResult.data
    ? availabilityResult.data
    : [];
  const tripTypes = tripTypesResult.success && tripTypesResult.data ? tripTypesResult.data : [];
  const vessels = vesselsResult.success && vesselsResult.data ? vesselsResult.data : [];
  const waiverTemplates = waiversResult.data || [];

  // Get calendar token (generate if missing)
  let calendarToken = profile?.calendar_token;
  if (!calendarToken) {
    const newToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    await supabase
      .from('profiles')
      .update({ calendar_token: newToken })
      .eq('id', user.id);

    calendarToken = newToken;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section aria-label="Page Header">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Settings
          </span>
          <div className="h-px flex-1 bg-white" />
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Manage your captain profile, business details, and booking preferences.
        </p>
      </section>

      {/* Tabbed Settings Interface */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-400" />
        </div>
      }>
        <SettingsTabs
          profile={profile}
          availabilityWindows={availabilityWindows}
          userEmail={user.email || ''}
          calendarToken={calendarToken || ''}
          tripTypes={tripTypes}
          vessels={vessels}
          waiverTemplates={waiverTemplates}
          stripeAccountId={stripeProfile.data?.stripe_account_id ?? null}
          stripeOnboardingComplete={stripeProfile.data?.stripe_onboarding_complete ?? false}
        />
      </Suspense>

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
