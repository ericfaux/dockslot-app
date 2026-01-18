import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBookingById, getRescheduleOffers } from '@/lib/data/bookings';
import { isValidUUID } from '@/lib/utils/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bookings/[id]/reschedule-offers
 *
 * Retrieves reschedule offers for a booking on weather hold.
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

    // Authenticate
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch booking to verify access
    const booking = await getBookingById(id);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify user has access (must be the captain)
    if (booking.captain_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied to this booking' },
        { status: 403 }
      );
    }

    // Fetch reschedule offers
    const offers = await getRescheduleOffers(id);

    return NextResponse.json({ offers });
  } catch (error) {
    console.error('Error in GET /api/bookings/[id]/reschedule-offers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
