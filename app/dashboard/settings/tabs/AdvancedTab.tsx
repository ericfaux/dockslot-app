'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Save,
  Anchor,
  ExternalLink,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Profile, SubscriptionTier } from '@/lib/db/types';
import { canUseFeature } from '@/lib/subscription/gates';
import { updateProfile } from '@/app/actions/profile';
import { CalendarExport } from '../components/CalendarExport';

interface AdvancedTabProps {
  initialProfile: Profile | null;
  calendarToken: string;
  subscriptionTier: SubscriptionTier;
}

export function AdvancedTab({ initialProfile, calendarToken, subscriptionTier }: AdvancedTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentCalendarToken, setCurrentCalendarToken] = useState(calendarToken);

  const [dockModeEnabled, setDockModeEnabled] = useState(initialProfile?.dock_mode_enabled ?? false);

  const hasChanges = useMemo(() => {
    return dockModeEnabled !== (initialProfile?.dock_mode_enabled ?? false);
  }, [dockModeEnabled, initialProfile]);

  const handleSave = () => {
    startTransition(async () => {
      setError(null);
      setSuccess(null);

      const result = await updateProfile({
        dock_mode_enabled: dockModeEnabled,
      });

      if (result.success) {
        setSuccess('Advanced settings saved successfully');
        router.refresh();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to save advanced settings');
      }
    });
  };

  const handleRegenerateCalendarToken = async () => {
    try {
      const response = await fetch('/api/calendar/regenerate', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate token');
      }

      const data = await response.json();
      setCurrentCalendarToken(data.calendarToken);
      setSuccess('Calendar token regenerated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to regenerate calendar token');
      setTimeout(() => setError(null), 3000);
    }
  };

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

      {/* Dock Mode */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <Anchor className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Dock Mode</h2>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          A simplified, high-contrast interface for use while on the water. Large text, big buttons, and only essential trip info.
        </p>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                checked={dockModeEnabled}
                onChange={(e) => setDockModeEnabled(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`h-6 w-11 rounded-full transition-colors ${
                  dockModeEnabled ? 'bg-cyan-500' : 'bg-slate-100'
                }`}
              >
                <div
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    dockModeEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
            <span className="text-sm text-slate-600">
              {dockModeEnabled ? 'Dock Mode is available' : 'Dock Mode is disabled'}
            </span>
          </label>
          {dockModeEnabled && (
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-50 p-4">
              <p className="text-sm text-cyan-600 mb-3">
                When enabled, a &quot;Dock Mode&quot; button will appear on your dashboard. You can also access it directly at:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-white px-3 py-2 text-sm text-slate-600 font-mono">
                  /dock
                </code>
                <a
                  href="/dock"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
                >
                  <span>Open</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Designed for sun glare, wet hands, and quick reference. Perfect for dockside use.
              </p>
            </div>
          )}
        </div>

        {/* Save Dock Mode */}
        <div className="mt-6 flex items-center justify-end gap-3">
          {hasChanges && (
            <div className="flex items-center gap-1.5 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              Unsaved changes
            </div>
          )}
          <button
            onClick={handleSave}
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
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </section>

      {/* Calendar Export */}
      <section className={sectionClassName}>
        <CalendarExport
          calendarToken={currentCalendarToken}
          onRegenerate={handleRegenerateCalendarToken}
        />
      </section>

      {/* Data Export */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Data Export</h2>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Export your data for backup or migration purposes.
        </p>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">
            Data export functionality is coming soon. You can currently export your calendar data using the Calendar Export section above.
          </p>
        </div>
      </section>
    </div>
  );
}
