import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get booking to verify captain ownership
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('captain_id')
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify captain owns this booking
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.id !== booking.captain_id) {
      return NextResponse.json(
        { error: 'Not authorized to view this booking' },
        { status: 403 }
      )
    }

    // Fetch booking logs (timeline events)
    const { data: logs, error: logsError } = await supabase
      .from('booking_logs')
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: false })

    if (logsError) {
      console.error('Error fetching booking logs:', logsError)
      return NextResponse.json(
        { error: 'Failed to fetch timeline' },
        { status: 500 }
      )
    }

    // Fetch audit logs for additional events
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'bookings')
      .eq('record_id', id)
      .order('created_at', { ascending: false })

    if (auditError) {
      console.error('Error fetching audit logs:', auditError)
      // Don't fail the request, just return empty audit logs
    }

    return NextResponse.json({
      logs: logs || [],
      auditLogs: auditLogs || [],
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
