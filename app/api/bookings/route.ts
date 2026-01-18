import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBookingsWithFilters, BookingListFilters } from '@/lib/data/bookings';
import { BookingStatus, BOOKING_STATUSES } from '@/lib/db/types';

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
