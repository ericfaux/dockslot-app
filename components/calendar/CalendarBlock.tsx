'use client';

import { memo } from 'react';
import { Users, Ship, Clock } from 'lucide-react';
import { CalendarBlockProps, STATUS_COLORS, STATUS_LABELS } from './types';
import { format, parseISO } from 'date-fns';

/**
 * CalendarBlock - Displays a single booking on the calendar
 * Adapts content based on block height
 */

export const CalendarBlock = memo(function CalendarBlock({
  booking,
  top,
  height,
  onClick,
}: CalendarBlockProps) {
  const colors = STATUS_COLORS[booking.status];
  const statusLabel = STATUS_LABELS[booking.status];

  // Determine content density based on height
  const isCompact = height < 48;
  const isStandard = height >= 48 && height < 80;
  const isLarge = height >= 80;

  const formatTime = (isoString: string): string => {
    try {
      return format(parseISO(isoString), 'h:mm a');
    } catch {
      return '';
    }
  };

  const startTime = formatTime(booking.scheduled_start);
  const endTime = formatTime(booking.scheduled_end);

  return (
    <button
      onClick={onClick}
      className={`absolute left-1 right-1 overflow-hidden rounded-md border-l-4 transition-all duration-150 hover:brightness-110 hover:shadow-lg ${colors.bg} ${colors.border}`}
      style={{
        top,
        height: Math.max(height - 2, 20),
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      <div className="flex h-full flex-col justify-center px-2 py-1">
        {/* Compact: Just guest name */}
        {isCompact && (
          <div className={`truncate text-xs font-semibold ${colors.text}`}>
            {booking.guest_name}
          </div>
        )}

        {/* Standard: Guest name + time */}
        {isStandard && (
          <>
            <div className={`truncate text-sm font-semibold ${colors.text}`}>
              {booking.guest_name}
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="h-3 w-3" />
              <span className="font-mono text-[10px]">
                {startTime} - {endTime}
              </span>
            </div>
          </>
        )}

        {/* Large: Full details */}
        {isLarge && (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className={`truncate text-sm font-semibold ${colors.text}`}>
                {booking.guest_name}
              </div>
              {/* Status dot */}
              <div className={`h-2 w-2 flex-shrink-0 rounded-full ${colors.dot}`} />
            </div>

            {/* Trip type */}
            {booking.trip_type && (
              <div className="mt-0.5 truncate text-xs text-slate-400">
                {booking.trip_type.title}
              </div>
            )}

            {/* Meta row */}
            <div className="mt-1 flex items-center gap-3 text-slate-500">
              {/* Party size */}
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span className="font-mono text-[10px]">{booking.party_size}</span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="font-mono text-[10px]">{startTime}</span>
              </div>

              {/* Vessel */}
              {booking.vessel && (
                <div className="flex items-center gap-1">
                  <Ship className="h-3 w-3" />
                  <span className="truncate font-mono text-[10px]">
                    {booking.vessel.name}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Hover tooltip for compact blocks */}
      {isCompact && (
        <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden w-48 rounded-md bg-slate-800 p-2 shadow-lg group-hover:block">
          <div className={`font-semibold ${colors.text}`}>{booking.guest_name}</div>
          <div className="text-xs text-slate-400">
            {startTime} - {endTime}
          </div>
          {booking.trip_type && (
            <div className="text-xs text-slate-500">{booking.trip_type.title}</div>
          )}
          <div className="mt-1 flex items-center gap-1 text-xs">
            <div className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
            <span className="text-slate-400">{statusLabel}</span>
          </div>
        </div>
      )}
    </button>
  );
});
