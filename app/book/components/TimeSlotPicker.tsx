'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Loader2, Ban, CalendarOff, Clock } from 'lucide-react';
import { getTimezoneLabel } from '@/lib/utils/timezone';

// Slot type matching the API response
export interface AvailableSlot {
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  display_start: string; // Formatted time like "9:00 AM"
  display_end: string; // Formatted time like "1:00 PM"
}

interface DateInfo {
  is_blackout?: boolean;
  blackout_reason?: string | null;
  has_active_window?: boolean;
}

export interface TimeSlotPickerProps {
  captainId: string;
  tripTypeId: string;
  selectedDate: Date | null;
  onSlotSelect: (slot: AvailableSlot) => void;
  selectedSlot: AvailableSlot | null;
  /** Captain's IANA timezone (e.g. "America/New_York"). Displayed as a label in the header. */
  timezone?: string;
}

export function TimeSlotPicker({
  captainId,
  tripTypeId,
  selectedDate,
  onSlotSelect,
  selectedSlot,
  timezone,
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateInfo, setDateInfo] = useState<DateInfo | null>(null);

  // Fetch slots when selectedDate changes
  const fetchSlots = useCallback(async () => {
    if (!selectedDate || !captainId || !tripTypeId) {
      setSlots([]);
      setDateInfo(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(
        `/api/availability/${captainId}/${tripTypeId}?date=${dateStr}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        setSlots(result.data.slots || []);
        setDateInfo({
          is_blackout: result.data.date_info?.is_blackout,
          blackout_reason: result.data.date_info?.blackout_reason,
          has_active_window: result.data.date_info?.has_active_window,
        });
      } else {
        setSlots([]);
        setError(result.error || 'Failed to load available times');
      }
    } catch {
      setSlots([]);
      setError('Failed to load available times');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, captainId, tripTypeId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Check if a slot is currently selected
  const isSlotSelected = (slot: AvailableSlot): boolean => {
    if (!selectedSlot) return false;
    return (
      slot.start_time === selectedSlot.start_time &&
      slot.end_time === selectedSlot.end_time
    );
  };

  // Format date for display header
  const formatDateHeader = (date: Date): string => {
    return format(date, 'EEEE, MMM d');
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-5 w-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">
          {selectedDate ? formatDateHeader(selectedDate) : 'Select a Time'}
        </h3>
      </div>

      {/* Timezone indicator */}
      {timezone && (
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 mb-4 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          <span>All times shown in <span className="font-medium text-slate-300">{getTimezoneLabel(timezone)}</span></span>
        </div>
      )}

      {/* No date selected state */}
      {!selectedDate && (
        <div className="py-8 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
              <Clock className="h-6 w-6 text-slate-500" />
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Select a date to see available times
          </p>
        </div>
      )}

      {/* Loading state */}
      {selectedDate && isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          <span className="ml-2 text-sm text-slate-400">Loading times...</span>
        </div>
      )}

      {/* Error state */}
      {selectedDate && !isLoading && error && (
        <div className="py-8 text-center">
          <p className="text-sm text-rose-400">{error}</p>
          <button
            onClick={fetchSlots}
            className="mt-2 text-sm text-cyan-400 hover:text-cyan-300"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state - blackout or no window */}
      {selectedDate && !isLoading && !error && slots.length === 0 && (
        <div className="py-6">
          {dateInfo?.is_blackout ? (
            <div className="flex items-start gap-3">
              <Ban className="h-5 w-5 text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-slate-300 font-medium">Date blocked out</p>
                {dateInfo.blackout_reason && (
                  <p className="text-sm text-slate-500 mt-1">
                    {dateInfo.blackout_reason}
                  </p>
                )}
              </div>
            </div>
          ) : dateInfo?.has_active_window === false ? (
            <div className="flex items-start gap-3">
              <CalendarOff className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-slate-400">
                  Captain doesn&apos;t operate on this day
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-slate-400">
                No times available for this date
              </p>
              <p className="text-sm text-slate-500 mt-1">
                All slots may be booked
              </p>
            </div>
          )}
        </div>
      )}

      {/* Time slots grid */}
      {selectedDate && !isLoading && !error && slots.length > 0 && (
        <div className="space-y-4">
          {/* Slot grid - responsive layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
            {slots.map((slot) => {
              const selected = isSlotSelected(slot);
              return (
                <button
                  key={slot.start_time}
                  onClick={() => onSlotSelect(slot)}
                  className={`
                    min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-150 flex flex-col items-center justify-center
                    ${
                      selected
                        ? 'bg-cyan-500 text-white ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900'
                        : 'bg-slate-800 text-white hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/50'
                    }
                    border border-slate-700
                  `}
                >
                  <span className="font-semibold">{slot.display_start}</span>
                  {selected && (
                    <span className="text-xs text-cyan-100 mt-0.5">
                      to {slot.display_end}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected slot summary */}
          {selectedSlot && (
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Selected time:</span>
                <span className="text-white font-medium">
                  {selectedSlot.display_start} - {selectedSlot.display_end}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
