'use client';

import { CloudRain, RefreshCw, XCircle, DollarSign, TrendingUp } from 'lucide-react';
import type { WeatherMetrics } from '../lib/analytics-utils';

interface Props {
  metrics: WeatherMetrics;
}

export function WeatherMetricsCard({ metrics }: Props) {
  const hasData = metrics.weatherHoldsTotal > 0;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <CloudRain className="h-5 w-5 text-amber-400" />
        <h3 className="text-base sm:text-lg font-semibold text-white">Weather Impact</h3>
      </div>

      {!hasData ? (
        <div className="text-center py-6 text-slate-400">
          <CloudRain className="h-10 w-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm">No weather holds yet this season</p>
          <p className="text-xs text-slate-500 mt-1">
            Weather hold data will appear here when trips are affected
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Weather Holds This Season */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-700/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <CloudRain className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-slate-400">This Season</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {metrics.weatherHoldsThisSeason}
              </p>
              <p className="text-xs text-slate-500">weather holds</p>
            </div>

            {/* Recovery Rate */}
            <div className="rounded-lg bg-slate-700/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-xs text-slate-400">Recovery Rate</span>
              </div>
              <p className={`text-2xl font-bold ${
                metrics.recoveryRate >= 70 ? 'text-green-400' :
                metrics.recoveryRate >= 50 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {metrics.recoveryRate.toFixed(0)}%
              </p>
              <p className="text-xs text-slate-500">rescheduled</p>
            </div>
          </div>

          {/* Recovery Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-400" />
                <span className="text-slate-300">Rescheduled</span>
              </div>
              <span className="font-medium text-green-400">
                {metrics.rescheduledFromWeather}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-400" />
                <span className="text-slate-300">Cancelled</span>
              </div>
              <span className="font-medium text-rose-400">
                {metrics.cancelledFromWeather}
              </span>
            </div>

            {/* Progress bar showing recovery vs cancellation */}
            {(metrics.rescheduledFromWeather + metrics.cancelledFromWeather) > 0 && (
              <div className="h-2 rounded-full bg-slate-700 overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                  style={{ width: `${metrics.recoveryRate}%` }}
                />
              </div>
            )}
          </div>

          {/* Revenue Saved */}
          <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 mt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-xs text-green-400/80">Revenue Saved by Reschedule</p>
                <p className="text-xl font-bold text-green-400">
                  ${metrics.revenueSavedByReschedule.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
