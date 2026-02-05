import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/server';
import { BarChart3 } from 'lucide-react';
import { EnhancedExport } from './components/EnhancedExport';
import { QuickStatsCards } from './components/QuickStatsCards';
import { WeatherMetricsCard } from './components/WeatherMetricsCard';
import { CustomerInsightsCard } from './components/CustomerInsightsCard';
import { SeasonalCharts } from './components/SeasonalCharts';
import { PaymentAnalyticsCard } from './components/PaymentAnalyticsCard';
import { ActionableInsights } from './components/ActionableInsights';
import {
  calculateWeatherMetrics,
  calculateCustomerMetrics,
  calculateSeasonalMetrics,
  calculatePaymentMetrics,
  calculateQuickStats,
  generateInsights,
  type AnalyticsBooking,
} from './lib/analytics-utils';

export default async function AnalyticsPage() {
  const { user, supabase } = await requireAuth();

  // Get captain profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Fetch all bookings with related data for analytics
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      scheduled_start,
      scheduled_end,
      status,
      payment_status,
      total_price_cents,
      deposit_paid_cents,
      balance_due_cents,
      party_size,
      guest_name,
      guest_email,
      weather_hold_reason,
      original_date_if_rescheduled,
      created_at,
      trip_type:trip_types(id, title),
      vessel:vessels(id, name)
    `)
    .eq('captain_id', profile.id)
    .order('scheduled_start', { ascending: false });

  // Transform to AnalyticsBooking type
  const analyticsBookings: AnalyticsBooking[] = (bookings || []).map((b) => ({
    id: b.id,
    scheduled_start: b.scheduled_start,
    scheduled_end: b.scheduled_end,
    status: b.status,
    payment_status: b.payment_status,
    total_price_cents: b.total_price_cents,
    deposit_paid_cents: b.deposit_paid_cents,
    balance_due_cents: b.balance_due_cents,
    party_size: b.party_size,
    guest_name: b.guest_name,
    guest_email: b.guest_email,
    weather_hold_reason: b.weather_hold_reason,
    original_date_if_rescheduled: b.original_date_if_rescheduled,
    created_at: b.created_at,
    trip_type: Array.isArray(b.trip_type) ? b.trip_type[0] : b.trip_type,
    vessel: Array.isArray(b.vessel) ? b.vessel[0] : b.vessel,
  }));

  // Calculate all metrics
  const quickStats = calculateQuickStats(analyticsBookings);
  const weatherMetrics = calculateWeatherMetrics(analyticsBookings);
  const customerMetrics = calculateCustomerMetrics(analyticsBookings);
  const seasonalMetrics = calculateSeasonalMetrics(analyticsBookings);
  const paymentMetrics = calculatePaymentMetrics(analyticsBookings);
  const insights = generateInsights(
    analyticsBookings,
    weatherMetrics,
    customerMetrics,
    seasonalMetrics
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-sm text-slate-400">
            Business insights and performance metrics
          </p>
        </div>
        <EnhancedExport captainId={profile.id} />
      </div>

      {/* Quick Stats Row */}
      <QuickStatsCards stats={quickStats} />

      {/* Actionable Insights */}
      {insights.length > 0 && <ActionableInsights insights={insights} />}

      {/* Main Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Seasonal Charts - Full width on mobile, left side on desktop */}
        <div className="lg:col-span-2">
          <SeasonalCharts metrics={seasonalMetrics} />
        </div>

        {/* Weather Impact */}
        <WeatherMetricsCard metrics={weatherMetrics} />

        {/* Customer Insights */}
        <CustomerInsightsCard metrics={customerMetrics} />

        {/* Payment Analytics */}
        <div className="lg:col-span-2">
          <PaymentAnalyticsCard metrics={paymentMetrics} />
        </div>
      </div>

      {/* Empty state for new captains */}
      {analyticsBookings.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No analytics data yet
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Once you start accepting bookings, you&apos;ll see detailed insights
            about your business performance, weather impacts, customer behavior,
            and more.
          </p>
        </div>
      )}
    </div>
  );
}
