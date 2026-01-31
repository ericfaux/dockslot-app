// components/booking/DateSlotPicker.tsx
// Custom date + time slot picker for charter bookings
// Mobile-first, integrates with captain's availability windows

'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle } from 'lucide-react';

interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  available: boolean;
}

interface DateSlotPickerProps {
  captainId: string;
  tripTypeId: string;
  tripDuration: number; // hours
  onSlotSelect: (date: Date, startTime: string, endTime: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
}

export function DateSlotPicker({
  captainId,
  tripTypeId,
  tripDuration,
  onSlotSelect,
  selectedDate,
  selectedTime,
}: DateSlotPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availabilityData, setAvailabilityData] = useState<Record<string, TimeSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch availability for current month
  useEffect(() => {
    async function fetchAvailability() {
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
    }

    fetchAvailability();
  }, [captainId, tripTypeId, currentMonth]);

  // Generate calendar days for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for calendar grid
  const startDayOfWeek = monthStart.getDay(); // 0 = Sunday
  const paddingDays = Array(startDayOfWeek).fill(null);

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };

  // Check if a date has availability
  const hasAvailability = (date: Date): boolean => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const slots = availabilityData[dateKey];
    return slots ? slots.some(slot => slot.available) : false;
  };

  // Get slots for selected date
  const selectedDateSlots = selectedDate 
    ? availabilityData[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-100"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-slate-100">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
        </div>

        <button
          onClick={goToNextMonth}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-100"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div>
        {/* Day names */}
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Padding days */}
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}

          {/* Actual days */}
          {daysInMonth.map((date) => {
            const isPast = isBefore(date, startOfDay(new Date()));
            const hasSlots = hasAvailability(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => hasSlots && !isPast ? onSlotSelect(date, '', '') : null}
                disabled={isPast || !hasSlots || loading}
                className={`
                  aspect-square rounded-lg border text-sm font-medium transition-all
                  ${isPast ? 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-700' : ''}
                  ${!hasSlots && !isPast ? 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600' : ''}
                  ${hasSlots && !isPast && !isSelected ? 'border-slate-700 bg-slate-800 text-slate-100 hover:border-cyan-500 hover:bg-slate-700' : ''}
                  ${isSelected ? 'border-cyan-500 bg-cyan-500/20 text-cyan-100 ring-2 ring-cyan-500/50' : ''}
                  ${isTodayDate && !isSelected ? 'border-cyan-600/50' : ''}
                `}
              >
                <div className="flex h-full flex-col items-center justify-center">
                  <span>{format(date, 'd')}</span>
                  {hasSlots && !isPast && (
                    <div className="mt-1 h-1 w-1 rounded-full bg-cyan-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots Section */}
      {selectedDate && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            <h4 className="font-semibold text-slate-100">
              Available Times on {format(selectedDate, 'MMM d, yyyy')}
            </h4>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">
              Loading availability...
            </div>
          ) : selectedDateSlots.length === 0 ? (
            <div className="flex items-center gap-2 py-8 text-center text-sm text-slate-400">
              <AlertCircle className="h-4 w-4" />
              <span>No available time slots for this date</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {selectedDateSlots
                .filter(slot => slot.available)
                .map((slot, index) => {
                  const isSelectedTime = selectedTime === slot.start;
                  
                  return (
                    <button
                      key={`${slot.start}-${index}`}
                      onClick={() => onSlotSelect(selectedDate, slot.start, slot.end)}
                      className={`
                        rounded-lg border px-4 py-3 text-sm font-medium transition-all
                        ${isSelectedTime 
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-100 ring-2 ring-cyan-500/50' 
                          : 'border-slate-700 bg-slate-900 text-slate-100 hover:border-cyan-500 hover:bg-slate-700'
                        }
                      `}
                    >
                      {slot.start}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper Text */}
      {!selectedDate && !error && (
        <div className="text-center text-sm text-slate-500">
          Select a date to view available time slots
        </div>
      )}
    </div>
  );
}
