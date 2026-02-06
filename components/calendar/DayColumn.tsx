'use client';

import { useMemo, useState, useCallback } from 'react';
import { format, parseISO, isSameDay, addHours, setHours, setMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { X, Plus } from 'lucide-react';
import { CalendarBlock } from './CalendarBlock';
import { NowIndicator } from './NowIndicator';
import { DayColumnProps, CalendarBooking } from './types';

/**
 * DayColumn - Displays a single day with time grid and booking blocks
 */

interface PositionedBooking {
  booking: CalendarBooking;
  top: number;
  height: number;
}

interface ExtendedDayColumnProps extends DayColumnProps {
  onEmptySlotClick?: (date: Date, hour: number) => void;
}

export function DayColumn({
  date,
  bookings,
  startHour,
  endHour,
  pixelsPerHour,
  isToday,
  timezone,
  onBlockClick,
  blackoutDate,
  onBlackoutClick,
  onEmptySlotClick,
}: ExtendedDayColumnProps) {
  const totalHeight = (endHour - startHour) * pixelsPerHour;
  const [showTooltip, setShowTooltip] = useState(false);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const isBlocked = !!blackoutDate;

  // Handle click on time grid (empty slot)
  const handleGridClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isBlocked || !onEmptySlotClick) return;

    // Get click position relative to the grid
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;

    // Calculate the hour clicked
    const hourOffset = Math.floor(clickY / pixelsPerHour);
    const clickedHour = startHour + hourOffset;

    // Check if there's a booking at this hour
    const hasBookingAtHour = bookings.some((booking) => {
      const start = timezone ? toZonedTime(parseISO(booking.scheduled_start), timezone) : parseISO(booking.scheduled_start);
      const end = timezone ? toZonedTime(parseISO(booking.scheduled_end), timezone) : parseISO(booking.scheduled_end);
      return start.getHours() <= clickedHour && end.getHours() > clickedHour;
    });

    if (!hasBookingAtHour) {
      onEmptySlotClick(date, clickedHour);
    }
  }, [isBlocked, onEmptySlotClick, pixelsPerHour, startHour, bookings, date, timezone]);

  // Handle hover for visual feedback
  const handleGridMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isBlocked || !onEmptySlotClick) {
      setHoveredHour(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const hourOffset = Math.floor(clickY / pixelsPerHour);
    const hour = startHour + hourOffset;

    // Check if there's a booking at this hour
    const hasBookingAtHour = bookings.some((booking) => {
      const start = timezone ? toZonedTime(parseISO(booking.scheduled_start), timezone) : parseISO(booking.scheduled_start);
      const end = timezone ? toZonedTime(parseISO(booking.scheduled_end), timezone) : parseISO(booking.scheduled_end);
      return start.getHours() <= hour && end.getHours() > hour;
    });

    setHoveredHour(hasBookingAtHour ? null : hour);
  }, [isBlocked, onEmptySlotClick, pixelsPerHour, startHour, bookings, timezone]);

  // Calculate positions for each booking
  const positionedBookings = useMemo((): PositionedBooking[] => {
    return bookings.map((booking) => {
      const start = timezone ? toZonedTime(parseISO(booking.scheduled_start), timezone) : parseISO(booking.scheduled_start);
      const end = timezone ? toZonedTime(parseISO(booking.scheduled_end), timezone) : parseISO(booking.scheduled_end);

      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getHours() * 60 + end.getMinutes();

      const startFromDayStart = startMinutes - startHour * 60;
      const duration = endMinutes - startMinutes;

      const top = (startFromDayStart / 60) * pixelsPerHour;
      const height = (duration / 60) * pixelsPerHour;

      return { booking, top: Math.max(0, top), height };
    });
  }, [bookings, startHour, pixelsPerHour, timezone]);

  // Generate hour grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    for (let h = startHour; h <= endHour; h++) {
      lines.push(h);
    }
    return lines;
  }, [startHour, endHour]);

  const dayName = format(date, 'EEE');
  const dateLabel = format(date, 'M/d');
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  return (
    <div className="flex flex-1 flex-col border-r border-slate-700/50 last:border-r-0">
      {/* Day Header - sticky so it stays visible when scrolling */}
      <div
        className={`sticky top-0 z-10 relative flex h-14 flex-col items-center justify-center border-b border-slate-700/50 ${
          isWeekend && !isBlocked && !isToday ? 'bg-slate-800' : 'bg-slate-900'
        }`}
        onMouseEnter={() => isBlocked && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => isBlocked && blackoutDate && onBlackoutClick?.(blackoutDate)}
        role={isBlocked ? 'button' : undefined}
        tabIndex={isBlocked ? 0 : undefined}
      >
        {/* Today tint overlay */}
        {isToday && !isBlocked && (
          <div className="pointer-events-none absolute inset-0 bg-cyan-500/10" />
        )}

        {/* Blocked tint overlay */}
        {isBlocked && (
          <div className="pointer-events-none absolute inset-0 bg-rose-500/10" />
        )}

        {/* Blocked indicator */}
        {isBlocked && (
          <div className="absolute right-1 top-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/30">
              <X className="h-3 w-3 text-rose-400" />
            </div>
          </div>
        )}

        {/* Today accent bar */}
        {isToday && !isBlocked && (
          <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-cyan-400" />
        )}

        <span className={`relative font-mono text-[11px] font-medium uppercase tracking-wider ${
          isBlocked ? 'text-rose-400' : isToday ? 'text-cyan-400' : isWeekend ? 'text-slate-500' : 'text-slate-400'
        }`}>
          {dayName}
        </span>
        <span className={`relative font-mono text-sm ${
          isBlocked ? 'text-rose-400/70 line-through' : isToday ? 'text-cyan-300 font-bold' : isWeekend ? 'text-slate-500' : 'text-slate-300'
        }`}>
          {dateLabel}
        </span>

        {/* Tooltip for blocked reason */}
        {isBlocked && showTooltip && (
          <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 transform">
            <div className="whitespace-nowrap rounded-lg border border-rose-500/30 bg-slate-800 px-3 py-2 text-xs shadow-lg">
              <div className="font-medium text-rose-400">Blocked</div>
              {blackoutDate?.reason && (
                <div className="mt-1 max-w-[200px] truncate text-slate-400">{blackoutDate.reason}</div>
              )}
              <div className="mt-1 text-slate-500">Click to unblock</div>
            </div>
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 transform border-l border-t border-rose-500/30 bg-slate-800" />
          </div>
        )}
      </div>

      {/* Time Grid */}
      <div
        className={`relative flex-1 ${onEmptySlotClick && !isBlocked ? 'cursor-pointer' : ''}`}
        style={{ height: totalHeight }}
        onClick={handleGridClick}
        onMouseMove={handleGridMouseMove}
        onMouseLeave={() => setHoveredHour(null)}
      >
        {/* Hour grid lines */}
        {gridLines.map((hour, index) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-slate-700/30"
            style={{ top: index * pixelsPerHour }}
          />
        ))}

        {/* Hover indicator for empty slot */}
        {hoveredHour !== null && (
          <div
            className="absolute left-0 right-0 flex items-center justify-center bg-cyan-500/10 border border-dashed border-cyan-500/40 transition-all z-5"
            style={{
              top: (hoveredHour - startHour) * pixelsPerHour,
              height: pixelsPerHour,
            }}
          >
            <div className="flex items-center gap-1 rounded-full bg-cyan-500/20 px-2 py-1">
              <Plus className="h-3 w-3 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400">Add booking</span>
            </div>
          </div>
        )}

        {/* Half-hour grid lines (more subtle) */}
        {gridLines.slice(0, -1).map((hour, index) => (
          <div
            key={`half-${hour}`}
            className="absolute left-0 right-0 border-t border-slate-700/15"
            style={{ top: index * pixelsPerHour + pixelsPerHour / 2 }}
          />
        ))}

        {/* Blocked day overlay */}
        {isBlocked && (
          <div className="pointer-events-none absolute inset-0 bg-rose-500/5">
            {/* Diagonal stripes pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(244, 63, 94, 0.1) 10px, rgba(244, 63, 94, 0.1) 20px)',
              }}
            />
          </div>
        )}

        {/* Today highlight */}
        {isToday && !isBlocked && (
          <div className="pointer-events-none absolute inset-0 bg-cyan-500/5" />
        )}

        {/* Weekend shade */}
        {isWeekend && !isBlocked && !isToday && (
          <div className="pointer-events-none absolute inset-0 bg-slate-400/[0.03]" />
        )}

        {/* Now indicator (only for today) */}
        {isToday && (
          <NowIndicator startHour={startHour} pixelsPerHour={pixelsPerHour} timezone={timezone} />
        )}

        {/* Booking blocks */}
        {positionedBookings.map(({ booking, top, height }) => (
          <CalendarBlock
            key={booking.id}
            booking={booking}
            top={top}
            height={height}
            onClick={() => onBlockClick?.(booking)}
          />
        ))}
      </div>
    </div>
  );
}
