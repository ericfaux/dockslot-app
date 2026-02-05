// app/dashboard/settings/page.tsx
// Settings Page - Captain Profile & Configuration
// Design: Maritime Chart Plotter Aesthetic with Dark Theme

export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { getProfile } from '@/app/actions/profile';
import { getAvailabilityWindows, ensureAvailabilityExists } from '@/app/actions/availability';
import { SettingsClient } from './SettingsClient';
import { SettingsSubNav } from './components/SettingsSubNav';

export default async function SettingsPage() {
  const { user, supabase } = await requireAuth()

  // Ensure user has availability windows (creates defaults if missing)
  // This is a fallback for users who signed up before the database trigger was added
  await ensureAvailabilityExists(user.id);

  // Fetch profile and availability windows in parallel
  const [profileResult, availabilityResult] = await Promise.all([
    getProfile(),
    getAvailabilityWindows(),
  ]);

  const profile = profileResult.success && profileResult.data ? profileResult.data : null;
  const availabilityWindows = availabilityResult.success && availabilityResult.data
    ? availabilityResult.data
    : [];

  // Get calendar token (generate if missing)
  let calendarToken = profile?.calendar_token;
  if (!calendarToken) {
    // Generate token if missing
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
          <div className="h-px flex-1 bg-slate-800" />
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Manage your captain profile, business details, and booking preferences.
        </p>
      </section>

      {/* Quick Access to Configuration Sub-pages */}
      <SettingsSubNav />

      {/* Settings Client Component */}
      <SettingsClient
        initialProfile={profile}
        initialAvailabilityWindows={availabilityWindows}
        userEmail={user.email || ''}
        calendarToken={calendarToken || ''}
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
