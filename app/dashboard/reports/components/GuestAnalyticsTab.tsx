'use client';

import { Users, UserCheck, Star } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { GuestAnalyticsData } from '@/app/actions/analytics';

interface Props {
  data: GuestAnalyticsData;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GuestTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
        <p className="text-sm font-medium text-slate-900 mb-1">{label}</p>
        {payload.map((p: { name: string; value: number; color: string }) => (
          <p key={p.name} className="text-sm" style={{ color: p.color }}>
            {p.name === 'newGuests' ? 'New' : 'Returning'}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function GuestAnalyticsTab({ data }: Props) {
  if (data.totalUniqueGuests === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <Users className="mx-auto h-12 w-12 text-slate-600" />
        <h3 className="mt-4 text-lg font-medium text-slate-900">No guest data yet</h3>
        <p className="mt-2 text-sm text-slate-400">
          Guest analytics will populate as you book trips.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-slate-400">Unique Guests</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.totalUniqueGuests}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="h-4 w-4 text-green-400" />
            <p className="text-xs text-slate-400">Repeat Guests</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.repeatGuestCount}</p>
          <p className="text-xs text-slate-500">{data.repeatGuestRate.toFixed(0)}% rate</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-amber-600" />
            <p className="text-xs text-slate-400">Repeat Rate</p>
          </div>
          <p className={`text-2xl font-bold ${
            data.repeatGuestRate >= 20 ? 'text-green-400' : 'text-slate-900'
          }`}>
            {data.repeatGuestRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* New vs Returning Chart */}
      {data.newVsReturning.some(m => m.newGuests > 0 || m.returningGuests > 0) && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">New vs Returning Guests</h3>
          <div className="h-56 -mx-2 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.newVsReturning}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                  allowDecimals={false}
                />
                <Tooltip content={<GuestTooltip />} />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-xs text-slate-400">
                      {value === 'newGuests' ? 'New' : 'Returning'}
                    </span>
                  )}
                />
                <Bar dataKey="newGuests" name="newGuests" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={24} stackId="a" />
                <Bar dataKey="returningGuests" name="returningGuests" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={24} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Guests Table */}
      {data.topGuestsByTrips.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Top Guests</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-2 text-left text-xs font-medium text-slate-400">#</th>
                  <th className="pb-2 text-left text-xs font-medium text-slate-400">Guest</th>
                  <th className="pb-2 text-right text-xs font-medium text-slate-400">Trips</th>
                  <th className="pb-2 text-right text-xs font-medium text-slate-400">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topGuestsByTrips.map((guest, idx) => (
                  <tr key={guest.email} className="border-b border-slate-200">
                    <td className="py-2.5 text-slate-500 font-mono text-xs">{idx + 1}</td>
                    <td className="py-2.5">
                      <p className="text-slate-900 font-medium truncate max-w-[200px]">{guest.name}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{guest.email}</p>
                    </td>
                    <td className="py-2.5 text-right text-slate-600">{guest.trips}</td>
                    <td className="py-2.5 text-right text-slate-600">
                      ${guest.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
