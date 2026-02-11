'use client';

import { useState } from 'react';
import { Clock, DollarSign, ChevronRight, Anchor } from 'lucide-react';
import Link from 'next/link';
import { formatDollars } from '@/lib/utils/format';

export interface TripCardProps {
  id: string;
  title: string;
  description: string | null;
  duration_hours: number;
  price_total: number;
  deposit_amount: number;
  captainId: string;
  image_url?: string | null;
  target?: string;
}

export function TripCard({
  id,
  title,
  description,
  duration_hours,
  price_total,
  deposit_amount,
  captainId,
  image_url,
  target,
}: TripCardProps) {
  const [hovered, setHovered] = useState(false);

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
      target={target}
      className="group relative flex flex-col rounded-xl border bg-white transition-all hover:shadow-lg active:scale-[0.98] min-h-[160px] shadow-sm overflow-hidden"
      style={{
        borderColor: hovered ? 'var(--brand-accent, #22d3ee)' : undefined,
        boxShadow: hovered ? '0 10px 15px -3px var(--brand-accent-light, rgba(34, 211, 238, 0.15))' : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card Image */}
      {image_url && (
        <div className="h-36 w-full overflow-hidden">
          <img
            src={image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between border-b border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--brand-accent-light, #ecfeff)' }}
          >
            <Anchor className="h-6 w-6" style={{ color: 'var(--brand-accent, #0891b2)' }} />
          </div>
          <div>
            <h3
              className="text-lg font-semibold text-slate-900 transition-colors"
              style={{ color: hovered ? 'var(--brand-accent, #0e7490)' : undefined }}
            >
              {title}
            </h3>
          </div>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          style={{
            backgroundColor: hovered ? 'var(--brand-accent-light, #ecfeff)' : undefined,
          }}
        >
          <ChevronRight
            className="h-5 w-5 transition-colors"
            style={{ color: hovered ? 'var(--brand-accent, #0891b2)' : undefined }}
          />
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
              <Clock className="h-4 w-4" style={{ color: 'var(--brand-accent, #0891b2)' }} />
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
              <div className="text-sm font-medium text-slate-900">{formatDollars(price_total)}</div>
            </div>
          </div>
        </div>

        {/* Deposit Info */}
        {deposit_amount > 0 && (
          <div
            className="rounded-lg border px-3 py-2.5"
            style={{
              backgroundColor: 'var(--brand-accent-light, #ecfeff)',
              borderColor: 'var(--brand-accent-ring, rgba(8, 145, 178, 0.25))',
            }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--brand-accent, #0891b2)' }}>
              {formatDollars(deposit_amount)} deposit to book
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
