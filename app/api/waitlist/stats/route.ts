import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { WaitlistStats } from '@/lib/db/types';

/**
 * GET /api/waitlist/stats
 * Get waitlist statistics for captain
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Call PostgreSQL function
  const { data, error } = await supabase.rpc('get_waitlist_stats', {
    p_captain_id: user.id,
  });

  if (error) {
    console.error('Error fetching waitlist stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }

  // Function returns single row
  const stats = data?.[0] || {
    total_active: 0,
    total_notified: 0,
    total_converted: 0,
    total_expired: 0,
    conversion_rate: 0,
    avg_wait_time_hours: 0,
  };

  return NextResponse.json(stats);
}
