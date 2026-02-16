// app/dashboard/manifest/page.tsx
// Manifest Page - View upcoming bookings with passenger details
// Design: Maritime Chart Plotter Aesthetic with Dark Theme

export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { getUpcomingBookingsWithPassengers } from '@/app/actions/manifest';
import { ManifestClient } from './ManifestClient';
import { LockedFeatureOverlay } from '@/components/LockedFeatureOverlay';
import type { SubscriptionTier } from '@/lib/db/types';

export default async function ManifestPage() {
  const { user, supabase } = await requireAuth()

  // Fetch subscription tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const subscriptionTier = (profile?.subscription_tier ?? 'deckhand') as SubscriptionTier;
  const isDeckhand = subscriptionTier === 'deckhand';

  // Fetch upcoming bookings with passengers
  const result = await getUpcomingBookingsWithPassengers();
  const bookings = result.success ? result.data ?? [] : [];

  const content = (
    <div className="space-y-6">
      {/* Page Header */}
      <section aria-label="Page Header">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Manifest
          </span>
          <div className="h-px flex-1 bg-white" />
        </div>
        <p className="mt-2 text-sm text-slate-400">
          View upcoming bookings and their passenger details. See who&apos;s coming on each trip.
        </p>
      </section>

      {/* Manifest Client Component */}
      <ManifestClient initialBookings={bookings} />

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

  if (isDeckhand) {
    return (
      <LockedFeatureOverlay feature="passenger_manifest" pattern="section">
        {content}
      </LockedFeatureOverlay>
    );
  }

  return content;
}
