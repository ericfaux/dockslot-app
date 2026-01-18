'use client';

import { useState, useCallback, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarProps, CalendarView, CalendarBooking } from './types';

/**
 * Calendar - Main calendar component with multiple view modes
 */

export function Calendar({
  captainId,
  initialDate = new Date(),
  initialView = 'week',
  onDateChange,
  onViewChange,
  onBlockClick,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [currentView, setCurrentView] = useState<CalendarView>(initialView);
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch bookings for the current date range
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRange(currentDate, currentView);
      const startDate = format(start, 'yyyy-MM-dd');
      const endDate = format(end, 'yyyy-MM-dd');

      const params = new URLSearchParams({
        captainId,
        startDate,
        endDate,
        includeHistorical: 'false',
        limit: '100',
      });

      const response = await fetch(`/api/bookings?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [captainId, currentDate, currentView, getDateRange]);

  // Fetch bookings when date or view changes
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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
            onClick={fetchBookings}
            className="rounded-md bg-slate-800 px-4 py-2 font-mono text-sm text-cyan-400 transition-colors hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render based on current view
  switch (currentView) {
    case 'week':
      return (
        <CalendarWeekView
          date={currentDate}
          bookings={bookings}
          onDateChange={handleDateChange}
          onViewChange={handleViewChange}
          onBlockClick={handleBlockClick}
          isLoading={isLoading}
        />
      );
    case 'day':
    case 'month':
      // Placeholder for other views - default to week view for now
      return (
        <CalendarWeekView
          date={currentDate}
          bookings={bookings}
          onDateChange={handleDateChange}
          onViewChange={handleViewChange}
          onBlockClick={handleBlockClick}
          isLoading={isLoading}
        />
      );
    default:
      return null;
  }
}
