'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import {
  format,
  isSameDay,
  addDays,
  subDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarX } from 'lucide-react';
import { DayColumn } from './DayColumn';
import { TimeColumn } from './TimeColumn';
import { CalendarBooking, CalendarView, BlackoutDate, STATUS_COLORS, STATUS_LABELS } from './types';
import { BookingStatus } from '@/lib/db/types';

interface CalendarDayViewProps {
  date: Date;
  bookings: CalendarBooking[];
  blackoutDates?: BlackoutDate[];
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onBlockClick?: (booking: CalendarBooking) => void;
  onQuickBlockClick?: () => void;
  onBlackoutClick?: (blackout: BlackoutDate) => void;
  onEmptySlotClick?: (date: Date, hour: number) => void;
  isLoading?: boolean;
}

const START_HOUR = 5; // 5 AM
const END_HOUR = 21; // 9 PM
const PIXELS_PER_HOUR = 60;

export function CalendarDayView({
  date,
  bookings,
  blackoutDates = [],
  onDateChange,
  onViewChange,
  onBlockClick,
  onQuickBlockClick,
  onBlackoutClick,
  onEmptySlotClick,
  isLoading,
}: CalendarDayViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swiping, setSwiping] = useState(false);

  const today = new Date();
  const isToday = isSameDay(date, today);
  const dateKey = format(date, 'yyyy-MM-dd');

  // Filter bookings for current day
  const dayBookings = useMemo(() => {
    return bookings.filter((booking) => {
      try {
        const bookingDate = format(new Date(booking.scheduled_start), 'yyyy-MM-dd');
        return bookingDate === dateKey;
      } catch {
        return false;
      }
    });
  }, [bookings, dateKey]);

  // Find blackout for current day
  const blackoutDate = useMemo(() => {
    return blackoutDates.find((b) => b.blackout_date === dateKey);
  }, [blackoutDates, dateKey]);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollToHour = Math.max(0, currentHour - 2);
      const scrollPosition = (scrollToHour - START_HOUR) * PIXELS_PER_HOUR;
      scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, []);

  // Swipe handlers for day navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwiping(false);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only trigger if horizontal swipe is dominant and substantial
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX > 0) {
        onDateChange(subDays(date, 1)); // Swipe right = previous day
      } else {
        onDateChange(addDays(date, 1)); // Swipe left = next day
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    setSwiping(false);
  }, [date, onDateChange]);

  const handlePrevDay = () => onDateChange(subDays(date, 1));
  const handleNextDay = () => onDateChange(addDays(date, 1));
  const handleToday = () => onDateChange(new Date());

  const dateLabel = format(date, 'EEEE, MMM d');

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-lg bg-slate-900/50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 px-3 py-3">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevDay}
            className="rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextDay}
            className="rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={handleToday}
            className="rounded-md px-3 py-1.5 min-h-[44px] font-mono text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-400/10"
          >
            TODAY
          </button>
        </div>

        {/* Date Label */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-slate-500" />
          <span className="font-mono text-sm font-medium text-slate-300">
            {dateLabel}
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-800/50 p-1">
          {(['day', 'week'] as CalendarView[]).map((view) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`rounded-md px-2.5 py-1 min-h-[36px] font-mono text-xs font-medium transition-all ${
                view === 'day'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {view.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Swipe hint */}
      <div className="flex items-center justify-center gap-2 border-b border-slate-700/50 py-1.5 md:hidden">
        <span className="text-[10px] text-slate-600 font-mono">← swipe to navigate days →</span>
      </div>

      {/* Booking summary for the day */}
      <div className="flex items-center gap-3 border-b border-slate-700/50 px-3 py-2">
        <span className="font-mono text-xs text-slate-400">
          {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
        </span>
        {onQuickBlockClick && (
          <button
            onClick={onQuickBlockClick}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 min-h-[36px] font-mono text-xs font-medium text-rose-400 transition-colors hover:bg-rose-400/10 ml-auto"
          >
            <CalendarX className="h-3.5 w-3.5" />
            BLOCK
          </button>
        )}
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
            <TimeColumn
              startHour={START_HOUR}
              endHour={END_HOUR}
              pixelsPerHour={PIXELS_PER_HOUR}
            />
          </div>

          {/* Single day column (takes full width) */}
          <div className="flex flex-1">
            <DayColumn
              date={date}
              bookings={dayBookings}
              startHour={START_HOUR}
              endHour={END_HOUR}
              pixelsPerHour={PIXELS_PER_HOUR}
              isToday={isToday}
              onBlockClick={onBlockClick}
              blackoutDate={blackoutDate}
              onBlackoutClick={onBlackoutClick}
              onEmptySlotClick={onEmptySlotClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
