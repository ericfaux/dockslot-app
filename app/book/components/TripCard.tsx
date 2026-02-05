'use client';

import { Clock, DollarSign, ChevronRight, Anchor } from 'lucide-react';
import Link from 'next/link';

export interface TripCardProps {
  id: string;
  title: string;
  description: string | null;
  duration_hours: number;
  price_total: number;
  deposit_amount: number;
  captainId: string;
}

export function TripCard({
  id,
  title,
  description,
  duration_hours,
  price_total,
  deposit_amount,
  captainId,
}: TripCardProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    if (hours === 1) {
      return '1 hour';
    }
    return `${hours} hours`;
  };

  return (
    <Link
      href={`/book/${captainId}/${id}`}
      className="group relative flex flex-col rounded-xl border border-slate-200 bg-white transition-all hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-100/50 active:scale-[0.98] min-h-[160px] shadow-sm"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between border-b border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50">
            <Anchor className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-cyan-700 transition-colors">
              {title}
            </h3>
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 group-hover:bg-cyan-100 transition-colors">
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Description */}
        {description && (
          <p className="text-sm text-slate-500 line-clamp-2">
            {description}
          </p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mt-auto">
          {/* Duration */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <Clock className="h-4 w-4 text-cyan-600" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Duration</div>
              <div className="text-sm font-medium text-slate-900">{formatDuration(duration_hours)}</div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Total Price</div>
              <div className="text-sm font-medium text-slate-900">{formatPrice(price_total)}</div>
            </div>
          </div>
        </div>

        {/* Deposit Info */}
        {deposit_amount > 0 && (
          <div className="rounded-lg bg-cyan-50 border border-cyan-100 px-3 py-2.5">
            <p className="text-xs text-cyan-700 font-medium">
              {formatPrice(deposit_amount)} deposit to book
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
