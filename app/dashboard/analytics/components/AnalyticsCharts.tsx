'use client';

import { useMemo, useState } from 'react';
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface Booking {
  id: string;
  scheduled_start: string;
  total_price_cents: number;
  deposit_paid_cents: number;
  status: string;
  trip_type_id: string;
}

interface Props {
  bookings: Booking[];
}

export function AnalyticsCharts({ bookings }: Props) {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Revenue by month (last 6 months)
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthBookings = bookings.filter((b) => {
        const bookingDate = parseISO(b.scheduled_start);
        return (
          bookingDate.getFullYear() === monthStart.getFullYear() &&
          bookingDate.getMonth() === monthStart.getMonth()
        );
      });

      const revenue = monthBookings.reduce((sum, b) => sum + (b.deposit_paid_cents || 0), 0);

      return {
        month: format(month, 'MMM'),
        revenue: revenue / 100,
        count: monthBookings.length,
      };
    });
  }, [bookings]);

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);

  // Booking status distribution
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return counts;
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* Revenue Chart */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 sm:p-6 overflow-hidden">
        <h3 className="mb-4 sm:mb-6 text-base sm:text-lg font-semibold text-white">Revenue Trend (Last 6 Months)</h3>
        <div className="space-y-2 sm:space-y-3">
          {monthlyRevenue.map((data, index) => (
            <div 
              key={index} 
              className="flex items-center gap-4 group"
              onMouseEnter={() => setHoveredMonth(data.month)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              <div className="w-12 text-sm text-slate-400 group-hover:text-cyan-400 transition-colors">
                {data.month}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="relative h-8 flex-1 overflow-hidden rounded-full bg-slate-700 group-hover:bg-slate-600 transition-colors">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 group-hover:from-cyan-400 group-hover:to-blue-400"
                      style={{
                        width: `${(data.revenue / maxRevenue) * 100}%`,
                      }}
                    />
                    {hoveredMonth === data.month && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white drop-shadow-lg">
                          ${data.revenue.toLocaleString()} ({data.count} trips)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-24 text-right">
                    <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                      ${data.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                      {data.count} trips
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Distribution */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h3 className="mb-6 text-lg font-semibold text-white">Booking Status Distribution</h3>
        <div className="space-y-4">
          {Object.entries(statusCounts).map(([status, count]) => {
            const percentage = (count / bookings.length) * 100;
            const color = getStatusColor(status);

            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm capitalize text-slate-300">
                    {status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-medium text-white">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h4 className="mb-4 text-sm font-medium text-slate-400">Average Booking Value</h4>
          <p className="text-3xl font-bold text-white">
            $
            {bookings.length > 0
              ? (
                  bookings.reduce((sum, b) => sum + b.total_price_cents, 0) /
                  bookings.length /
                  100
                ).toFixed(0)
              : 0}
          </p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h4 className="mb-4 text-sm font-medium text-slate-400">
            Total Projected Revenue
          </h4>
          <p className="text-3xl font-bold text-white">
            ${(bookings.reduce((sum, b) => sum + b.total_price_cents, 0) / 100).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Includes confirmed + pending bookings
          </p>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-green-500';
    case 'pending_deposit':
    case 'pending_approval':
      return 'bg-amber-500';
    case 'cancelled':
      return 'bg-rose-500';
    case 'completed':
      return 'bg-blue-500';
    case 'weather_hold':
      return 'bg-orange-500';
    case 'no_show':
      return 'bg-red-500';
    default:
      return 'bg-slate-500';
  }
}
