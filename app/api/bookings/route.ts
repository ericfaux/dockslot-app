import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { getBookingsWithFilters, BookingListFilters } from '@/lib/data/bookings';
import { BookingStatus, BOOKING_STATUSES } from '@/lib/db/types';
import { addMonths } from 'date-fns';
import crypto from 'crypto';

const VALID_SORT_FIELDS = ['scheduled_start', 'guest_name', 'status', 'created_at'] as const;
type SortField = (typeof VALID_SORT_FIELDS)[number];

/**
 * GET /api/bookings
 *
 * Retrieves bookings with filtering and pagination.
 *
 * Query Parameters:
 * - captainId (required): UUID of the captain
 * - startDate: Filter by scheduled_start >= date (YYYY-MM-DD)
 * - endDate: Filter by scheduled_start <= date (YYYY-MM-DD)
 * - status: Comma-separated list of statuses to filter
 * - vesselId: Filter by vessel UUID
 * - search: Search by guest name
 * - includeHistorical: Include completed/cancelled/no-show (boolean)
 * - sortField: Field to sort by (scheduled_start, guest_name, status, created_at)
 * - sortDir: Sort direction (asc, desc)
 * - cursor: Pagination cursor
 * - limit: Number of results (1-100, default 20)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const captainId = searchParams.get('captainId');

    if (!captainId) {
      return NextResponse.json(
        { error: 'captainId is required' },
        { status: 400 }
      );
    }

    // Verify user is the captain or has access
    if (user.id !== captainId) {
      return NextResponse.json(
        { error: 'Access denied to this captain\'s bookings' },
        { status: 403 }
      );
    }

    // Parse optional filters
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const vesselId = searchParams.get('vesselId') || undefined;
    const search = searchParams.get('search') || undefined;
    const includeHistorical = searchParams.get('includeHistorical') === 'true';
    const cursor = searchParams.get('cursor') || undefined;

    // Parse and validate status filter
    let status: BookingStatus[] | undefined;
    const statusParam = searchParams.get('status');
    if (statusParam) {
      const statusValues = statusParam.split(',');
      const validStatuses = statusValues.filter(
        (s): s is BookingStatus => BOOKING_STATUSES.includes(s as BookingStatus)
      );
      if (validStatuses.length > 0) {
        status = validStatuses;
      }
    }

    // Parse and validate sort field (prevent injection)
    let sortField: SortField = 'scheduled_start';
    const sortFieldParam = searchParams.get('sortField');
    if (sortFieldParam && VALID_SORT_FIELDS.includes(sortFieldParam as SortField)) {
      sortField = sortFieldParam as SortField;
    }

    // Parse sort direction
    const sortDirParam = searchParams.get('sortDir');
    const sortDir: 'asc' | 'desc' = sortDirParam === 'desc' ? 'desc' : 'asc';

    // Parse limit
    let limit = 20;
    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 100) {
        limit = parsedLimit;
      }
    }

    // Build filters object
    const filters: BookingListFilters = {
      captainId,
      startDate,
      endDate,
      status,
      vesselId,
      search,
      includeHistorical,
      sortField,
      sortDir,
      cursor,
      limit,
    };

    // Fetch bookings
    const result = await getBookingsWithFilters(filters);

    return NextResponse.json({
      bookings: result.bookings,
      nextCursor: result.nextCursor,
      totalCount: result.totalCount,
    });
  } catch (error) {
    console.error('Error in GET /api/bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 *
 * Creates a new booking (public endpoint, no auth required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      captain_id,
      trip_type_id,
      guest_name,
      guest_email,
      guest_phone,
      party_size,
      scheduled_start,
      scheduled_end,
      special_requests,
      total_price_cents,
      deposit_paid_cents,
      balance_due_cents,
    } = body;

    // Validate required fields
    if (!captain_id || !trip_type_id || !guest_name || !guest_email || !party_size || !scheduled_start || !scheduled_end) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate party size
    if (party_size < 1 || party_size > 6) {
      return NextResponse.json(
        { error: 'Party size must be between 1 and 6' },
        { status: 400 }
      );
    }

    // Use service client (public endpoint)
    const supabase = createSupabaseServiceClient();

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        captain_id,
        trip_type_id,
        guest_name,
        guest_email,
        guest_phone: guest_phone || null,
        party_size,
        scheduled_start,
        scheduled_end,
        special_requests: special_requests || null,
        status: 'pending_deposit' as BookingStatus,
        payment_status: 'unpaid',
        total_price_cents: total_price_cents || 0,
        deposit_paid_cents: deposit_paid_cents || 0,
        balance_due_cents: balance_due_cents || total_price_cents || 0,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Generate secure guest token (for booking management)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = addMonths(new Date(), 6); // Token valid for 6 months

    const { error: tokenError } = await supabase
      .from('guest_tokens')
      .insert({
        booking_id: booking.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Error creating guest token:', tokenError);
      // Don't fail the booking creation, just log it
    }

    // Create primary passenger record
    const { error: passengerError } = await supabase
      .from('passengers')
      .insert({
        booking_id: booking.id,
        full_name: guest_name,
        email: guest_email,
        phone: guest_phone || null,
        is_primary_contact: true,
      });

    if (passengerError) {
      console.error('Error creating passenger:', passengerError);
      // Don't fail booking creation
    }

    // Create booking log entry
    await supabase
      .from('booking_logs')
      .insert({
        booking_id: booking.id,
        entry_type: 'booking_created',
        description: `Booking created by ${guest_name}`,
        actor_type: 'guest',
        new_value: { status: 'pending_deposit' },
      });

    return NextResponse.json({
      booking,
      managementUrl: `/manage/${token}`,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
