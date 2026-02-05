'use client';

import { DollarSign, CheckCircle, CalendarClock, CloudSun } from 'lucide-react';
import type { QuickStats } from '../lib/analytics-utils';

interface Props {
  stats: QuickStats;
}

export function QuickStatsCards({ stats }: Props) {
  const cards = [
    {
      label: 'This Month',
      value: `$${stats.thisMonthRevenue.toLocaleString()}`,
      change: stats.thisMonthChange,
      icon: DollarSign,
      iconColor: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      label: 'Trips Completed',
      value: stats.tripsCompleted.toString(),
      icon: CheckCircle,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'Upcoming',
      value: `${stats.upcomingTrips} trips`,
      icon: CalendarClock,
      iconColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
    },
    {
      label: 'Weather Saves',
      value: stats.weatherSaves.toString(),
      subtext: 'rescheduled holds',
      icon: CloudSun,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-slate-700 bg-slate-800 p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${card.bgColor}`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="text-xl sm:text-2xl font-bold text-white truncate">
                  {card.value}
                </p>
                {card.change !== undefined && card.change !== 0 && (
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${
                      card.change > 0 ? 'text-green-400' : 'text-rose-400'
                    }`}
                  >
                    {card.change > 0 ? '+' : ''}
                    {card.change.toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400">{card.label}</p>
              {card.subtext && (
                <p className="text-xs text-slate-500">{card.subtext}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
