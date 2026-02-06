'use client';

import { useState } from 'react';
import { DollarSign, CalendarDays, Users, TrendingUp, Download, ChevronDown, FileText, Plus, Tag, BarChart3 } from 'lucide-react';
import { RevenueTab } from './RevenueTab';
import { BookingInsightsTab } from './BookingInsightsTab';
import { GuestAnalyticsTab } from './GuestAnalyticsTab';
import { SeasonPerformanceTab } from './SeasonPerformanceTab';
import { PromoCodesTab } from './PromoCodesTab';
import { EmptyState } from '@/components/EmptyState';
import type { RevenueOverviewData, BookingInsightsData, GuestAnalyticsData, SeasonPerformanceData, PromoCodeAnalyticsData } from '@/app/actions/analytics';
import Link from 'next/link';

type TabId = 'revenue' | 'bookings' | 'guests' | 'season' | 'promos';

const tabs = [
  { id: 'revenue' as const, label: 'Revenue', shortLabel: 'Revenue', icon: DollarSign },
  { id: 'bookings' as const, label: 'Booking Insights', shortLabel: 'Bookings', icon: CalendarDays },
  { id: 'guests' as const, label: 'Guest Analytics', shortLabel: 'Guests', icon: Users },
  { id: 'season' as const, label: 'Season Performance', shortLabel: 'Season', icon: TrendingUp },
  { id: 'promos' as const, label: 'Promo Codes', shortLabel: 'Promos', icon: Tag },
];

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

  const hasData = revenueData.allTimeRevenue > 0 || bookingData.totalBookings > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
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
            className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
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
          <div className="border-b border-slate-700">
            <nav className="flex gap-1 overflow-x-auto" aria-label="Report tabs">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-cyan-500 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-300'
                    }`}
                  >
                    <tab.icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : ''}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'revenue' && <RevenueTab data={revenueData} />}
            {activeTab === 'bookings' && <BookingInsightsTab data={bookingData} />}
            {activeTab === 'guests' && <GuestAnalyticsTab data={guestData} />}
            {activeTab === 'season' && <SeasonPerformanceTab data={seasonData} />}
            {activeTab === 'promos' && <PromoCodesTab data={promoData} />}
          </div>
        </>
      )}
    </div>
  );
}
