'use client';

import { useState, useCallback, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';
import { CalendarProps, CalendarView, CalendarBooking, BlackoutDate } from './types';
import { getBlackoutDates } from '@/app/actions/blackout';

/**
 * Calendar - Main calendar component with multiple view modes
 */

interface ExtendedCalendarProps extends CalendarProps {
  onEmptySlotClick?: (date: Date, hour: number) => void;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export function Calendar({
  captainId,
  timezone,
  initialDate = new Date(),
  initialView = 'week',
  onDateChange,
  onViewChange,
  onBlockClick,
  onQuickBlockClick,
  onBlackoutClick,
  onEmptySlotClick,
  refreshKey = 0,
  availabilityStartHour,
  availabilityEndHour,
  dayViewLocked,
}: ExtendedCalendarProps & { dayViewLocked?: boolean }) {
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [currentView, setCurrentView] = useState<CalendarView>(initialView);
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync currentView when initialView prop changes (e.g., from URL navigation)
  useEffect(() => {
    setCurrentView(initialView);
  }, [initialView]);

  // Default to day view on mobile (unless day view is locked for deckhand users)
  useEffect(() => {
    if (isMobile && currentView === 'week' && !dayViewLocked) {
      setCurrentView('day');
    }
  }, [isMobile, dayViewLocked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate date range based on current view
  const getDateRange = useCallback((date: Date, view: CalendarView) => {
    switch (view) {
      case 'day':
        return {
          start: startOfDay(date),
          end: endOfDay(date),
        };
      case 'week':
        return {
          start: startOfWeek(date, { weekStartsOn: 0 }),
          end: endOfWeek(date, { weekStartsOn: 0 }),
        };
      case 'month':
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
        };
    }
  }, []);

  // Fetch bookings and blackout dates for the current date range
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRange(currentDate, currentView);
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');

      // Fetch bookings and blackout dates in parallel
      const [bookingsResponse, blackoutsResult] = await Promise.all([
        fetch(`/api/bookings?${new URLSearchParams({
          captainId,
          startDate: startDateStr,
          endDate: endDateStr,
          includeHistorical: 'false',
          limit: '100',
        })}`),
        getBlackoutDates(captainId, start, end),
      ]);

      if (!bookingsResponse.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const bookingsData = await bookingsResponse.json();
      setBookings(bookingsData.bookings || []);

      if (blackoutsResult.success && blackoutsResult.data) {
        setBlackoutDates(blackoutsResult.data);
      } else {
        setBlackoutDates([]);
      }
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
      setBookings([]);
      setBlackoutDates([]);
    } finally {
      setIsLoading(false);
    }
  }, [captainId, currentDate, currentView, getDateRange]);

  // Fetch data when date, view, or refreshKey changes
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Handle date change
  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
    onDateChange?.(date);
  }, [onDateChange]);

  // Handle view change
  const handleViewChange = useCallback((view: CalendarView) => {
    setCurrentView(view);
    onViewChange?.(view);
  }, [onViewChange]);

  // Handle block click
  const handleBlockClick = useCallback((booking: CalendarBooking) => {
    onBlockClick?.(booking);
  }, [onBlockClick]);

  // Render error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-slate-900/50 p-8">
        <div className="text-center">
          <div className="mb-2 text-rose-400">{error}</div>
          <button
            onClick={fetchData}
            className="rounded-md bg-slate-800 px-4 py-2 font-mono text-sm text-cyan-400 transition-colors hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Handle blackout click
  const handleBlackoutClick = useCallback((blackout: BlackoutDate) => {
    onBlackoutClick?.(blackout);
  }, [onBlackoutClick]);

  // Render based on current view
  switch (currentView) {
    case 'day':
      return (
        <CalendarDayView
          date={currentDate}
          bookings={bookings}
          blackoutDates={blackoutDates}
          timezone={timezone}
          onDateChange={handleDateChange}
          onViewChange={handleViewChange}
          onBlockClick={handleBlockClick}
          onQuickBlockClick={onQuickBlockClick}
          onBlackoutClick={handleBlackoutClick}
          onEmptySlotClick={onEmptySlotClick}
          isLoading={isLoading}
          availabilityStartHour={availabilityStartHour}
          availabilityEndHour={availabilityEndHour}
          dayViewLocked={dayViewLocked}
        />
      );
    case 'week':
    case 'month':
    default:
      return (
        <CalendarWeekView
          date={currentDate}
          bookings={bookings}
          blackoutDates={blackoutDates}
          timezone={timezone}
          onDateChange={handleDateChange}
          onViewChange={handleViewChange}
          onBlockClick={handleBlockClick}
          onQuickBlockClick={onQuickBlockClick}
          onBlackoutClick={handleBlackoutClick}
          onEmptySlotClick={onEmptySlotClick}
          isLoading={isLoading}
          availabilityStartHour={availabilityStartHour}
          availabilityEndHour={availabilityEndHour}
          dayViewLocked={dayViewLocked}
        />
      );
  }
}
