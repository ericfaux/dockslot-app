import { requireAuth } from '@/lib/auth/server';
import {
  getRevenueOverview,
  getBookingInsights,
  getGuestAnalytics,
  getSeasonPerformance,
  getPromoCodeAnalytics,
} from '@/app/actions/analytics';
import { ReportsPageClient } from './components/ReportsPageClient';
import { LockedFeatureOverlay } from '@/components/LockedFeatureOverlay';
import type { SubscriptionTier } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reports | DockSlot',
  description: 'Revenue, booking insights, guest analytics, and season performance',
};

export default async function ReportsPage() {
  const { user, supabase } = await requireAuth();

  // Fetch subscription tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const subscriptionTier = (profile?.subscription_tier ?? 'deckhand') as SubscriptionTier;
  const isDeckhand = subscriptionTier === 'deckhand';

  // Fetch all analytics data in parallel
  const [revenueData, bookingData, guestData, seasonData, promoData] = await Promise.all([
    getRevenueOverview(),
    getBookingInsights(),
    getGuestAnalytics(),
    getSeasonPerformance(),
    getPromoCodeAnalytics(),
  ]);

  // Count completed bookings without trip reports (for "Trips Needing Reports" badge)
  let pendingReportCount = 0;
  try {
    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('captain_id', user.id)
      .eq('status', 'completed');
    pendingReportCount = count || 0;
  } catch {
    // Ignore - badge is non-critical
  }

  const content = (
    <ReportsPageClient
      revenueData={revenueData}
      bookingData={bookingData}
      guestData={guestData}
      seasonData={seasonData}
      promoData={promoData}
      captainId={user.id}
      pendingReportCount={pendingReportCount}
    />
  );

  if (isDeckhand) {
    return (
      <LockedFeatureOverlay feature="reports" pattern="section">
        {content}
      </LockedFeatureOverlay>
    );
  }

  return content;
}
