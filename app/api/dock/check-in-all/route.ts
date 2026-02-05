import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { bookingId } = body;

  if (!bookingId) {
    return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
  }

  // Verify booking belongs to this captain
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, captain_id, guest_name')
    .eq('id', bookingId)
    .single();

  if (!booking || booking.captain_id !== user.id) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Update the booking's guest_count_confirmed to match party size
  // This serves as a simple "checked in" indicator
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      guest_count_confirmed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (updateError) {
    console.error('Failed to confirm check-in:', updateError);
    return NextResponse.json({ error: 'Failed to confirm check-in' }, { status: 500 });
  }

  // Log the check-in action
  await supabase.from('booking_logs').insert({
    booking_id: bookingId,
    entry_type: 'note_added',
    description: 'All guests checked in via Dock Mode',
    actor_type: 'captain',
    actor_id: user.id,
  });

  return NextResponse.json({
    success: true,
    message: 'All guests checked in',
  });
}
