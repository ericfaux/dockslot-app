// app/dashboard/vessels/page.tsx
// Vessels Management Page - Fleet Configuration
// Design: Maritime Chart Plotter Aesthetic with Dark Theme

export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { getVessels } from '@/app/actions/vessels';
import { VesselsClient } from './VesselsClient';

export default async function VesselsPage() {
  const { user, supabase } = await requireAuth()

  // Fetch vessels
  const result = await getVessels();
  const vessels = result.success ? result.data ?? [] : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section aria-label="Page Header">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Vessels
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Manage your fleet. Add vessels with their passenger capacity to assign them to trips and bookings.
        </p>
      </section>

      {/* Vessels Client Component */}
      <VesselsClient initialVessels={vessels} />

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
