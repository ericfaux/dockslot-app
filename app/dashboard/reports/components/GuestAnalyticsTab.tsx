'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, Star } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
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
import { Pagination } from '@/components/ui/Pagination';

const PAGE_SIZE = 25;

interface Props {
  data: GuestAnalyticsData;
  filteredGuests?: GuestAnalyticsData['topGuestsByTrips'];
  captainId: string;
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

export function GuestAnalyticsTab({ data, filteredGuests, captainId }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [linkCopied, setLinkCopied] = useState(false);

  const guests = filteredGuests ?? data.topGuestsByTrips;

  // Reset page when filtered data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredGuests]);

  const handleCopyBookingLink = useCallback(async () => {
    const url = `${window.location.origin}/book/${captainId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [captainId]);

  if (data.totalUniqueGuests === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No guest data yet"
        description="Book your first trip or share your booking link to start building guest insights."
        actions={[
          { label: 'Create Your First Booking', href: '/dashboard/bookings/new' },
          { label: linkCopied ? 'Copied!' : 'Share Booking Link', onClick: handleCopyBookingLink, variant: 'secondary' },
        ]}
      />
    );
  }

  const totalPages = Math.max(1, Math.ceil(guests.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, guests.length);
  const paginatedGuests = guests.slice(startIndex, endIndex);

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
      {guests.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Top Guests</h3>
            <p className="text-sm text-slate-400">
              Showing {startIndex + 1}–{endIndex} of {guests.length}
            </p>
          </div>
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
                {paginatedGuests.map((guest, idx) => (
                  <tr key={guest.email} className="border-b border-slate-200">
                    <td className="py-2.5 text-slate-500 font-mono text-xs">{startIndex + idx + 1}</td>
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
          {guests.length > PAGE_SIZE && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
