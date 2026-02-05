import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBookingById, logBookingChange } from '@/lib/data/bookings';
import { isValidUUID } from '@/lib/utils/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bookings/[id]/passengers
 * Get all passengers for a booking
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Valid booking ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify booking ownership
    const booking = await getBookingById(id);
    if (!booking || booking.captain_id !== user.id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Fetch passengers
    const { data: passengers, error } = await supabase
      .from('passengers')
      .select('*')
      .eq('booking_id', id)
      .order('is_primary_contact', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching passengers:', error);
      return NextResponse.json({ error: 'Failed to fetch passengers' }, { status: 500 });
    }

    return NextResponse.json({ passengers: passengers || [] });
  } catch (error) {
    console.error('Error in GET /api/bookings/[id]/passengers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/bookings/[id]/passengers
 * Add a new passenger to a booking
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Valid booking ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify booking ownership
    const booking = await getBookingById(id);
    if (!booking || booking.captain_id !== user.id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { full_name, email, phone, notes, is_primary_contact } = body;

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
      return NextResponse.json({ error: 'Passenger name is required' }, { status: 400 });
    }

    // Check current passenger count
    const { count } = await supabase
      .from('passengers')
      .select('id', { count: 'exact' })
      .eq('booking_id', id);

    if ((count || 0) >= booking.party_size) {
      return NextResponse.json(
        { error: `Cannot add more than ${booking.party_size} passengers` },
        { status: 400 }
      );
    }

    // Insert passenger
    const { data: passenger, error: insertError } = await supabase
      .from('passengers')
      .insert({
        booking_id: id,
        full_name: full_name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
        is_primary_contact: is_primary_contact || false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting passenger:', insertError);
      return NextResponse.json({ error: 'Failed to add passenger' }, { status: 500 });
    }

    // Log the change
    await logBookingChange({
      bookingId: id,
      entryType: 'passenger_added',
      description: `Passenger "${full_name.trim()}" added to manifest`,
      newValue: { passenger_id: passenger.id, full_name: full_name.trim() },
      actorType: 'captain',
      actorId: user.id,
    });

    return NextResponse.json({ passenger }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/bookings/[id]/passengers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
