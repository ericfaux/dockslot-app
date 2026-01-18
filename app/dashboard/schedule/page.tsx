import { createSupabaseServerClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ScheduleClient } from './ScheduleClient';

/**
 * Schedule Page - Server Component
 * Fetches captain ID and renders the client-side calendar
 */

export default async function SchedulePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:h-screen">
      {/* Page Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
          Schedule
        </span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      {/* Calendar */}
      <div className="min-h-0 flex-1">
        <ScheduleClient captainId={user.id} />
      </div>
    </div>
  );
}
