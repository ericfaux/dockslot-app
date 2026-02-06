export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { format, parseISO } from 'date-fns';
import { Moon, Calendar } from 'lucide-react';
import Link from 'next/link';
import { ScheduleClient } from './ScheduleClient';
import { ExportBookingsButton } from './components/ExportBookingsButton';
import { HelpTooltip } from '@/components/HelpTooltip';

/**
 * Schedule Page - Server Component
 * Fetches captain ID and renders the client-side calendar
 */

export default async function SchedulePage() {
  const { user, supabase } = await requireAuth();

  // Get captain profile with hibernation info
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, timezone, is_hibernating, hibernation_end_date, hibernation_resume_time')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('[Schedule] Profile query failed for user:', user.id, profileError);
  }

  // Use fallback values if profile query fails - user is still authenticated
  const captainId = profile?.id ?? user.id;
  const captainTimezone = (profile?.timezone && profile.timezone !== "UTC") ? profile.timezone : "America/New_York";
  const isHibernating = profile?.is_hibernating ?? false;
  const hibernationEndDate = profile?.hibernation_end_date ?? null;
  const hibernationResumeTime = profile?.hibernation_resume_time ?? null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:h-screen">
      {/* Hibernation Banner */}
      {isHibernating && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Moon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="inline-flex items-center text-sm font-medium text-amber-200">
                Hibernation Mode Active
                <HelpTooltip text="Pause your booking page during off-season. Set a return date and we'll automatically resume accepting bookings." />
              </p>
              <p className="text-sm text-amber-200/70 mt-1">
                Your booking page is paused. New bookings cannot be created during hibernation.
                {hibernationEndDate && (
                  <>
                    {' '}Scheduled to resume on{' '}
                    <span className="font-medium text-amber-200">
                      {format(parseISO(hibernationEndDate), 'MMMM d, yyyy')}
                    </span>
                    {hibernationResumeTime && (
                      <> at {hibernationResumeTime}</>
                    )}
                    .
                  </>
                )}
              </p>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-600 mt-2 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Manage hibernation settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Schedule
          </span>
          <div className="h-px flex-1 bg-white sm:w-32" />
        </div>
        <ExportBookingsButton captainId={captainId} />
      </div>

      {/* Calendar */}
      <div className="min-h-0 flex-1">
        <ScheduleClient captainId={user.id} timezone={captainTimezone} isHibernating={isHibernating} hibernationEndDate={hibernationEndDate} />
      </div>
    </div>
  );
}
