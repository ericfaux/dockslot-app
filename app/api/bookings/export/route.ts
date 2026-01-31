import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { format, parseISO } from 'date-fns';

/**
 * Export bookings as CSV
 * Supports filtering by date range and status
 * 
 * Query params:
 * - startDate: YYYY-MM-DD (optional)
 * - endDate: YYYY-MM-DD (optional)
 * - status: comma-separated list (optional)
 * - format: csv (default)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const statusFilter = searchParams.get('status')?.split(',');
    const exportFormat = searchParams.get('format') || 'csv';

    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        id,
        created_at,
        scheduled_start,
        scheduled_end,
        guest_name,
        guest_email,
        guest_phone,
        party_size,
        status,
        payment_status,
        total_price_cents,
        deposit_paid_cents,
        balance_due_cents,
        special_requests,
        meeting_spot,
        trip_type:trip_types(title, duration_hours),
        vessel:vessels(name)
      `)
      .eq('captain_id', user.id)
      .order('scheduled_start', { ascending: false });

    // Apply filters
    if (startDate) {
      query = query.gte('scheduled_start', `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte('scheduled_start', `${endDate}T23:59:59`);
    }
    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Failed to fetch bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      return new NextResponse('No bookings found', { status: 404 });
    }

    // Generate CSV
    const csv = generateCSV(bookings);

    // Generate filename
    const dateRange = startDate && endDate
      ? `${startDate}_to_${endDate}`
      : startDate
        ? `from_${startDate}`
        : endDate
          ? `until_${endDate}`
          : 'all';
    const filename = `dockslot_bookings_${dateRange}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export bookings' }, { status: 500 });
  }
}

function generateCSV(bookings: any[]): string {
  // CSV Headers
  const headers = [
    'Booking ID',
    'Created Date',
    'Trip Date',
    'Trip Time',
    'Duration (hours)',
    'Trip Type',
    'Vessel',
    'Guest Name',
    'Guest Email',
    'Guest Phone',
    'Party Size',
    'Status',
    'Payment Status',
    'Total Price',
    'Deposit Paid',
    'Balance Due',
    'Meeting Spot',
    'Special Requests',
  ];

  // Build CSV rows
  const rows = bookings.map((booking) => {
    const tripType = Array.isArray(booking.trip_type)
      ? booking.trip_type[0]
      : booking.trip_type;
    const vessel = Array.isArray(booking.vessel) ? booking.vessel[0] : booking.vessel;

    const scheduledStart = parseISO(booking.scheduled_start);
    const tripDate = format(scheduledStart, 'yyyy-MM-dd');
    const tripTime = format(scheduledStart, 'h:mm a');

    return [
      booking.id,
      format(parseISO(booking.created_at), 'yyyy-MM-dd'),
      tripDate,
      tripTime,
      tripType?.duration_hours || '',
      tripType?.title || '',
      vessel?.name || '',
      booking.guest_name,
      booking.guest_email,
      booking.guest_phone || '',
      booking.party_size,
      booking.status,
      booking.payment_status,
      `$${(booking.total_price_cents / 100).toFixed(2)}`,
      `$${(booking.deposit_paid_cents / 100).toFixed(2)}`,
      `$${(booking.balance_due_cents / 100).toFixed(2)}`,
      booking.meeting_spot || '',
      booking.special_requests || '',
    ];
  });

  // Escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV string
  const csvRows = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ];

  return csvRows.join('\n');
}
