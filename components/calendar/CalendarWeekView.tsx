'use client';

import { useMemo, useRef, useEffect } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { DayColumn } from './DayColumn';
import { TimeColumn } from './TimeColumn';
import { CalendarBooking, CalendarView } from './types';

interface CalendarWeekViewProps {
  date: Date;
  bookings: CalendarBooking[];
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onBlockClick?: (booking: CalendarBooking) => void;
  isLoading?: boolean;
}

const START_HOUR = 5; // 5 AM
const END_HOUR = 21; // 9 PM
const PIXELS_PER_HOUR = 60;

export function CalendarWeekView({
  date,
  bookings,
  onDateChange,
  onViewChange,
  onBlockClick,
  isLoading,
}: CalendarWeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get days of the week
  const weekDays = useMemo(() => {
    const start = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(date, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [date]);

  // Group bookings by day
  const bookingsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarBooking[]>();

    weekDays.forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      grouped.set(dateKey, []);
    });

    bookings.forEach((booking) => {
      try {
        const bookingDate = format(new Date(booking.scheduled_start), 'yyyy-MM-dd');
        const existing = grouped.get(bookingDate) || [];
        existing.push(booking);
        grouped.set(bookingDate, existing);
      } catch {
        // Skip invalid dates
      }
    });

    return grouped;
  }, [weekDays, bookings]);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollToHour = Math.max(0, currentHour - 2); // Show 2 hours before current time
      const scrollPosition = (scrollToHour - START_HOUR) * PIXELS_PER_HOUR;
      scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, []);

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const dateRangeLabel = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  const handlePrevWeek = () => onDateChange(subWeeks(date, 1));
  const handleNextWeek = () => onDateChange(addWeeks(date, 1));
  const handleToday = () => onDateChange(new Date());

  const today = new Date();

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextWeek}
            className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={handleToday}
            className="rounded-md px-3 py-1.5 font-mono text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-400/10"
          >
            TODAY
          </button>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-slate-500" />
          <span className="font-mono text-sm font-medium text-slate-300">
            {dateRangeLabel}
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-800/50 p-1">
          {(['day', 'week', 'month'] as CalendarView[]).map((view) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`rounded-md px-3 py-1 font-mono text-xs font-medium transition-all ${
                view === 'week'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {view.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/50">
            <div className="flex items-center gap-2 text-cyan-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              <span className="font-mono text-sm">Loading...</span>
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div
          ref={scrollContainerRef}
          className="flex flex-1 overflow-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 #1e293b' }}
        >
          {/* Time column (sticky) */}
          <div className="sticky left-0 z-10 bg-slate-900">
            <div className="h-[76px] border-b border-slate-700/50" /> {/* Header spacer */}
            <TimeColumn
              startHour={START_HOUR}
              endHour={END_HOUR}
              pixelsPerHour={PIXELS_PER_HOUR}
            />
          </div>

          {/* Day columns */}
          <div className="flex flex-1">
            {weekDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayBookings = bookingsByDay.get(dateKey) || [];
              const isToday = isSameDay(day, today);

              return (
                <DayColumn
                  key={dateKey}
                  date={day}
                  bookings={dayBookings}
                  startHour={START_HOUR}
                  endHour={END_HOUR}
                  pixelsPerHour={PIXELS_PER_HOUR}
                  isToday={isToday}
                  onBlockClick={onBlockClick}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
