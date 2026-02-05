import { requireAuth } from '@/lib/auth/server';
import {
  getRevenueOverview,
  getBookingInsights,
  getGuestAnalytics,
  getSeasonPerformance,
} from '@/app/actions/analytics';
import { ReportsPageClient } from './components/ReportsPageClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reports | DockSlot',
  description: 'Revenue, booking insights, guest analytics, and season performance',
};

export default async function ReportsPage() {
  const { user, supabase } = await requireAuth();

  // Fetch all analytics data in parallel
  const [revenueData, bookingData, guestData, seasonData] = await Promise.all([
    getRevenueOverview(),
    getBookingInsights(),
    getGuestAnalytics(),
    getSeasonPerformance(),
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

  return (
    <ReportsPageClient
      revenueData={revenueData}
      bookingData={bookingData}
      guestData={guestData}
      seasonData={seasonData}
      captainId={user.id}
      pendingReportCount={pendingReportCount}
    />
  );
}
