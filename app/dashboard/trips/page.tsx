// app/dashboard/trips/page.tsx
// Trips Management Page - Trip Type Configuration
// Design: Maritime Chart Plotter Aesthetic with Dark Theme

export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { getTripTypes } from '@/app/actions/trips';
import { TripsClient } from './TripsClient';

export default async function TripsPage() {
  const { user, supabase } = await requireAuth()

  // Fetch trip types
  const result = await getTripTypes();
  const tripTypes = result.success ? result.data ?? [] : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section aria-label="Page Header">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Trip Types
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Configure the types of trips you offer. Each trip type defines the duration, pricing, and deposit requirements.
        </p>
      </section>

      {/* Trips Client Component */}
      <TripsClient initialTripTypes={tripTypes} />

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
