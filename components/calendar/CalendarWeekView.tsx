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
import { toZonedTime } from 'date-fns-tz';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarX, Lock } from 'lucide-react';
import { DayColumn } from './DayColumn';
import { TimeColumn } from './TimeColumn';
import { CalendarBooking, CalendarView, BlackoutDate, STATUS_COLORS, STATUS_LABELS } from './types';
import { BookingStatus } from '@/lib/db/types';
import { GatedButton } from '@/components/GatedButton';

interface CalendarWeekViewProps {
  date: Date;
  bookings: CalendarBooking[];
  blackoutDates?: BlackoutDate[];
  timezone?: string;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onBlockClick?: (booking: CalendarBooking) => void;
  onQuickBlockClick?: () => void;
  onBlackoutClick?: (blackout: BlackoutDate) => void;
  onEmptySlotClick?: (date: Date, hour: number) => void;
  isLoading?: boolean;
  availabilityStartHour?: number;
  availabilityEndHour?: number;
  /** When true, the Day view option is locked behind a paywall */
  dayViewLocked?: boolean;
}

const DEFAULT_START_HOUR = 5; // 5 AM
const DEFAULT_END_HOUR = 21; // 9 PM
const PIXELS_PER_HOUR = 60;

export function CalendarWeekView({
  date,
  bookings,
  blackoutDates = [],
  timezone,
  onDateChange,
  onViewChange,
  onBlockClick,
  onQuickBlockClick,
  onBlackoutClick,
  onEmptySlotClick,
  isLoading,
  availabilityStartHour,
  availabilityEndHour,
  dayViewLocked,
}: CalendarWeekViewProps) {
  const START_HOUR = availabilityStartHour ?? DEFAULT_START_HOUR;
  const END_HOUR = availabilityEndHour ?? DEFAULT_END_HOUR;
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

  // Map blackout dates by date string for quick lookup
  const blackoutsByDate = useMemo(() => {
    const mapped = new Map<string, BlackoutDate>();
    blackoutDates.forEach((blackout) => {
      mapped.set(blackout.blackout_date, blackout);
    });
    return mapped;
  }, [blackoutDates]);

  // Auto-scroll to availability start or current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const zonedNow = timezone ? toZonedTime(now, timezone) : now;
      const currentHour = zonedNow.getHours();

      let scrollToHour: number;
      if (currentHour >= START_HOUR && currentHour <= END_HOUR) {
        // During availability hours: show 2 hours before current time
        scrollToHour = Math.max(START_HOUR, currentHour - 2);
      } else {
        // Outside availability hours: scroll to the start of availability
        scrollToHour = START_HOUR;
      }

      const scrollPosition = (scrollToHour - START_HOUR) * PIXELS_PER_HOUR;
      scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/50 px-3 md:px-4 py-3">
        {/* Navigation */}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={handlePrevWeek}
            className="rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextWeek}
            className="rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={handleToday}
            className="rounded-md px-3 py-1.5 min-h-[44px] font-mono text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-300/10"
          >
            TODAY
          </button>
          {onQuickBlockClick && (
            <GatedButton feature="quick_block">
              <button
                onClick={onQuickBlockClick}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 min-h-[44px] font-mono text-xs font-medium text-rose-300 transition-colors hover:bg-rose-300/10"
              >
                <CalendarX className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">QUICK </span>BLOCK
              </button>
            </GatedButton>
          )}
        </div>

        {/* Date Range */}
        <div className="hidden sm:flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-slate-400" />
          <span className="font-mono text-sm font-medium text-slate-300">
            {dateRangeLabel}
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-800/50 p-1">
          {(['day', 'week'] as CalendarView[]).map((view) => {
            const isLocked = view === 'day' && dayViewLocked;
            const isActive = view === 'week'; // Week view is always active in this component
            return (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`rounded-md px-2.5 py-1 min-h-[36px] font-mono text-xs font-medium transition-all ${
                  isLocked
                    ? 'text-slate-600 cursor-pointer'
                    : isActive
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-1">
                  {view.toUpperCase()}
                  {isLocked && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-bold uppercase text-amber-400">
                      <Lock className="h-2.5 w-2.5" />
                      Captain
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex items-center gap-4 border-b border-slate-700/50 px-4 py-2 overflow-x-auto">
        {(['confirmed', 'pending_deposit', 'weather_hold', 'rescheduled'] as BookingStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-1.5 whitespace-nowrap">
            <div className={`h-3 w-3 rounded-full ${STATUS_COLORS[status].dot}`} />
            <span className="font-mono text-xs font-medium text-slate-200">{STATUS_LABELS[status]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <div className="h-3 w-3 rounded-full bg-slate-500" />
          <span className="font-mono text-xs font-medium text-slate-200">Completed</span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <div className="h-3 w-3 rounded-full bg-rose-500" />
          <span className="font-mono text-xs font-medium text-slate-200">Cancelled / No Show</span>
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
          <div className="sticky left-0 z-20 bg-slate-900">
            <div className="sticky top-0 z-30 h-14 border-b border-slate-700/50 bg-slate-900" /> {/* Header spacer - sticky to stay with day headers */}
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
              const blackoutDate = blackoutsByDate.get(dateKey);

              return (
                <DayColumn
                  key={dateKey}
                  date={day}
                  bookings={dayBookings}
                  startHour={START_HOUR}
                  endHour={END_HOUR}
                  pixelsPerHour={PIXELS_PER_HOUR}
                  isToday={isToday}
                  timezone={timezone}
                  onBlockClick={onBlockClick}
                  blackoutDate={blackoutDate}
                  onBlackoutClick={onBlackoutClick}
                  onEmptySlotClick={onEmptySlotClick}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
