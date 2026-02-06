'use client';

import { Users, UserCheck, UsersRound, Anchor } from 'lucide-react';
import type { CustomerMetrics } from '../lib/analytics-utils';

interface Props {
  metrics: CustomerMetrics;
}

export function CustomerInsightsCard({ metrics }: Props) {
  const hasData = metrics.totalUniqueGuests > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-600" />
        <h3 className="text-base sm:text-lg font-semibold text-slate-900">Customer Insights</h3>
      </div>

      {!hasData ? (
        <div className="text-center py-6 text-slate-400">
          <Users className="h-10 w-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm">No customer data yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Book your first trip to see customer insights
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Repeat Customers */}
            <div className="rounded-lg bg-slate-100 p-3">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="h-4 w-4 text-green-400" />
                <span className="text-xs text-slate-400">Repeat Guests</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {metrics.repeatCustomers}
              </p>
              <p className="text-xs text-slate-500">
                {metrics.repeatRate.toFixed(0)}% of {metrics.totalUniqueGuests} guests
              </p>
            </div>

            {/* Average Party Size */}
            <div className="rounded-lg bg-slate-100 p-3">
              <div className="flex items-center gap-2 mb-1">
                <UsersRound className="h-4 w-4 text-cyan-600" />
                <span className="text-xs text-slate-400">Avg Party Size</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {metrics.averagePartySize.toFixed(1)}
              </p>
              <p className="text-xs text-slate-500">guests per trip</p>
            </div>
          </div>

          {/* Most Popular Trip Type */}
          {metrics.mostPopularTripType && (
            <div className="rounded-lg bg-cyan-50 border border-cyan-500/30 p-3">
              <div className="flex items-center gap-2">
                <Anchor className="h-5 w-5 text-cyan-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-cyan-600/80">Most Popular Trip</p>
                  <p className="text-base font-semibold text-cyan-600 truncate">
                    {metrics.mostPopularTripType.name}
                  </p>
                  <p className="text-xs text-cyan-600/60">
                    {metrics.mostPopularTripType.count} bookings ({metrics.mostPopularTripType.percentage.toFixed(0)}%)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trip Type Breakdown */}
          {metrics.tripTypeBreakdown.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Trip Breakdown</p>
              {metrics.tripTypeBreakdown.slice(0, 4).map((trip) => (
                <div key={trip.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 truncate max-w-[60%]">{trip.name}</span>
                    <span className="text-slate-400 text-xs">
                      {trip.count} ({trip.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${trip.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
