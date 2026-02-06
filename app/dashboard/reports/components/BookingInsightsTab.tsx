'use client';

import { CalendarDays, Clock, Users } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { BookingInsightsData } from '@/app/actions/analytics';

interface Props {
  data: BookingInsightsData;
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-500',
  confirmed: 'bg-blue-500',
  pending_deposit: 'bg-amber-500',
  weather_hold: 'bg-purple-500',
  rescheduled: 'bg-cyan-500',
  cancelled: 'bg-rose-500',
  no_show: 'bg-slate-500',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DayTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
        <p className="text-sm font-medium text-slate-900 mb-1">{label}</p>
        <p className="text-sm text-blue-600">{payload[0].value} bookings</p>
      </div>
    );
  }
  return null;
}

export function BookingInsightsTab({ data }: Props) {
  if (data.totalBookings === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <CalendarDays className="mx-auto h-12 w-12 text-slate-600" />
        <h3 className="mt-4 text-lg font-medium text-slate-900">No booking data yet</h3>
        <p className="mt-2 text-sm text-slate-400">
          Booking insights will appear once you have bookings in the system.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Metrics */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400 mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-slate-900">{data.totalBookings}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400 mb-1">Avg Party Size</p>
          <p className="text-2xl font-bold text-slate-900">{data.averagePartySize.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400 mb-1">Cancellation Rate</p>
          <p className={`text-2xl font-bold ${
            data.cancellationRate > 20 ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {data.cancellationRate.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-1 mb-1">
            <Clock className="h-3 w-3 text-slate-400" />
            <p className="text-xs text-slate-400">Avg Lead Time</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {data.averageLeadTimeDays.toFixed(0)}
            <span className="text-sm font-normal text-slate-400 ml-1">days</span>
          </p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Bookings by Status</h3>
        <div className="space-y-3">
          {data.statusBreakdown.map((s) => {
            const pct = data.totalBookings > 0 ? (s.count / data.totalBookings) * 100 : 0;
            return (
              <div key={s.status} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${statusColors[s.status] || 'bg-slate-500'}`} />
                    <span className="text-slate-600">{s.label}</span>
                  </div>
                  <span className="text-slate-400">
                    {s.count} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full ${statusColors[s.status] || 'bg-slate-500'} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bookings by Day of Week */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Busiest Days</h3>
          <div className="h-48 -mx-2 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.byDayOfWeek}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<DayTooltip />} />
                <defs>
                  <linearGradient id="dayGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <Bar dataKey="count" fill="url(#dayGradient)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings by Trip Type */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Most Popular Trips</h3>
          {data.byTripType.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No trip type data</p>
          ) : (
            <div className="space-y-3">
              {data.byTripType.slice(0, 6).map((t, idx) => (
                <div key={t.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 w-4">#{idx + 1}</span>
                      <span className="text-slate-600 truncate max-w-[60%]">{t.name}</span>
                    </div>
                    <span className="text-slate-400">
                      {t.count} ({t.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden ml-6">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                      style={{ width: `${t.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weather Hold Rate */}
      {data.weatherHoldRate > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className="text-sm text-slate-600">Weather Hold Rate</span>
            </div>
            <span className="text-sm font-medium text-purple-600">
              {data.weatherHoldRate.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
