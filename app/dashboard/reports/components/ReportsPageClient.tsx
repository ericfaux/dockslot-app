'use client';

import { useState, useMemo } from 'react';
import { DollarSign, CalendarDays, Users, TrendingUp, FileText, Plus, Tag, BarChart3, Calendar } from 'lucide-react';
import { RevenueTab } from './RevenueTab';
import { BookingInsightsTab } from './BookingInsightsTab';
import { GuestAnalyticsTab } from './GuestAnalyticsTab';
import { SeasonPerformanceTab } from './SeasonPerformanceTab';
import { PromoCodesTab } from './PromoCodesTab';
import { EmptyState } from '@/components/EmptyState';
import type { RevenueOverviewData, BookingInsightsData, GuestAnalyticsData, SeasonPerformanceData, PromoCodeAnalyticsData } from '@/app/actions/analytics';
import Link from 'next/link';

type TabId = 'revenue' | 'bookings' | 'guests' | 'season' | 'promos';
type DateRange = 'this_month' | 'last_3_months' | 'this_year' | 'custom';

const tabs = [
  { id: 'revenue' as const, label: 'Revenue', shortLabel: 'Revenue', icon: DollarSign },
  { id: 'bookings' as const, label: 'Booking Insights', shortLabel: 'Bookings', icon: CalendarDays },
  { id: 'guests' as const, label: 'Guest Analytics', shortLabel: 'Guests', icon: Users },
  { id: 'season' as const, label: 'Season Performance', shortLabel: 'Season', icon: TrendingUp },
  { id: 'promos' as const, label: 'Promo Codes', shortLabel: 'Promos', icon: Tag },
];

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
];

function getDateRangeBounds(range: DateRange, customFrom: string, customTo: string): { from: Date; to: Date } | null {
  const now = new Date();

  switch (range) {
    case 'this_month':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    case 'last_3_months':
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    case 'this_year':
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      };
    case 'custom': {
      if (!customFrom || !customTo) return null;
      return {
        from: new Date(customFrom),
        to: new Date(customTo + 'T23:59:59'),
      };
    }
  }
}

interface Props {
  revenueData: RevenueOverviewData;
  bookingData: BookingInsightsData;
  guestData: GuestAnalyticsData;
  seasonData: SeasonPerformanceData;
  promoData: PromoCodeAnalyticsData;
  captainId: string;
  pendingReportCount: number;
}

export function ReportsPageClient({
  revenueData,
  bookingData,
  guestData,
  seasonData,
  promoData,
  captainId,
  pendingReportCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('revenue');
  const [dateRange, setDateRange] = useState<DateRange>('this_year');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const hasData = revenueData.allTimeRevenue > 0 || bookingData.totalBookings > 0;

  // Filter bookings by date range for the table
  const filteredBookings = useMemo(() => {
    const bounds = getDateRangeBounds(dateRange, customFrom, customTo);
    if (!bounds) return bookingData.bookings;

    return bookingData.bookings.filter((b) => {
      const date = new Date(b.scheduledStart);
      return date >= bounds.from && date <= bounds.to;
    });
  }, [bookingData.bookings, dateRange, customFrom, customTo]);

  // Filter guest list by date range (guests with bookings in range)
  const filteredGuestEmails = useMemo(() => {
    const bounds = getDateRangeBounds(dateRange, customFrom, customTo);
    if (!bounds) return null;

    const emails = new Set<string>();
    bookingData.bookings.forEach((b) => {
      const date = new Date(b.scheduledStart);
      if (date >= bounds.from && date <= bounds.to) {
        emails.add(b.guestEmail.toLowerCase());
      }
    });
    return emails;
  }, [bookingData.bookings, dateRange, customFrom, customTo]);

  const filteredGuests = useMemo(() => {
    if (!filteredGuestEmails) return undefined;
    return guestData.topGuestsByTrips.filter((g) =>
      filteredGuestEmails.has(g.email.toLowerCase()),
    );
  }, [guestData.topGuestsByTrips, filteredGuestEmails]);

  const showDateFilter = activeTab === 'bookings' || activeTab === 'guests';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="mt-1 text-sm text-slate-400">
            Revenue, booking insights, guest analytics, and season performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingReportCount > 0 && (
            <Link
              href="/dashboard/reports/new"
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{pendingReportCount} Trip{pendingReportCount > 1 ? 's' : ''} Needing Reports</span>
              <span className="sm:hidden">{pendingReportCount}</span>
            </Link>
          )}
          <Link
            href="/dashboard/reports/new"
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Trip Report</span>
          </Link>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No report data yet"
          description="Once you complete your first trip, revenue and booking analytics will appear here. Reports help you track your season performance."
          actions={[
            { label: 'View Schedule', href: '/dashboard/schedule' },
            { label: 'Share Booking Link', href: '/dashboard/settings?tab=booking-page', variant: 'secondary' },
          ]}
        />
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-slate-200">
            <nav className="flex gap-1 overflow-x-auto" aria-label="Report tabs">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-cyan-500 text-cyan-600'
                        : 'border-transparent text-slate-400 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    <tab.icon className={`h-4 w-4 ${isActive ? 'text-cyan-600' : ''}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Date Range Filter — only for Bookings & Guests tabs */}
          {showDateFilter && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                <span>Date range:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dateRangeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDateRange(opt.value)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      dateRange === opt.value
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {dateRange === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-slate-400">to</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab Content */}
          <div>
            {activeTab === 'revenue' && <RevenueTab data={revenueData} />}
            {activeTab === 'bookings' && (
              <BookingInsightsTab data={bookingData} filteredBookings={filteredBookings} />
            )}
            {activeTab === 'guests' && (
              <GuestAnalyticsTab data={guestData} filteredGuests={filteredGuests} captainId={captainId} />
            )}
            {activeTab === 'season' && <SeasonPerformanceTab data={seasonData} />}
            {activeTab === 'promos' && <PromoCodesTab data={promoData} />}
          </div>
        </>
      )}
    </div>
  );
}
