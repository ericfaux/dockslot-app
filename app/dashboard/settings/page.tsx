// app/dashboard/settings/page.tsx
// Settings Page - Captain Profile & Configuration
// Design: Maritime Chart Plotter Aesthetic with Dark Theme

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getProfile } from '@/app/actions/profile';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile
  const result = await getProfile();
  const profile = result.success ? result.data : null;

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

      {/* Settings Client Component */}
      <SettingsClient initialProfile={profile} userEmail={user.email || ''} />

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
