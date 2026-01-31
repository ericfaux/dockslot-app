import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { ReferralStats } from '@/lib/db/types';

/**
 * GET /api/referral-stats
 * Get referral program statistics for the authenticated captain
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Call the PostgreSQL function
  const { data, error } = await supabase.rpc('get_referral_stats', {
    p_captain_id: user.id,
  });

  if (error) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }

  // The function returns a single row
  const stats = data?.[0] || {
    total_referrals: 0,
    qualified_referrals: 0,
    total_bookings_value_cents: 0,
    total_rewards_given_cents: 0,
    active_codes: 0,
    top_referrers: [],
  };

  return NextResponse.json(stats);
}
