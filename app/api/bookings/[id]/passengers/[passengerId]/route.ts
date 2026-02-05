import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBookingById, logBookingChange } from '@/lib/data/bookings';
import { isValidUUID } from '@/lib/utils/validation';

interface RouteParams {
  params: Promise<{ id: string; passengerId: string }>;
}

/**
 * DELETE /api/bookings/[id]/passengers/[passengerId]
 * Remove a passenger from a booking
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, passengerId } = await params;

    if (!id || !isValidUUID(id) || !passengerId || !isValidUUID(passengerId)) {
      return NextResponse.json(
        { error: 'Valid booking ID and passenger ID are required' },
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

    // Get passenger info before deletion (for logging)
    const { data: passenger, error: fetchError } = await supabase
      .from('passengers')
      .select('full_name')
      .eq('id', passengerId)
      .eq('booking_id', id)
      .single();

    if (fetchError || !passenger) {
      return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
    }

    // Delete passenger
    const { error: deleteError } = await supabase
      .from('passengers')
      .delete()
      .eq('id', passengerId)
      .eq('booking_id', id);

    if (deleteError) {
      console.error('Error deleting passenger:', deleteError);
      return NextResponse.json({ error: 'Failed to remove passenger' }, { status: 500 });
    }

    // Log the change
    await logBookingChange({
      bookingId: id,
      entryType: 'passenger_updated',
      description: `Passenger "${passenger.full_name}" removed from manifest`,
      oldValue: { passenger_id: passengerId, full_name: passenger.full_name },
      actorType: 'captain',
      actorId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/bookings/[id]/passengers/[passengerId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/bookings/[id]/passengers/[passengerId]
 * Update a passenger's information
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, passengerId } = await params;

    if (!id || !isValidUUID(id) || !passengerId || !isValidUUID(passengerId)) {
      return NextResponse.json(
        { error: 'Valid booking ID and passenger ID are required' },
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
    const updates: Record<string, unknown> = {};

    if (body.full_name !== undefined) {
      updates.full_name = body.full_name?.trim() || null;
    }
    if (body.email !== undefined) {
      updates.email = body.email?.trim() || null;
    }
    if (body.phone !== undefined) {
      updates.phone = body.phone?.trim() || null;
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes?.trim() || null;
    }
    if (body.is_primary_contact !== undefined) {
      updates.is_primary_contact = body.is_primary_contact;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    // Update passenger
    const { data: passenger, error: updateError } = await supabase
      .from('passengers')
      .update(updates)
      .eq('id', passengerId)
      .eq('booking_id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating passenger:', updateError);
      return NextResponse.json({ error: 'Failed to update passenger' }, { status: 500 });
    }

    // Log the change
    await logBookingChange({
      bookingId: id,
      entryType: 'passenger_updated',
      description: `Passenger "${passenger.full_name}" information updated`,
      newValue: updates,
      actorType: 'captain',
      actorId: user.id,
    });

    return NextResponse.json({ passenger });
  } catch (error) {
    console.error('Error in PATCH /api/bookings/[id]/passengers/[passengerId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
