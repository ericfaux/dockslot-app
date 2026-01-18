'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Ban, CalendarOff } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isBefore,
  isAfter,
  startOfDay,
  addDays,
} from 'date-fns';

export interface DateAvailability {
  date: string;
  has_availability: boolean;
  is_blackout?: boolean;
  blackout_reason?: string | null;
  has_active_window?: boolean;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
  display_start?: string;
  display_end?: string;
}

interface DatePickerProps {
  availableDates: DateAvailability[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  timeSlots?: TimeSlot[];
  selectedTime?: string | null;
  onSelectTime?: (time: string) => void;
  isLoadingSlots?: boolean;
  maxAdvanceDays?: number;
  selectedDateInfo?: {
    is_blackout?: boolean;
    blackout_reason?: string | null;
    has_active_window?: boolean;
  } | null;
  /** When true, hides the internal time slots panel (use when pairing with external TimeSlotPicker) */
  hideTimeSlots?: boolean;
}

export function DatePicker({
  availableDates,
  selectedDate,
  onSelectDate,
  timeSlots = [],
  selectedTime = null,
  onSelectTime,
  isLoadingSlots = false,
  maxAdvanceDays = 60,
  selectedDateInfo,
  hideTimeSlots = false,
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Create maps for quick lookup of date availability info
  const { availabilityMap, blackoutMap, activeWindowMap } = useMemo(() => {
    const availability = new Map<string, boolean>();
    const blackout = new Map<string, string | null>();
    const activeWindow = new Map<string, boolean>();

    for (const d of availableDates) {
      availability.set(d.date, d.has_availability);
      if (d.is_blackout) {
        blackout.set(d.date, d.blackout_reason || null);
      }
      if (d.has_active_window !== undefined) {
        activeWindow.set(d.date, d.has_active_window);
      }
    }

    return { availabilityMap: availability, blackoutMap: blackout, activeWindowMap: activeWindow };
  }, [availableDates]);

  const today = startOfDay(new Date());
  const maxDate = addDays(today, maxAdvanceDays);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const prevMonth = subMonths(currentMonth, 1);
    // Don't allow going to past months
    if (isBefore(endOfMonth(prevMonth), today)) return;
    setCurrentMonth(prevMonth);
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDateSelectable = (date: Date) => {
    if (isBefore(date, today)) return false;
    if (isAfter(date, maxDate)) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return availabilityMap.get(dateStr) === true;
  };

  const getDateStatus = (date: Date): {
    selectable: boolean;
    isBlackout: boolean;
    blackoutReason: string | null;
    hasActiveWindow: boolean;
    isPast: boolean;
    isBeyondWindow: boolean;
  } => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isPast = isBefore(date, today);
    const isBeyondWindow = isAfter(date, maxDate);
    const isBlackout = blackoutMap.has(dateStr);
    const hasActiveWindow = activeWindowMap.get(dateStr) ?? true; // Default to true if not specified

    return {
      selectable: !isPast && !isBeyondWindow && !isBlackout && hasActiveWindow && availabilityMap.get(dateStr) === true,
      isBlackout,
      blackoutReason: blackoutMap.get(dateStr) || null,
      hasActiveWindow,
      isPast,
      isBeyondWindow,
    };
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`flex flex-col ${hideTimeSlots ? '' : 'lg:flex-row'} gap-6`}>
      {/* Calendar */}
      <div className={hideTimeSlots ? 'w-full' : 'flex-1'}>
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), today)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Week Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-slate-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isSelected = selectedDate === dateStr;
              const isSelectable = isDateSelectable(date);
              const isToday = isSameDay(date, today);
              const status = getDateStatus(date);

              // Determine visual style based on date status
              let buttonStyle = '';
              let indicator = null;

              if (!isCurrentMonth) {
                buttonStyle = 'text-slate-700';
              } else if (status.isPast) {
                buttonStyle = 'text-slate-600 cursor-not-allowed opacity-50';
              } else if (status.isBeyondWindow) {
                buttonStyle = 'text-slate-600 cursor-not-allowed opacity-40';
              } else if (status.isBlackout) {
                buttonStyle = 'text-slate-500 cursor-not-allowed bg-rose-500/5';
                indicator = (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-rose-400/60"
                    title={status.blackoutReason || 'Blocked out'}
                  />
                );
              } else if (!status.hasActiveWindow) {
                buttonStyle = 'text-slate-600 cursor-not-allowed opacity-50';
              } else if (isSelected) {
                buttonStyle = 'bg-cyan-500 text-white hover:bg-cyan-600';
              } else if (isSelectable) {
                buttonStyle = 'text-white hover:bg-cyan-500/20 hover:text-cyan-400 cursor-pointer';
                indicator = (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                );
              } else {
                buttonStyle = 'text-slate-600 cursor-not-allowed';
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => isSelectable && onSelectDate(dateStr)}
                  disabled={!isSelectable}
                  className={`
                    relative h-10 sm:h-12 rounded-md text-sm font-medium transition-all
                    ${buttonStyle}
                    ${isToday && !isSelected ? 'ring-1 ring-cyan-500/50' : ''}
                  `}
                  title={
                    status.isBlackout
                      ? `Blocked: ${status.blackoutReason || 'Not available'}`
                      : !status.hasActiveWindow
                      ? 'No availability on this day'
                      : status.isBeyondWindow
                      ? 'Too far in advance'
                      : status.isPast
                      ? 'Past date'
                      : undefined
                  }
                >
                  <span>{format(date, 'd')}</span>
                  {indicator}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-4 h-4 rounded-md bg-cyan-500" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-rose-400/60" />
              <span>Blocked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Slots - hidden when using external TimeSlotPicker */}
      {!hideTimeSlots && (
        <div className="lg:w-72">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {selectedDate
                ? `Times for ${format(new Date(selectedDate + 'T12:00:00'), 'MMM d')}`
                : 'Select a date'}
            </h3>

            {!selectedDate && (
              <p className="text-sm text-slate-400">
                Choose a date from the calendar to see available times.
              </p>
            )}

            {selectedDate && isLoadingSlots && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
              </div>
            )}

            {selectedDate && !isLoadingSlots && timeSlots.length === 0 && (
              <div className="text-sm">
                {selectedDateInfo?.is_blackout ? (
                  <div className="flex items-start gap-2">
                    <Ban className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-300 font-medium">Date blocked out</p>
                      {selectedDateInfo.blackout_reason && (
                        <p className="text-slate-500 mt-1">{selectedDateInfo.blackout_reason}</p>
                      )}
                    </div>
                  </div>
                ) : selectedDateInfo?.has_active_window === false ? (
                  <div className="flex items-start gap-2">
                    <CalendarOff className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-400">Captain doesn&apos;t operate on this day</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400">
                    No available times for this date. All slots may be booked.
                  </p>
                )}
              </div>
            )}

            {selectedDate && !isLoadingSlots && timeSlots.length > 0 && onSelectTime && (
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.start_time}
                    onClick={() => slot.available && onSelectTime(slot.start_time)}
                    disabled={!slot.available}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium transition-all
                      ${!slot.available ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed line-through' : ''}
                      ${slot.available && selectedTime !== slot.start_time ? 'bg-slate-800 text-white hover:bg-cyan-500/20 hover:text-cyan-400' : ''}
                      ${selectedTime === slot.start_time ? 'bg-cyan-500 text-white' : ''}
                    `}
                  >
                    {formatTime(slot.start_time)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
