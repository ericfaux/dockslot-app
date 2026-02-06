'use client';

import { useState, useMemo } from 'react';
import {
  X,
  CalendarX,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
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
  startOfDay,
  isAfter,
} from 'date-fns';

interface BlackoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (startDate: Date, endDate: Date | null, reason?: string) => Promise<void>;
  isPending?: boolean;
}

export function BlackoutModal({
  isOpen,
  onClose,
  onSubmit,
  isPending = false,
}: BlackoutModalProps) {
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  const today = startOfDay(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const prevMonth = subMonths(currentMonth, 1);
    if (isBefore(endOfMonth(prevMonth), today)) return;
    setCurrentMonth(prevMonth);
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    setError(null);

    if (!isRangeMode) {
      // Single date mode
      if (selectedDate && isSameDay(date, selectedDate)) {
        setSelectedDate(null);
      } else {
        setSelectedDate(date);
      }
    } else {
      // Range mode
      if (!rangeStart || (rangeStart && rangeEnd)) {
        // Start new range
        setRangeStart(date);
        setRangeEnd(null);
      } else {
        // Complete the range
        if (isBefore(date, rangeStart)) {
          // Clicked before start, swap
          setRangeEnd(rangeStart);
          setRangeStart(date);
        } else if (isSameDay(date, rangeStart)) {
          // Clicked same day, clear
          setRangeStart(null);
        } else {
          setRangeEnd(date);
        }
      }
    }
  };

  const handleModeToggle = () => {
    setIsRangeMode(!isRangeMode);
    // Clear selections when toggling mode
    setSelectedDate(null);
    setRangeStart(null);
    setRangeEnd(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!isRangeMode) {
      if (!selectedDate) {
        setError('Please select a date to block');
        return;
      }
      await onSubmit(selectedDate, null, reason.trim() || undefined);
    } else {
      if (!rangeStart) {
        setError('Please select a start date');
        return;
      }
      if (!rangeEnd) {
        setError('Please select an end date');
        return;
      }
      await onSubmit(rangeStart, rangeEnd, reason.trim() || undefined);
    }
  };

  const handleClose = () => {
    // Reset state
    setSelectedDate(null);
    setRangeStart(null);
    setRangeEnd(null);
    setReason('');
    setError(null);
    setIsRangeMode(false);
    onClose();
  };

  const isDateInRange = (date: Date): boolean => {
    if (!rangeStart) return false;
    if (!rangeEnd) return isSameDay(date, rangeStart);
    return (
      (isAfter(date, rangeStart) || isSameDay(date, rangeStart)) &&
      (isBefore(date, rangeEnd) || isSameDay(date, rangeEnd))
    );
  };

  const isRangeStart = (date: Date): boolean => {
    return rangeStart ? isSameDay(date, rangeStart) : false;
  };

  const isRangeEnd = (date: Date): boolean => {
    return rangeEnd ? isSameDay(date, rangeEnd) : false;
  };

  const getDateCount = (): number => {
    if (!isRangeMode) return selectedDate ? 1 : 0;
    if (!rangeStart || !rangeEnd) return rangeStart ? 1 : 0;
    return Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const hasSelection = isRangeMode ? !!rangeStart : !!selectedDate;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="pointer-events-auto w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
                <CalendarX className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Block Date{isRangeMode ? 's' : ''}</h2>
                <p className="text-sm text-slate-400">
                  Prevent bookings on selected date{isRangeMode ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-5 p-4">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {isRangeMode ? 'Date Range' : 'Single Date'}
                </span>
              </div>
              <button
                onClick={handleModeToggle}
                className="flex items-center gap-2 text-sm text-cyan-600 transition-colors hover:text-cyan-600"
              >
                {isRangeMode ? (
                  <ToggleRight className="h-5 w-5" />
                ) : (
                  <ToggleLeft className="h-5 w-5" />
                )}
                <span>{isRangeMode ? 'Range' : 'Single'}</span>
              </button>
            </div>

            {/* Mini Calendar */}
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              {/* Month Navigation */}
              <div className="mb-3 flex items-center justify-between">
                <button
                  onClick={handlePrevMonth}
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                  disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), today)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-slate-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Week Headers */}
              <div className="mb-1 grid grid-cols-7">
                {weekDays.map((day) => (
                  <div key={day} className="py-1 text-center text-xs text-slate-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isCurrentMonth = isSameMonth(date, currentMonth);
                  const isPast = isBefore(date, today);
                  const isDisabled = isPast;
                  const isSelected = !isRangeMode && selectedDate && isSameDay(date, selectedDate);
                  const inRange = isRangeMode && isDateInRange(date);
                  const isStart = isRangeMode && isRangeStart(date);
                  const isEnd = isRangeMode && isRangeEnd(date);
                  const isToday = isSameDay(date, today);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => !isDisabled && handleDateClick(date)}
                      disabled={isDisabled}
                      className={`
                        relative h-9 text-xs font-medium transition-all
                        ${!isCurrentMonth ? 'text-slate-700' : ''}
                        ${isCurrentMonth && isDisabled ? 'cursor-not-allowed text-slate-600' : ''}
                        ${isCurrentMonth && !isDisabled && !isSelected && !inRange ? 'text-slate-600 hover:bg-rose-50 hover:text-rose-600' : ''}
                        ${isSelected ? 'rounded bg-rose-500 text-white' : ''}
                        ${inRange && !isStart && !isEnd ? 'bg-rose-500/30 text-rose-600' : ''}
                        ${isStart ? 'rounded-l bg-rose-500 text-white' : ''}
                        ${isEnd ? 'rounded-r bg-rose-500 text-white' : ''}
                        ${isToday && !isSelected && !inRange ? 'ring-1 ring-cyan-500/50' : ''}
                      `}
                    >
                      {format(date, 'd')}
                    </button>
                  );
                })}
              </div>

              {/* Selection Summary */}
              {hasSelection && (
                <div className="mt-3 flex items-center justify-between rounded-md bg-slate-100 px-3 py-2">
                  <span className="text-xs text-slate-400">Selected:</span>
                  <span className="text-xs font-medium text-rose-600">
                    {!isRangeMode && selectedDate
                      ? format(selectedDate, 'MMM d, yyyy')
                      : rangeStart && rangeEnd
                      ? `${format(rangeStart, 'MMM d')} - ${format(rangeEnd, 'MMM d, yyyy')} (${getDateCount()} days)`
                      : rangeStart
                      ? `${format(rangeStart, 'MMM d, yyyy')} - Select end date`
                      : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Reason Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-600">
                Reason <span className="text-slate-500">(optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Boat maintenance, Personal day, Tournament..."
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                rows={2}
                maxLength={500}
              />
              <p className="text-xs text-slate-500">
                This will be shown when viewing the blocked date.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white p-4">
            <button
              onClick={handleClose}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !hasSelection || (isRangeMode && !!rangeStart && !rangeEnd)}
              className="flex items-center gap-2 rounded-lg bg-rose-50 px-6 py-2 font-medium text-rose-600 transition-colors hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Blocking...
                </>
              ) : (
                <>
                  <CalendarX className="h-4 w-4" />
                  Block {getDateCount() > 1 ? `${getDateCount()} Days` : 'Date'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
