import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { WaitlistEntry, WaitlistStatus } from '@/lib/db/types';

/**
 * GET /api/waitlist
 * List waitlist entries for captain (authenticated)
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') as WaitlistStatus | null;
  const tripTypeId = searchParams.get('tripTypeId');

  let query = supabase
    .from('waitlist_entries')
    .select(`
      *,
      trip_type:trip_types(id, title)
    `)
    .eq('captain_id', user.id)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (tripTypeId) {
    query = query.eq('trip_type_id', tripTypeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

/**
 * POST /api/waitlist
 * Create waitlist entry (public endpoint for guests)
 */
export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    captain_id,
    trip_type_id,
    guest_name,
    guest_email,
    guest_phone,
    party_size,
    preferred_date,
    preferred_time_start,
    preferred_time_end,
    flexible_dates,
    special_requests,
  } = body;

  // Validation
  if (!captain_id || !trip_type_id || !guest_name || !guest_email || !party_size || !preferred_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (party_size < 1 || party_size > 6) {
    return NextResponse.json({ error: 'Party size must be between 1 and 6' }, { status: 400 });
  }

  if (!guest_email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  // Use service client (public endpoint)
  const supabase = createSupabaseServiceClient();

  // Check if guest already has active waitlist entry for this trip type + date
  const { data: existing } = await supabase
    .from('waitlist_entries')
    .select('id')
    .eq('captain_id', captain_id)
    .eq('trip_type_id', trip_type_id)
    .eq('guest_email', guest_email.toLowerCase())
    .eq('preferred_date', preferred_date)
    .eq('status', 'active')
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'You already have an active waitlist entry for this date' },
      { status: 400 }
    );
  }

  // Create waitlist entry
  const { data, error } = await supabase
    .from('waitlist_entries')
    .insert({
      captain_id,
      trip_type_id,
      guest_name: guest_name.trim(),
      guest_email: guest_email.toLowerCase().trim(),
      guest_phone: guest_phone?.trim() || null,
      party_size,
      preferred_date,
      preferred_time_start: preferred_time_start || null,
      preferred_time_end: preferred_time_end || null,
      flexible_dates: flexible_dates || false,
      special_requests: special_requests?.trim() || null,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating waitlist entry:', error);
    return NextResponse.json({ error: 'Failed to create waitlist entry' }, { status: 500 });
  }

  return NextResponse.json(data);
}
