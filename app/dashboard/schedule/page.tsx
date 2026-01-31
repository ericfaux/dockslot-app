export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { ScheduleClient } from './ScheduleClient';
import { ExportBookingsButton } from './components/ExportBookingsButton';

/**
 * Schedule Page - Server Component
 * Fetches captain ID and renders the client-side calendar
 */

export default async function SchedulePage() {
  const { user, supabase } = await requireAuth();

  // Get captain profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:h-screen">
      {/* Page Header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Schedule
          </span>
          <div className="h-px flex-1 bg-slate-800 sm:w-32" />
        </div>
        <ExportBookingsButton captainId={profile.id} />
      </div>

      {/* Calendar */}
      <div className="min-h-0 flex-1">
        <ScheduleClient captainId={user.id} />
      </div>
    </div>
  );
}
