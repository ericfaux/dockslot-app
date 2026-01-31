import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/server';
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from 'date-fns';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { TrendingUp, DollarSign, Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import { ExportBookingsButton } from '../schedule/components/ExportBookingsButton';

export default async function AnalyticsPage() {
  const { user, supabase } = await requireAuth()

  // Get captain profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Date ranges
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // Fetch all bookings for analytics
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('captain_id', profile.id)
    .order('scheduled_start', { ascending: false });

  const allBookings = bookings || [];

  // This month bookings
  const thisMonthBookings = allBookings.filter((b) => {
    const date = new Date(b.scheduled_start);
    return date >= thisMonthStart && date <= thisMonthEnd;
  });

  // Last month bookings
  const lastMonthBookings = allBookings.filter((b) => {
    const date = new Date(b.scheduled_start);
    return date >= lastMonthStart && date <= lastMonthEnd;
  });

  // Revenue calculations
  const thisMonthRevenue = thisMonthBookings.reduce(
    (sum, b) => sum + (b.deposit_paid_cents || 0),
    0
  );
  const lastMonthRevenue = lastMonthBookings.reduce(
    (sum, b) => sum + (b.deposit_paid_cents || 0),
    0
  );
  const revenueChange =
    lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

  // Total revenue (all time)
  const totalRevenue = allBookings.reduce(
    (sum, b) => sum + (b.deposit_paid_cents || 0),
    0
  );

  // Booking stats
  const confirmedBookings = allBookings.filter((b) => b.status === 'confirmed').length;
  const pendingBookings = allBookings.filter((b) =>
    ['pending_deposit', 'pending_approval'].includes(b.status)
  ).length;
  const cancelledBookings = allBookings.filter((b) => b.status === 'cancelled').length;

  // Conversion rate (confirmed / total)
  const conversionRate =
    allBookings.length > 0 ? (confirmedBookings / allBookings.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-sm text-slate-400">
            Revenue insights and booking performance
          </p>
        </div>
        <ExportBookingsButton captainId={profile.id} />
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                ${(totalRevenue / 100).toLocaleString()}
              </p>
              <p className="text-sm text-slate-400">Total Revenue</p>
            </div>
          </div>
        </div>

        {/* This Month Revenue */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-white">
                  ${(thisMonthRevenue / 100).toLocaleString()}
                </p>
                {revenueChange !== 0 && (
                  <span
                    className={`text-xs font-medium ${
                      revenueChange > 0 ? 'text-green-400' : 'text-rose-400'
                    }`}
                  >
                    {revenueChange > 0 ? '+' : ''}
                    {revenueChange.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">This Month</p>
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{allBookings.length}</p>
              <p className="text-sm text-slate-400">Total Bookings</p>
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
              <CheckCircle className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{conversionRate.toFixed(0)}%</p>
              <p className="text-sm text-slate-400">Conversion Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Status Breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Confirmed</p>
              <p className="text-2xl font-bold text-green-400">{confirmedBookings}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400/30" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-amber-400">{pendingBookings}</p>
            </div>
            <Calendar className="h-8 w-8 text-amber-400/30" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Cancelled</p>
              <p className="text-2xl font-bold text-rose-400">{cancelledBookings}</p>
            </div>
            <XCircle className="h-8 w-8 text-rose-400/30" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <AnalyticsCharts bookings={allBookings} />
    </div>
  );
}
