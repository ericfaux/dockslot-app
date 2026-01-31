'use client';

import { useState, useMemo } from 'react';
import {
  X,
  CloudRain,
  Calendar,
  Clock,
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Trash2,
  Waves,
} from 'lucide-react';
import {
  format,
  parseISO,
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
  addDays,
  differenceInHours,
} from 'date-fns';
import { CalendarBooking } from './types';

interface RescheduleSlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface WeatherHoldModalProps {
  booking: CalendarBooking;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, slots: RescheduleSlot[]) => Promise<void>;
  isPending?: boolean;
}

const TIME_OPTIONS = [
  '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

function formatTime12(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function WeatherHoldModal({
  booking,
  isOpen,
  onClose,
  onSubmit,
  isPending = false,
}: WeatherHoldModalProps) {
  const [reason, setReason] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<RescheduleSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingWeather, setIsCheckingWeather] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState<string | null>(null);

  // Calculate original booking duration
  const bookingDurationMinutes = useMemo(() => {
    const start = parseISO(booking.scheduled_start);
    const end = parseISO(booking.scheduled_end);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }, [booking]);

  // Get default start time from original booking
  const defaultStartTime = useMemo(() => {
    const start = parseISO(booking.scheduled_start);
    return format(start, 'HH:mm');
  }, [booking]);

  // Check if trip is within 24 hours
  const hoursUntilTrip = useMemo(() => {
    const now = new Date();
    const tripStart = parseISO(booking.scheduled_start);
    return differenceInHours(tripStart, now);
  }, [booking]);

  const isUrgent = hoursUntilTrip < 24 && hoursUntilTrip > 0;

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
    const dateStr = format(date, 'yyyy-MM-dd');

    // Check if date is already selected
    const existingIndex = selectedSlots.findIndex(s => s.date === dateStr);
    if (existingIndex >= 0) {
      // Remove the date
      setSelectedSlots(prev => prev.filter((_, i) => i !== existingIndex));
      if (activeSlotIndex === existingIndex) {
        setActiveSlotIndex(null);
      } else if (activeSlotIndex !== null && activeSlotIndex > existingIndex) {
        setActiveSlotIndex(activeSlotIndex - 1);
      }
      return;
    }

    // Can't add more than 3
    if (selectedSlots.length >= 3) {
      setError('Maximum 3 alternate dates allowed');
      return;
    }

    // Add new slot with default time
    const newSlot: RescheduleSlot = {
      date: dateStr,
      startTime: defaultStartTime,
      endTime: calculateEndTime(defaultStartTime, bookingDurationMinutes),
    };
    setSelectedSlots(prev => [...prev, newSlot]);
    setActiveSlotIndex(selectedSlots.length);
    setError(null);
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const handleTimeChange = (index: number, startTime: string) => {
    setSelectedSlots(prev => prev.map((slot, i) => {
      if (i !== index) return slot;
      return {
        ...slot,
        startTime,
        endTime: calculateEndTime(startTime, bookingDurationMinutes),
      };
    }));
  };

  const handleRemoveSlot = (index: number) => {
    setSelectedSlots(prev => prev.filter((_, i) => i !== index));
    if (activeSlotIndex === index) {
      setActiveSlotIndex(null);
    } else if (activeSlotIndex !== null && activeSlotIndex > index) {
      setActiveSlotIndex(activeSlotIndex - 1);
    }
  };

  const handleCheckWeather = async () => {
    setIsCheckingWeather(true);
    setError(null);
    setWeatherInfo(null);

    try {
      // For demo: using approximate coordinates for US coastal waters
      // In production, captain's meeting_spot should have lat/lon stored
      const lat = 28.0; // Example: Florida coast
      const lon = -80.0;
      const tripDate = booking.scheduled_start;

      const response = await fetch(
        `/api/weather/check?lat=${lat}&lon=${lon}&date=${tripDate}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check weather');
      }

      const data = await response.json();

      if (data.conditions.recommendation !== 'safe') {
        // Auto-fill reason with NOAA data
        setReason(data.suggestedReason);
        setWeatherInfo(`⚠️ ${data.conditions.recommendation.toUpperCase()}: ${data.conditions.alerts.length} active alerts`);
      } else {
        setWeatherInfo('✅ No marine weather alerts currently active');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check weather');
    } finally {
      setIsCheckingWeather(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please enter a weather reason');
      return;
    }

    if (selectedSlots.length === 0) {
      setError('Please select at least one alternate date');
      return;
    }

    setError(null);
    await onSubmit(reason.trim(), selectedSlots);
  };

  const isDateSelected = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return selectedSlots.some(s => s.date === dateStr);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                <CloudRain className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Weather Hold</h2>
                <p className="text-sm text-slate-400">
                  {booking.guest_name} &bull; {format(parseISO(booking.scheduled_start), 'MMM d')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Urgent Warning */}
            {isUrgent && (
              <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-300">Trip is in less than 24 hours</p>
                  <p className="text-sm text-amber-400/80 mt-1">
                    This trip is scheduled to depart in {hoursUntilTrip} hours.
                    Consider calling the guest directly for urgent rescheduling.
                  </p>
                </div>
              </div>
            )}

            {/* Weather Reason */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-300">
                  Weather Reason <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleCheckWeather}
                  disabled={isCheckingWeather}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
                >
                  {isCheckingWeather ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Waves className="h-3.5 w-3.5" />
                      Check NOAA Weather
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Small craft advisory issued, winds 20-25 knots expected..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                rows={3}
              />
              {weatherInfo && (
                <div className="flex items-start gap-2 rounded-md bg-slate-800/50 px-3 py-2 text-xs">
                  <span className="text-slate-300">{weatherInfo}</span>
                </div>
              )}
              <p className="text-xs text-slate-500">
                This message will be shown to the guest when they view reschedule options.
              </p>
            </div>

            {/* Date Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-300">
                  Alternate Dates <span className="text-rose-400">*</span>
                  <span className="ml-2 text-slate-500 font-normal">
                    ({selectedSlots.length}/3 selected)
                  </span>
                </label>
              </div>

              {/* Mini Calendar */}
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), today)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Week Headers */}
                <div className="grid grid-cols-7 mb-1">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-xs text-slate-500 py-1">
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
                    const isSelected = isDateSelected(date);
                    const isOriginalDate = isSameDay(date, parseISO(booking.scheduled_start));
                    const isDisabled = isPast || isOriginalDate;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => !isDisabled && handleDateClick(date)}
                        disabled={isDisabled}
                        className={`
                          relative h-8 rounded text-xs font-medium transition-all
                          ${!isCurrentMonth ? 'text-slate-700' : ''}
                          ${isCurrentMonth && isDisabled ? 'text-slate-600 cursor-not-allowed' : ''}
                          ${isCurrentMonth && !isDisabled && !isSelected ? 'text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-400' : ''}
                          ${isSelected ? 'bg-cyan-500 text-white' : ''}
                          ${isOriginalDate ? 'ring-1 ring-amber-500/50 text-amber-400' : ''}
                        `}
                        title={isOriginalDate ? 'Original trip date' : undefined}
                      >
                        {format(date, 'd')}
                        {isSelected && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-cyan-400 text-[8px] text-slate-900 font-bold">
                            {selectedSlots.findIndex(s => s.date === dateStr) + 1}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Slots with Time Pickers */}
              {selectedSlots.length > 0 && (
                <div className="space-y-2">
                  {selectedSlots.map((slot, index) => (
                    <div
                      key={slot.date}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        activeSlotIndex === index
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 bg-slate-800/50'
                      }`}
                      onClick={() => setActiveSlotIndex(index)}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm font-medium text-white">
                            {format(parseISO(slot.date + 'T12:00:00'), 'EEEE, MMM d')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <select
                            value={slot.startTime}
                            onChange={(e) => handleTimeChange(index, e.target.value)}
                            className="rounded border border-slate-600 bg-slate-700 px-2 py-0.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option key={time} value={time}>
                                {formatTime12(time)}
                              </option>
                            ))}
                          </select>
                          <span className="text-xs text-slate-400">
                            - {formatTime12(slot.endTime)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSlot(index);
                        }}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guest Message Preview */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                <Mail className="inline h-4 w-4 mr-1.5" />
                Guest Will See
              </label>
              <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                <div className="space-y-3 text-sm">
                  <p className="text-slate-300">
                    <span className="font-medium text-white">Hi {booking.guest_name.split(' ')[0]},</span>
                  </p>
                  <p className="text-slate-400">
                    Due to weather conditions, your charter trip on{' '}
                    <span className="text-white">
                      {format(parseISO(booking.scheduled_start), 'MMMM d')}
                    </span>{' '}
                    has been placed on weather hold.
                  </p>
                  {reason && (
                    <p className="text-slate-400 italic border-l-2 border-amber-500/50 pl-3">
                      &ldquo;{reason}&rdquo;
                    </p>
                  )}
                  {selectedSlots.length > 0 && (
                    <div className="text-slate-400">
                      <p className="mb-2">We&apos;ve prepared the following alternate dates for you:</p>
                      <ul className="space-y-1 ml-4">
                        {selectedSlots.map((slot, i) => (
                          <li key={slot.date} className="text-cyan-400">
                            &bull; {format(parseISO(slot.date + 'T12:00:00'), 'EEEE, MMMM d')} at{' '}
                            {formatTime12(slot.startTime)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-400">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-700 bg-slate-900 p-4">
            <button
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !reason.trim() || selectedSlots.length === 0}
              className="flex items-center gap-2 rounded-lg bg-amber-500/20 px-6 py-2 font-medium text-amber-400 transition-colors hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CloudRain className="h-4 w-4" />
                  Place on Weather Hold
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
