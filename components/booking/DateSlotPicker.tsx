// components/booking/DateSlotPicker.tsx
// Custom date + time slot picker for charter bookings (light theme)
// Mobile-first, integrates with captain's availability windows
// Optimized for touch with 44px+ tap targets

'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { CalendarSkeleton, TimeSlotsSkeleton } from './BookingSkeleton';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface DateSlotPickerProps {
  captainId: string;
  tripTypeId: string;
  tripDuration: number;
  onSlotSelect: (date: Date, startTime: string, endTime: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
  timezone?: string;
  onDateSelect?: (date: Date) => void;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return minutes === 0
    ? `${displayHours} ${period}`
    : `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function getDurationText(start: string, end: string): string {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const durationMinutes = endMinutes - startMinutes;
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;

  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${hours}h ${mins}m`;
}

export function DateSlotPicker({
  captainId,
  tripTypeId,
  tripDuration,
  onSlotSelect,
  selectedDate,
  selectedTime,
  timezone,
  onDateSelect,
}: DateSlotPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availabilityData, setAvailabilityData] = useState<Record<string, TimeSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/availability/${captainId}/${tripTypeId}?month=${format(currentMonth, 'yyyy-MM')}`
      );

      if (!response.ok) {
        throw new Error('Failed to load availability');
      }

      const data = await response.json();
      setAvailabilityData(data.availability || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [captainId, tripTypeId, currentMonth]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array(startDayOfWeek).fill(null);

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const hasAvailability = (date: Date): boolean => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const slots = availabilityData[dateKey];
    return slots ? slots.some(slot => slot.available) : false;
  };

  const getSlotCount = (date: Date): number => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const slots = availabilityData[dateKey];
    return slots ? slots.filter(slot => slot.available).length : 0;
  };

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
    onSlotSelect(date, '', '');
  };

  const selectedDateSlots = selectedDate
    ? availabilityData[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const availableSlots = selectedDateSlots.filter(slot => slot.available);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchAvailability();
  };

  const isCurrentMonth = isSameDay(startOfMonth(currentMonth), startOfMonth(new Date()));

  return (
    <div className="space-y-6">
      {/* Timezone indicator */}
      {timezone && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          <span>Times shown in {timezone.replace(/_/g, ' ')}</span>
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          disabled={isCurrentMonth}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
        </div>

        <button
          onClick={goToNextMonth}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <CalendarSkeleton />
      ) : (
        <div>
          {/* Day names */}
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
            <div>S</div>
            <div>M</div>
            <div>T</div>
            <div>W</div>
            <div>T</div>
            <div>F</div>
            <div>S</div>
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1.5">
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[48px]" aria-hidden="true" />
            ))}

            {daysInMonth.map((date) => {
              const isPast = isBefore(date, startOfDay(new Date()));
              const hasSlots = hasAvailability(date);
              const slotCount = getSlotCount(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => hasSlots && !isPast && handleDateClick(date)}
                  disabled={isPast || !hasSlots}
                  aria-label={`${format(date, 'MMMM d')}${hasSlots ? `, ${slotCount} slots available` : ', no availability'}`}
                  aria-pressed={isSelected}
                  className={`
                    relative min-h-[48px] rounded-xl border text-sm font-medium transition-all
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-white
                    ${isPast ? 'cursor-not-allowed border-transparent bg-slate-50 text-slate-300' : ''}
                    ${!hasSlots && !isPast ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400' : ''}
                    ${hasSlots && !isPast && !isSelected ? 'border-slate-200 bg-white text-slate-900 hover:border-cyan-400 hover:bg-cyan-50 active:scale-95 shadow-sm' : ''}
                    ${isSelected ? 'border-cyan-600 bg-cyan-600 text-white ring-2 ring-cyan-200' : ''}
                    ${isTodayDate && !isSelected ? 'border-cyan-300' : ''}
                  `}
                >
                  <div className="flex h-full flex-col items-center justify-center py-2">
                    <span className={isTodayDate && !isSelected ? 'text-cyan-700 font-bold' : ''}>
                      {format(date, 'd')}
                    </span>
                    {hasSlots && !isPast && (
                      <div className="mt-0.5 flex gap-0.5">
                        {slotCount <= 3 ? (
                          Array.from({ length: Math.min(slotCount, 3) }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 w-1 rounded-full ${
                                isSelected ? 'bg-white/70' : 'bg-emerald-500'
                              }`}
                            />
                          ))
                        ) : (
                          <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-emerald-600'}`}>
                            {slotCount}+
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-slate-200" />
              <span>Unavailable</span>
            </div>
          </div>
        </div>
      )}

      {/* Time Slots Section */}
      {selectedDate && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-600" />
              <h4 className="font-semibold text-slate-900">
                {format(selectedDate, 'EEEE, MMMM d')}
              </h4>
            </div>
            {availableSlots.length > 0 && (
              <span className="text-xs text-slate-500">
                {availableSlots.length} {availableSlots.length === 1 ? 'slot' : 'slots'}
              </span>
            )}
          </div>

          {slotsLoading ? (
            <TimeSlotsSkeleton />
          ) : availableSlots.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertCircle className="h-8 w-8 text-slate-300" />
              <div>
                <p className="text-sm font-medium text-slate-500">
                  No available time slots
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try selecting a different date
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {availableSlots.map((slot, index) => {
                const isSelectedTime = selectedTime === slot.start;
                const duration = getDurationText(slot.start, slot.end);

                return (
                  <button
                    key={`${slot.start}-${index}`}
                    onClick={() => onSlotSelect(selectedDate, slot.start, slot.end)}
                    aria-pressed={isSelectedTime}
                    className={`
                      relative flex flex-col items-start rounded-xl border p-4 text-left
                      transition-all min-h-[72px]
                      focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                      active:scale-[0.98]
                      ${isSelectedTime
                        ? 'border-cyan-600 bg-cyan-50 ring-2 ring-cyan-200'
                        : 'border-slate-200 bg-white hover:border-cyan-400 hover:bg-cyan-50/50 shadow-sm'
                      }
                    `}
                  >
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-lg font-semibold ${
                        isSelectedTime ? 'text-cyan-800' : 'text-slate-900'
                      }`}>
                        {formatTime(slot.start)}
                      </span>
                      <span className={`text-sm ${isSelectedTime ? 'text-cyan-600' : 'text-slate-400'}`}>
                        - {formatTime(slot.end)}
                      </span>
                    </div>

                    <span className={`text-xs mt-1 ${
                      isSelectedTime ? 'text-cyan-600' : 'text-slate-400'
                    }`}>
                      {duration}
                    </span>

                    {isSelectedTime && (
                      <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-cyan-600 flex items-center justify-center">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Error Message with Retry */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">
                Unable to load availability
              </p>
              <p className="text-xs text-red-500 mt-1">
                {error}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Helper Text */}
      {!selectedDate && !error && !loading && (
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Tap a highlighted date to see available times
          </p>
        </div>
      )}

      {/* Selected slot summary */}
      {selectedDate && selectedTime && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
              <Calendar className="h-5 w-5 text-cyan-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-cyan-900">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-xs text-cyan-700">
                {formatTime(selectedTime)} - {tripDuration} hour trip
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
