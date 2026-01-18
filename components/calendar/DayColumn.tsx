'use client';

import { useMemo } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
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

export function DayColumn({
  date,
  bookings,
  startHour,
  endHour,
  pixelsPerHour,
  isToday,
  onBlockClick,
}: DayColumnProps) {
  const totalHeight = (endHour - startHour) * pixelsPerHour;

  // Calculate positions for each booking
  const positionedBookings = useMemo((): PositionedBooking[] => {
    return bookings.map((booking) => {
      const start = parseISO(booking.scheduled_start);
      const end = parseISO(booking.scheduled_end);

      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getHours() * 60 + end.getMinutes();

      const startFromDayStart = startMinutes - startHour * 60;
      const duration = endMinutes - startMinutes;

      const top = (startFromDayStart / 60) * pixelsPerHour;
      const height = (duration / 60) * pixelsPerHour;

      return { booking, top: Math.max(0, top), height };
    });
  }, [bookings, startHour, pixelsPerHour]);

  // Generate hour grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    for (let h = startHour; h <= endHour; h++) {
      lines.push(h);
    }
    return lines;
  }, [startHour, endHour]);

  const dayName = format(date, 'EEE');
  const dayNumber = format(date, 'd');
  const monthName = format(date, 'MMM');

  return (
    <div className="flex flex-1 flex-col border-r border-slate-700/50 last:border-r-0">
      {/* Day Header */}
      <div
        className={`flex flex-col items-center border-b border-slate-700/50 py-3 ${
          isToday ? 'bg-cyan-500/10' : 'bg-slate-800/50'
        }`}
      >
        <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
          {dayName}
        </span>
        <span
          className={`font-mono text-xl font-bold ${
            isToday ? 'text-cyan-400' : 'text-slate-300'
          }`}
        >
          {dayNumber}
        </span>
        <span className="font-mono text-[10px] text-slate-600">{monthName}</span>
      </div>

      {/* Time Grid */}
      <div className="relative flex-1" style={{ height: totalHeight }}>
        {/* Hour grid lines */}
        {gridLines.map((hour, index) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-slate-700/30"
            style={{ top: index * pixelsPerHour }}
          />
        ))}

        {/* Half-hour grid lines (more subtle) */}
        {gridLines.slice(0, -1).map((hour, index) => (
          <div
            key={`half-${hour}`}
            className="absolute left-0 right-0 border-t border-slate-700/15"
            style={{ top: index * pixelsPerHour + pixelsPerHour / 2 }}
          />
        ))}

        {/* Today highlight */}
        {isToday && (
          <div className="pointer-events-none absolute inset-0 bg-cyan-500/5" />
        )}

        {/* Now indicator (only for today) */}
        {isToday && (
          <NowIndicator startHour={startHour} pixelsPerHour={pixelsPerHour} />
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
