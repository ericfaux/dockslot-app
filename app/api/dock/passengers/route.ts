import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get booking ID from query params
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('bookingId');

  if (!bookingId) {
    return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
  }

  // Verify booking belongs to this captain
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, captain_id, party_size')
    .eq('id', bookingId)
    .single();

  if (!booking || booking.captain_id !== user.id) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Fetch passengers for this booking
  const { data: passengers, error: passengersError } = await supabase
    .from('passengers')
    .select('id, full_name, phone, is_primary_contact')
    .eq('booking_id', bookingId)
    .order('is_primary_contact', { ascending: false })
    .order('full_name', { ascending: true });

  if (passengersError) {
    console.error('Failed to fetch passengers:', passengersError);
    return NextResponse.json({ error: 'Failed to fetch passengers' }, { status: 500 });
  }

  // Fetch waiver signatures for this booking
  const { data: waivers } = await supabase
    .from('waiver_signatures')
    .select('passenger_id, signer_name')
    .eq('booking_id', bookingId);

  // Create a set of passenger IDs that have signed waivers
  const signedPassengerIds = new Set(
    (waivers || []).map(w => w.passenger_id).filter(Boolean)
  );
  // Also track signed by name for passengers without IDs
  const signedNames = new Set(
    (waivers || []).map(w => w.signer_name?.toLowerCase()).filter(Boolean)
  );

  // Transform passengers with waiver status
  const passengersWithStatus = (passengers || []).map(p => ({
    id: p.id,
    name: p.full_name,
    phone: p.phone,
    waiverSigned: signedPassengerIds.has(p.id) || signedNames.has(p.full_name?.toLowerCase()),
    isCheckedIn: false, // Could be extended to track check-in status
  }));

  // If no passengers registered yet, create placeholder entries based on party size
  if (passengersWithStatus.length === 0 && booking.party_size > 0) {
    for (let i = 0; i < booking.party_size; i++) {
      passengersWithStatus.push({
        id: `placeholder-${i}`,
        name: i === 0 ? 'Primary Guest' : `Guest ${i + 1}`,
        phone: null,
        waiverSigned: false,
        isCheckedIn: false,
      });
    }
  }

  return NextResponse.json({
    passengers: passengersWithStatus,
    totalCount: passengersWithStatus.length,
    partySize: booking.party_size,
  });
}
