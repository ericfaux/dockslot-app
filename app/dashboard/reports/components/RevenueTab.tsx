'use client';

import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { RevenueOverviewData } from '@/app/actions/analytics';

interface Props {
  data: RevenueOverviewData;
}

function formatCurrency(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RevenueTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
        <p className="text-sm font-medium text-slate-900 mb-1">{label}</p>
        <p className="text-sm text-cyan-600">${payload[0].value?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
}

export function RevenueTab({ data }: Props) {
  const hasData = data.allTimeRevenue > 0 || data.revenueByTripType.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <DollarSign className="mx-auto h-12 w-12 text-slate-600" />
        <h3 className="mt-4 text-lg font-medium text-slate-900">No revenue data yet</h3>
        <p className="mt-2 text-sm text-slate-400">
          Revenue metrics will appear once you start receiving payments for bookings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Summary Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400 mb-1">This Month</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900">
              ${data.thisMonthRevenue.toLocaleString()}
            </p>
            {data.thisMonthChange !== 0 && (
              <span className={`flex items-center text-xs font-medium ${
                data.thisMonthChange > 0 ? 'text-green-400' : 'text-rose-600'
              }`}>
                {data.thisMonthChange > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                {data.thisMonthChange > 0 ? '+' : ''}{data.thisMonthChange.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400 mb-1">This Season</p>
          <p className="text-2xl font-bold text-slate-900">
            ${data.thisSeasonRevenue.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400 mb-1">All Time</p>
          <p className="text-2xl font-bold text-slate-900">
            ${data.allTimeRevenue.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400 mb-1">Avg Booking</p>
          <p className="text-2xl font-bold text-slate-900">
            ${data.averageBookingValue.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Outstanding Balance Alert */}
      {data.outstandingBalance > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-600">Outstanding Balances</p>
              <p className="text-xs text-amber-600/70">Unpaid balances across active bookings</p>
            </div>
          </div>
          <span className="text-xl font-bold text-amber-600">
            ${data.outstandingBalance.toLocaleString()}
          </span>
        </div>
      )}

      {/* Revenue by Month Chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Revenue by Month</h3>
        <div className="h-64 sm:h-72 -mx-2 sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.revenueByMonth}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<RevenueTooltip />} />
              <defs>
                <linearGradient id="revenueLineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: '#06b6d4', r: 4 }}
                activeDot={{ r: 6, fill: '#22d3ee' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue by Trip Type */}
      {data.revenueByTripType.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Revenue by Trip Type</h3>
          {data.revenueByTripType.length <= 6 ? (
            <div className="h-48 -mx-2 sm:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.revenueByTripType}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    tickFormatter={formatCurrency}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Bar dataKey="revenue" fill="#06b6d4" radius={[0, 4, 4, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="space-y-3">
              {data.revenueByTripType.map((t) => {
                const maxRevenue = data.revenueByTripType[0]?.revenue || 1;
                const pct = (t.revenue / maxRevenue) * 100;
                return (
                  <div key={t.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 truncate max-w-[50%]">{t.name}</span>
                      <span className="text-slate-400">
                        ${t.revenue.toLocaleString()} ({t.count} trips)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
