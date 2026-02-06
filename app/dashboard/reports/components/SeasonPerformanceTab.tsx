'use client';

import { TrendingUp, TrendingDown, Clock, CloudRain, RefreshCw, XCircle, DollarSign } from 'lucide-react';
import type { SeasonPerformanceData } from '@/app/actions/analytics';

interface Props {
  data: SeasonPerformanceData;
}

function ProgressRing({ value, maxValue, label, color }: {
  value: number;
  maxValue: number;
  label: string;
  color: string;
}) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const radius = 38;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const filledLength = (percentage / 100) * arcLength;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24 rounded-full bg-slate-100">
        <svg className="h-24 w-24" viewBox="0 0 100 100" style={{ transform: 'rotate(-225deg)' }}>
          <circle
            cx="50" cy="50" r={radius}
            fill="none" stroke="#334155" strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={`${filledLength} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-bold text-slate-900">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <span className="mt-2 text-xs font-medium text-slate-400">{label}</span>
    </div>
  );
}

export function SeasonPerformanceTab({ data }: Props) {
  const hasData = data.bookedHoursThisSeason > 0 || data.thisSeasonRevenue > 0;

  if (!hasData) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <TrendingUp className="mx-auto h-12 w-12 text-slate-600" />
        <h3 className="mt-4 text-lg font-medium text-slate-900">No season data yet</h3>
        <p className="mt-2 text-sm text-slate-400">
          Season performance metrics will appear as you complete bookings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Utilization & Capacity */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 flex flex-col items-center">
          <ProgressRing
            value={data.utilizationRate}
            maxValue={100}
            label="Utilization Rate"
            color="#06b6d4"
          />
          <div className="mt-3 text-center">
            <p className="text-xs text-slate-400">
              {data.bookedHoursThisSeason}h booked
              {data.availableHoursPerWeek > 0 && (
                <> / {data.availableHoursPerWeek}h available per week</>
              )}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 flex flex-col items-center">
          <ProgressRing
            value={data.revenueVsCapacity.actual}
            maxValue={Math.max(data.revenueVsCapacity.potential, data.revenueVsCapacity.actual, 1)}
            label="Revenue vs Capacity"
            color="#34d399"
          />
          <div className="mt-3 text-center">
            <p className="text-sm font-medium text-slate-900">
              ${data.revenueVsCapacity.actual.toLocaleString()}
            </p>
            {data.revenueVsCapacity.potential > 0 && (
              <p className="text-xs text-slate-400">
                of ${data.revenueVsCapacity.potential.toLocaleString()} potential
              </p>
            )}
          </div>
        </div>

        {/* Hours Breakdown */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-cyan-600" />
            <h3 className="text-base font-semibold text-slate-900">Hours</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Booked This Season</span>
              <span className="text-sm font-medium text-slate-900">{data.bookedHoursThisSeason}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Available / Week</span>
              <span className="text-sm font-medium text-slate-900">
                {data.availableHoursPerWeek > 0 ? `${data.availableHoursPerWeek.toFixed(1)}h` : 'Not set'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Year over Year Comparison */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Season Comparison</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">This Season</p>
            <p className="text-2xl font-bold text-slate-900">
              ${data.thisSeasonRevenue.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Last Season</p>
            {data.lastSeasonRevenue > 0 ? (
              <>
                <p className="text-2xl font-bold text-slate-600">
                  ${data.lastSeasonRevenue.toLocaleString()}
                </p>
                {data.yearOverYearChange !== null && (
                  <div className={`flex items-center justify-center gap-1 text-xs mt-1 ${
                    data.yearOverYearChange >= 0 ? 'text-green-400' : 'text-rose-600'
                  }`}>
                    {data.yearOverYearChange >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {data.yearOverYearChange >= 0 ? '+' : ''}
                    {data.yearOverYearChange.toFixed(0)}% YoY
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* Weather Hold Impact */}
      {data.weatherHoldImpact.totalHolds > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <CloudRain className="h-5 w-5 text-amber-600" />
            <h3 className="text-base font-semibold text-slate-900">Weather Hold Impact</h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {data.weatherHoldImpact.totalHolds}
              </p>
              <p className="text-xs text-slate-400">Total Holds</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <RefreshCw className="h-3 w-3 text-green-400" />
                <p className="text-2xl font-bold text-green-400">
                  {data.weatherHoldImpact.rescheduled}
                </p>
              </div>
              <p className="text-xs text-slate-400">Rescheduled</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <XCircle className="h-3 w-3 text-rose-600" />
                <p className="text-2xl font-bold text-rose-600">
                  {data.weatherHoldImpact.cancelled}
                </p>
              </div>
              <p className="text-xs text-slate-400">Cancelled</p>
            </div>
          </div>

          {/* Recovery bar */}
          {(data.weatherHoldImpact.rescheduled + data.weatherHoldImpact.cancelled) > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Recovery Rate</span>
                <span>
                  {((data.weatherHoldImpact.rescheduled /
                    (data.weatherHoldImpact.rescheduled + data.weatherHoldImpact.cancelled)) * 100
                  ).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400"
                  style={{
                    width: `${(data.weatherHoldImpact.rescheduled /
                      (data.weatherHoldImpact.rescheduled + data.weatherHoldImpact.cancelled)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {data.weatherHoldImpact.revenueSaved > 0 && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-xs text-green-400/80">Revenue Saved by Rescheduling</p>
                  <p className="text-xl font-bold text-green-400">
                    ${data.weatherHoldImpact.revenueSaved.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
