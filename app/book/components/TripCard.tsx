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
      className="group relative flex flex-col rounded-lg border border-slate-700 bg-slate-900 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10"
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between border-b border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
            <Anchor className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
              {title}
            </h3>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Description */}
        {description && (
          <p className="text-sm text-slate-400 line-clamp-2">
            {description}
          </p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mt-auto">
          {/* Duration */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
              <Clock className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Duration</div>
              <div className="text-sm font-medium text-white">{formatDuration(duration_hours)}</div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Total Price</div>
              <div className="text-sm font-medium text-white">{formatPrice(price_total)}</div>
            </div>
          </div>
        </div>

        {/* Deposit Info */}
        {deposit_amount > 0 && (
          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
            <p className="text-xs text-amber-400">
              {formatPrice(deposit_amount)} deposit required to confirm
            </p>
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:via-transparent group-hover:to-transparent transition-all pointer-events-none" />
    </Link>
  );
}
