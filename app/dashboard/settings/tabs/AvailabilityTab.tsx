'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Save,
  Calendar as CalendarIcon,
  AlertCircle,
} from 'lucide-react';
import { Profile, AvailabilityWindow } from '@/lib/db/types';
import { updateProfile } from '@/app/actions/profile';
import { AvailabilitySettings } from '../AvailabilitySettings';

interface AvailabilityTabProps {
  initialProfile: Profile | null;
  initialAvailabilityWindows: AvailabilityWindow[];
}

export function AvailabilityTab({ initialProfile, initialAvailabilityWindows }: AvailabilityTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [bookingBufferMinutes, setBookingBufferMinutes] = useState(initialProfile?.booking_buffer_minutes ?? 30);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(initialProfile?.advance_booking_days ?? 30);
  const [seasonRevenueGoal, setSeasonRevenueGoal] = useState(
    (initialProfile?.season_revenue_goal_cents ?? 0) / 100
  );

  const hasChanges = useMemo(() => {
    return (
      bookingBufferMinutes !== (initialProfile?.booking_buffer_minutes ?? 30) ||
      advanceBookingDays !== (initialProfile?.advance_booking_days ?? 30) ||
      seasonRevenueGoal !== ((initialProfile?.season_revenue_goal_cents ?? 0) / 100)
    );
  }, [bookingBufferMinutes, advanceBookingDays, seasonRevenueGoal, initialProfile]);

  const handleSaveBookingSettings = () => {
    startTransition(async () => {
      setError(null);
      setSuccess(null);

      const result = await updateProfile({
        booking_buffer_minutes: bookingBufferMinutes,
        advance_booking_days: advanceBookingDays,
        season_revenue_goal_cents: Math.round(seasonRevenueGoal * 100),
      });

      if (result.success) {
        setSuccess('Booking settings saved successfully');
        router.refresh();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to save booking settings');
      }
    });
  };

  const inputClassName = "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500";
  const labelClassName = "block text-sm font-medium text-slate-600 mb-1.5";
  const sectionClassName = "rounded-xl border border-slate-200 bg-white p-6";

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
          {success}
        </div>
      )}

      {/* Weekly Availability — this component has its own save button */}
      <AvailabilitySettings initialWindows={initialAvailabilityWindows} />

      {/* Booking Settings */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Booking Settings</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bookingBufferMinutes" className={labelClassName}>
              Buffer Between Trips (minutes)
            </label>
            <input
              id="bookingBufferMinutes"
              type="number"
              min="0"
              max="1440"
              value={bookingBufferMinutes}
              onChange={(e) => setBookingBufferMinutes(parseInt(e.target.value) || 0)}
              className={inputClassName}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Minimum time between the end of one trip and the start of the next.
            </p>
          </div>
          <div>
            <label htmlFor="advanceBookingDays" className={labelClassName}>
              Advance Booking Window (days)
            </label>
            <input
              id="advanceBookingDays"
              type="number"
              min="1"
              max="365"
              value={advanceBookingDays}
              onChange={(e) => setAdvanceBookingDays(parseInt(e.target.value) || 1)}
              className={inputClassName}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              How far in advance guests can book trips.
            </p>
          </div>
          <div>
            <label htmlFor="seasonRevenueGoal" className={labelClassName}>
              Season Revenue Goal ($)
            </label>
            <input
              id="seasonRevenueGoal"
              type="number"
              min="0"
              step="100"
              value={seasonRevenueGoal || ''}
              onChange={(e) => setSeasonRevenueGoal(parseFloat(e.target.value) || 0)}
              placeholder="10000"
              className={inputClassName}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Your revenue target for the season. Shown on the dashboard fuel gauge.
            </p>
          </div>
        </div>

        {/* Save Booking Settings */}
        <div className="mt-6 flex items-center justify-end gap-3">
          {hasChanges && (
            <div className="flex items-center gap-1.5 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              Unsaved changes
            </div>
          )}
          <button
            onClick={handleSaveBookingSettings}
            disabled={isPending || !hasChanges}
            className="group flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-all duration-75 hover:bg-cyan-500 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              boxShadow: hasChanges ? '0 4px 14px rgba(34, 211, 238, 0.25)' : undefined,
            }}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isPending ? 'Saving...' : 'Save Booking Settings'}
          </button>
        </div>
      </section>
    </div>
  );
}
