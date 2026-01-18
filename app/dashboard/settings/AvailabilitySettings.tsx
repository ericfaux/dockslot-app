'use client';

import { useState, useTransition, useEffect } from 'react';
import { Loader2, Clock, Save, AlertCircle } from 'lucide-react';
import { AvailabilityWindow } from '@/lib/db/types';
import { upsertAvailabilityWindows } from '@/app/actions/availability';

interface AvailabilitySettingsProps {
  initialWindows: AvailabilityWindow[];
}

interface AvailabilityWindowInput {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_START_TIME = '06:00:00';
const DEFAULT_END_TIME = '21:00:00';

function getDefaultAvailabilityWindows(): AvailabilityWindowInput[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day_of_week: day,
    start_time: DEFAULT_START_TIME,
    end_time: DEFAULT_END_TIME,
    is_active: day >= 1 && day <= 5, // Default: Monday-Friday active
  }));
}

// Generate time options for dropdown (every 30 minutes)
function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      const value = `${h}:${m}:00`;

      // Format label as 12-hour time
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const period = hour < 12 ? 'AM' : 'PM';
      const label = `${displayHour}:${m.padStart(2, '0')} ${period}`;

      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export function AvailabilitySettings({ initialWindows }: AvailabilitySettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Track if this is a first-time setup (no existing windows)
  const [isFirstTimeSetup] = useState(() => initialWindows.length === 0);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  // Initialize windows state from props or defaults
  const [windows, setWindows] = useState<AvailabilityWindowInput[]>(() => {
    if (initialWindows.length === 7) {
      // Use existing windows
      return initialWindows.map(w => ({
        id: w.id,
        day_of_week: w.day_of_week,
        start_time: w.start_time,
        end_time: w.end_time,
        is_active: w.is_active,
      }));
    }
    // Fill in missing days with defaults
    const defaults = getDefaultAvailabilityWindows();
    const existingByDay = new Map(initialWindows.map(w => [w.day_of_week, w]));

    return defaults.map(defaultWindow => {
      const existing = existingByDay.get(defaultWindow.day_of_week);
      if (existing) {
        return {
          id: existing.id,
          day_of_week: existing.day_of_week,
          start_time: existing.start_time,
          end_time: existing.end_time,
          is_active: existing.is_active,
        };
      }
      return defaultWindow;
    });
  });

  // Validate time ranges whenever windows change
  const [validationErrors, setValidationErrors] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    const errors = new Map<number, string>();
    windows.forEach(window => {
      if (window.is_active) {
        const startMinutes = timeToMinutes(window.start_time);
        const endMinutes = timeToMinutes(window.end_time);
        if (endMinutes <= startMinutes) {
          errors.set(window.day_of_week, 'End time must be after start time');
        }
      }
    });
    setValidationErrors(errors);
  }, [windows]);

  const hasValidationErrors = validationErrors.size > 0;

  const handleToggle = (dayOfWeek: number) => {
    setWindows(prev =>
      prev.map(w =>
        w.day_of_week === dayOfWeek ? { ...w, is_active: !w.is_active } : w
      )
    );
  };

  const handleTimeChange = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    setWindows(prev =>
      prev.map(w =>
        w.day_of_week === dayOfWeek ? { ...w, [field]: value } : w
      )
    );
  };

  const handleSave = () => {
    if (hasValidationErrors) {
      setError('Please fix the time validation errors before saving.');
      return;
    }

    startTransition(async () => {
      setError(null);
      setSuccess(null);

      const result = await upsertAvailabilityWindows(windows);

      if (result.success) {
        // Update local state with returned data (includes IDs)
        if (result.data) {
          setWindows(result.data.map(w => ({
            id: w.id,
            day_of_week: w.day_of_week,
            start_time: w.start_time,
            end_time: w.end_time,
            is_active: w.is_active,
          })));
        }
        setHasBeenSaved(true);
        setSuccess(isFirstTimeSetup && !hasBeenSaved
          ? 'Availability set up successfully! Guests can now book trips.'
          : 'Availability saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to save availability');
      }
    });
  };

  const inputClassName = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none";
  const sectionClassName = "rounded-xl border border-slate-800 bg-slate-900/50 p-6";

  return (
    <section className={sectionClassName}>
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Weekly Availability</h2>
      </div>
      <p className="mb-6 text-sm text-slate-400">
        Set your available hours for each day of the week. Guests can only book during these times.
      </p>

      {/* First-time setup banner */}
      {isFirstTimeSetup && !hasBeenSaved && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-300">
              Set up your availability to start accepting bookings
            </p>
            <p className="mt-1 text-xs text-amber-400/80">
              Review the default hours below and click &quot;Save Availability&quot; to enable your booking page.
              We&apos;ve pre-filled sensible defaults (6 AM - 9 PM, Monday off).
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* Availability Grid */}
      <div className="space-y-3">
        {windows.map(window => {
          const dayError = validationErrors.get(window.day_of_week);
          return (
            <div
              key={window.day_of_week}
              className={`flex flex-col gap-3 rounded-lg border p-4 transition-all sm:flex-row sm:items-center ${
                window.is_active
                  ? 'border-slate-700 bg-slate-800/50'
                  : 'border-slate-800 bg-slate-900/30'
              }`}
            >
              {/* Day Name & Toggle */}
              <div className="flex items-center gap-3 sm:w-40">
                <button
                  type="button"
                  onClick={() => handleToggle(window.day_of_week)}
                  className="relative"
                  aria-label={`Toggle ${DAY_NAMES[window.day_of_week]}`}
                >
                  <div
                    className={`h-6 w-11 rounded-full transition-colors ${
                      window.is_active ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        window.is_active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </button>
                <span
                  className={`font-medium ${
                    window.is_active ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {DAY_NAMES[window.day_of_week]}
                </span>
              </div>

              {/* Time Pickers */}
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 sm:sr-only">From</label>
                  <select
                    value={window.start_time}
                    onChange={(e) => handleTimeChange(window.day_of_week, 'start_time', e.target.value)}
                    disabled={!window.is_active}
                    className={inputClassName}
                    aria-label={`${DAY_NAMES[window.day_of_week]} start time`}
                  >
                    {TIME_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <span className={`text-sm ${window.is_active ? 'text-slate-400' : 'text-slate-600'}`}>
                  to
                </span>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 sm:sr-only">To</label>
                  <select
                    value={window.end_time}
                    onChange={(e) => handleTimeChange(window.day_of_week, 'end_time', e.target.value)}
                    disabled={!window.is_active}
                    className={inputClassName}
                    aria-label={`${DAY_NAMES[window.day_of_week]} end time`}
                  >
                    {TIME_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Validation Error */}
                {dayError && window.is_active && (
                  <span className="text-xs text-rose-400">{dayError}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending || hasValidationErrors}
          className="group flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-all duration-75 hover:bg-cyan-500 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            boxShadow: '0 4px 14px rgba(34, 211, 238, 0.25)',
          }}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending ? 'Saving...' : 'Save Availability'}
        </button>
      </div>
    </section>
  );
}

// Helper function to convert time to minutes for comparison
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
