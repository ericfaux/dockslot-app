'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CalendarDays, TrendingUp, TrendingDown } from 'lucide-react';
import type { SeasonalMetrics } from '../lib/analytics-utils';

interface Props {
  metrics: SeasonalMetrics;
}

type ChartView = 'revenue' | 'bookings';

interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly { value?: number }[];
  label?: string;
  chartView: ChartView;
}

function CustomTooltip({ active, payload, label, chartView }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const value = payload[0]?.value;
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-3 shadow-xl">
        <p className="text-sm font-medium text-white mb-1">{label}</p>
        {chartView === 'revenue' ? (
          <p className="text-sm text-cyan-400">
            ${value?.toLocaleString()}
          </p>
        ) : (
          <p className="text-sm text-blue-400">
            {value} bookings
          </p>
        )}
      </div>
    );
  }
  return null;
}

export function SeasonalCharts({ metrics }: Props) {
  const [chartView, setChartView] = useState<ChartView>('revenue');

  const chartData = useMemo(() => {
    return metrics.revenueByMonth.map(m => ({
      name: m.monthLabel,
      revenue: m.revenue,
      bookings: m.bookings,
    }));
  }, [metrics.revenueByMonth]);

  const hasData = chartData.some(d => d.revenue > 0 || d.bookings > 0);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value}`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTooltip = (props: any) => (
    <CustomTooltip {...props} chartView={chartView} />
  );

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 sm:p-6">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-purple-400" />
          <h3 className="text-base sm:text-lg font-semibold text-white">Seasonal Trends</h3>
        </div>

        {/* Toggle buttons */}
        <div className="flex rounded-lg bg-slate-700/50 p-1">
          <button
            onClick={() => setChartView('revenue')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              chartView === 'revenue'
                ? 'bg-cyan-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setChartView('bookings')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              chartView === 'bookings'
                ? 'bg-blue-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bookings
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-12 text-slate-400">
          <CalendarDays className="h-10 w-10 mx-auto mb-2 text-slate-600" />
          <p className="text-sm">No seasonal data yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Charts will appear as you get more bookings
          </p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="h-64 sm:h-72 -mx-2 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                  tickFormatter={chartView === 'revenue' ? formatCurrency : undefined}
                />
                <Tooltip content={renderTooltip} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                {chartView === 'revenue' ? (
                  <Bar
                    dataKey="revenue"
                    fill="url(#revenueGradient)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                ) : (
                  <Bar
                    dataKey="bookings"
                    fill="url(#bookingsGradient)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                )}
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#0891b2" />
                  </linearGradient>
                  <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Year Comparison */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">Season to Date</p>
                <p className="text-xl font-bold text-white">
                  ${metrics.seasonToDate.toLocaleString()}
                </p>
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">Same Period Last Year</p>
                {metrics.samePeriodLastYear > 0 ? (
                  <>
                    <p className="text-xl font-bold text-slate-300">
                      ${metrics.samePeriodLastYear.toLocaleString()}
                    </p>
                    {metrics.yearOverYearChange !== null && (
                      <div className={`flex items-center justify-center gap-1 text-xs mt-1 ${
                        metrics.yearOverYearChange >= 0 ? 'text-green-400' : 'text-rose-400'
                      }`}>
                        {metrics.yearOverYearChange >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {metrics.yearOverYearChange >= 0 ? '+' : ''}
                        {metrics.yearOverYearChange.toFixed(0)}% YoY
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No data</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
