import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getBookingsForExport } from '@/lib/data/bookings'
import { BookingStatus, BOOKING_STATUSES } from '@/lib/db/types'
import { format, parseISO } from 'date-fns'

/**
 * GET /api/bookings/export
 * 
 * Exports bookings as CSV with same filters as the bookings list
 * Returns CSV file download
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get captain profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, business_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Parse query parameters (same as bookings list)
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const search = searchParams.get('search') || undefined
    const includeHistorical = searchParams.get('includeHistorical') === 'true'

    // Parse status filter
    let status: BookingStatus[] | undefined
    const statusParam = searchParams.get('status')
    if (statusParam) {
      const statusValues = statusParam.split(',')
      const validStatuses = statusValues.filter(
        (s): s is BookingStatus => BOOKING_STATUSES.includes(s as BookingStatus)
      )
      if (validStatuses.length > 0) {
        status = validStatuses
      }
    }

    // Parse payment status filter
    let paymentStatus: string[] | undefined
    const paymentStatusParam = searchParams.get('paymentStatus')
    if (paymentStatusParam) {
      const paymentValues = paymentStatusParam.split(',').filter(Boolean)
      if (paymentValues.length > 0) {
        paymentStatus = paymentValues
      }
    }

    // Parse tags filter
    let tags: string[] | undefined
    const tagsParam = searchParams.get('tags')
    if (tagsParam) {
      const tagValues = tagsParam.split(',').filter(Boolean)
      if (tagValues.length > 0) {
        tags = tagValues
      }
    }

    // Fetch bookings for export
    const bookings = await getBookingsForExport({
      captainId: profile.id,
      startDate,
      endDate,
      status,
      paymentStatus,
      tags,
      search,
      includeHistorical,
    })

    // Generate CSV
    const csv = generateCSV(bookings)

    // Generate filename with date range or current date
    const filename = startDate && endDate
      ? `bookings_${startDate}_to_${endDate}.csv`
      : `bookings_export_${format(new Date(), 'yyyy-MM-dd')}.csv`

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting bookings:', error)
    return NextResponse.json(
      { error: 'Failed to export bookings' },
      { status: 500 }
    )
  }
}

interface ExportBooking {
  id: string
  guest_name: string
  guest_email: string
  guest_phone: string | null
  party_size: number
  scheduled_start: string
  scheduled_end: string
  status: string
  payment_status: string
  total_price_cents: number
  deposit_paid_cents: number
  balance_due_cents: number
  internal_notes: string | null
  tags: string[]
  created_at: string
  vessel?: { name: string } | null
  trip_type?: { title: string } | null
}

function generateCSV(bookings: ExportBooking[]): string {
  // CSV Headers
  const headers = [
    'Booking ID',
    'Guest Name',
    'Email',
    'Phone',
    'Party Size',
    'Date',
    'Start Time',
    'End Time',
    'Duration (hours)',
    'Vessel',
    'Trip Type',
    'Status',
    'Payment Status',
    'Total ($)',
    'Deposit Paid ($)',
    'Balance Due ($)',
    'Tags',
    'Captain Notes',
    'Created Date',
  ]

  // Build CSV rows
  const rows = bookings.map((booking) => {
    const start = parseISO(booking.scheduled_start)
    const end = parseISO(booking.scheduled_end)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    return [
      booking.id,
      escapeCSV(booking.guest_name),
      escapeCSV(booking.guest_email),
      escapeCSV(booking.guest_phone || ''),
      booking.party_size.toString(),
      format(start, 'yyyy-MM-dd'),
      format(start, 'HH:mm'),
      format(end, 'HH:mm'),
      durationHours.toFixed(1),
      escapeCSV(booking.vessel?.name || ''),
      escapeCSV(booking.trip_type?.title || ''),
      booking.status,
      booking.payment_status,
      (booking.total_price_cents / 100).toFixed(2),
      (booking.deposit_paid_cents / 100).toFixed(2),
      (booking.balance_due_cents / 100).toFixed(2),
      escapeCSV(booking.tags?.join(', ') || ''),
      escapeCSV(booking.internal_notes || ''),
      format(parseISO(booking.created_at), 'yyyy-MM-dd HH:mm'),
    ]
  })

  // Combine headers and rows
  const csvLines = [headers, ...rows]

  // Convert to CSV string
  return csvLines.map((row) => row.join(',')).join('\n')
}

function escapeCSV(value: string): string {
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (!value) return ''
  
  const needsQuotes = /[",\n\r]/.test(value)
  const escaped = value.replace(/"/g, '""')
  
  return needsQuotes ? `"${escaped}"` : escaped
}
