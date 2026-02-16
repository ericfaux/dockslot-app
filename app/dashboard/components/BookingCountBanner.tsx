'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';

interface BookingCountBannerProps {
  count: number;
  limit: number;
}

export function BookingCountBanner({ count, limit }: BookingCountBannerProps) {
  const isAtLimit = count >= limit;
  const percentage = Math.min((count / limit) * 100, 100);

  return (
    <div className={`rounded-xl border p-4 ${
      isAtLimit
        ? 'border-amber-200 bg-amber-50'
        : 'border-slate-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">
          {isAtLimit
            ? `You've used ${limit}/${limit} bookings this month`
            : `${count}/${limit} bookings used this month`
          }
        </span>
        {isAtLimit && (
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-cyan-700"
          >
            <Zap className="h-3 w-3" />
            Upgrade to Captain
          </Link>
        )}
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full transition-all ${
            isAtLimit ? 'bg-amber-500' : 'bg-cyan-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isAtLimit && (
        <p className="mt-2 text-xs text-amber-700">
          Upgrade to Captain for unlimited bookings.
        </p>
      )}
    </div>
  );
}
