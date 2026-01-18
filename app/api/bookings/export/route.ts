import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBookingsForExport, getCaptainProfile } from '@/lib/data/bookings';
import { BookingStatus, BOOKING_STATUSES, BookingWithDetails } from '@/lib/db/types';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const VALID_SORT_FIELDS = ['scheduled_start', 'guest_name', 'status', 'created_at'] as const;
type SortField = (typeof VALID_SORT_FIELDS)[number];

/**
 * GET /api/bookings/export
 *
 * Exports bookings as CSV. This endpoint exports PII, must be protected.
 *
 * Query Parameters:
 * - captainId (required): UUID of the captain
 * - startDate: Filter by scheduled_start >= date (YYYY-MM-DD)
 * - endDate: Filter by scheduled_start <= date (YYYY-MM-DD)
 * - status: Comma-separated list of statuses to filter
 * - vesselId: Filter by vessel UUID
 * - search: Search by guest name
 * - includeHistorical: Include completed/cancelled/no-show (boolean)
 * - sortField: Field to sort by
 * - sortDir: Sort direction (asc, desc)
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

    // Verify user is the captain
    if (user.id !== captainId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get captain's timezone
    const profile = await getCaptainProfile(captainId);
    const timezone = profile?.timezone || 'UTC';

    // Parse optional filters
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const vesselId = searchParams.get('vesselId') || undefined;
    const search = searchParams.get('search') || undefined;
    const includeHistorical = searchParams.get('includeHistorical') === 'true';

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

    // Parse and validate sort field
    let sortField: SortField = 'scheduled_start';
    const sortFieldParam = searchParams.get('sortField');
    if (sortFieldParam && VALID_SORT_FIELDS.includes(sortFieldParam as SortField)) {
      sortField = sortFieldParam as SortField;
    }

    const sortDirParam = searchParams.get('sortDir');
    const sortDir: 'asc' | 'desc' = sortDirParam === 'desc' ? 'desc' : 'asc';

    // Fetch bookings for export (no pagination)
    const bookings = await getBookingsForExport({
      captainId,
      startDate,
      endDate,
      status,
      vesselId,
      search,
      includeHistorical,
      sortField,
      sortDir,
    });

    // Generate CSV
    const csv = generateCSV(bookings, timezone);

    // Generate filename with current date
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const filename = `bookings-export-${dateStr}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/bookings/export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateCSV(bookings: BookingWithDetails[], timezone: string): string {
  const headers = [
    'Date',
    'Start Time',
    'End Time',
    'Guest Name',
    'Guest Email',
    'Guest Phone',
    'Party Size',
    'Vessel',
    'Trip Type',
    'Status',
    'Payment Status',
    'Total Price',
    'Balance Due',
    'Special Requests',
    'Internal Notes',
    'Created At',
  ];

  const rows = bookings.map((booking) => [
    formatDateInTimezone(booking.scheduled_start, timezone),
    formatTimeInTimezone(booking.scheduled_start, timezone),
    formatTimeInTimezone(booking.scheduled_end, timezone),
    booking.guest_name,
    booking.guest_email,
    booking.guest_phone || '',
    booking.party_size.toString(),
    booking.vessel?.name || '',
    booking.trip_type?.title || '',
    formatStatus(booking.status),
    formatPaymentStatus(booking.payment_status),
    formatCurrency(booking.total_price_cents),
    formatCurrency(booking.balance_due_cents),
    booking.special_requests || '',
    booking.internal_notes || '',
    formatDateTimeInTimezone(booking.created_at, timezone),
  ]);

  const csvRows = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ];

  return csvRows.join('\r\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDateInTimezone(isoString: string, timezone: string): string {
  try {
    const date = parseISO(isoString);
    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, 'yyyy-MM-dd');
  } catch {
    return isoString;
  }
}

function formatTimeInTimezone(isoString: string, timezone: string): string {
  try {
    const date = parseISO(isoString);
    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, 'h:mm a'); // 12-hour format with AM/PM
  } catch {
    return isoString;
  }
}

function formatDateTimeInTimezone(isoString: string, timezone: string): string {
  try {
    const date = parseISO(isoString);
    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, 'yyyy-MM-dd h:mm a');
  } catch {
    return isoString;
  }
}

function formatStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    pending_deposit: 'Pending Deposit',
    confirmed: 'Confirmed',
    weather_hold: 'Weather Hold',
    rescheduled: 'Rescheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return statusLabels[status] || status;
}

function formatPaymentStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    unpaid: 'Unpaid',
    deposit_paid: 'Deposit Paid',
    fully_paid: 'Fully Paid',
    partially_refunded: 'Partially Refunded',
    fully_refunded: 'Fully Refunded',
  };
  return statusLabels[status] || status;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
