import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get captain profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get query params
    const searchParams = req.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const vesselId = searchParams.get('vesselId')
    const tripTypeId = searchParams.get('tripTypeId')

    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        id,
        guest_name,
        guest_email,
        party_size,
        scheduled_start,
        scheduled_end,
        status,
        payment_status,
        total_price,
        deposit_amount,
        created_at,
        vessels(id, name),
        trip_types(id, title)
      `)
      .eq('captain_id', profile.id)
      .order('scheduled_start', { ascending: false })

    // Apply filters
    if (startDate) {
      query = query.gte('scheduled_start', startDate)
    }
    if (endDate) {
      query = query.lte('scheduled_start', endDate)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (vesselId) {
      query = query.eq('vessel_id', vesselId)
    }
    if (tripTypeId) {
      query = query.eq('trip_type_id', tripTypeId)
    }

    const { data: bookings, error: bookingsError } = await query

    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    // Calculate metrics
    const totalBookings = bookings.length
    const totalRevenue = bookings
      .filter(b => b.payment_status === 'fully_paid')
      .reduce((sum, b) => sum + b.total_price, 0)
    
    const depositsCollected = bookings
      .filter(b => b.payment_status === 'deposit_paid' || b.payment_status === 'fully_paid')
      .reduce((sum, b) => sum + b.deposit_amount, 0)

    const totalGuests = bookings.reduce((sum, b) => sum + b.party_size, 0)

    const averageBookingValue = totalBookings > 0 
      ? Math.round(bookings.reduce((sum, b) => sum + b.total_price, 0) / totalBookings)
      : 0

    const averagePartySize = totalBookings > 0
      ? Math.round((totalGuests / totalBookings) * 10) / 10
      : 0

    // Status breakdown
    const statusCounts = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Payment status breakdown
    const paymentCounts = bookings.reduce((acc, b) => {
      acc[b.payment_status] = (acc[b.payment_status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Revenue by month (for chart)
    const revenueByMonth = bookings
      .filter(b => b.payment_status === 'fully_paid')
      .reduce((acc, b) => {
        const month = new Date(b.scheduled_start).toISOString().substring(0, 7) // YYYY-MM
        acc[month] = (acc[month] || 0) + b.total_price
        return acc
      }, {} as Record<string, number>)

    // Bookings by vessel
    const bookingsByVessel = bookings.reduce((acc, b) => {
      const vessel = b.vessels as any
      const vesselName = vessel?.name || 'Unknown'
      acc[vesselName] = (acc[vesselName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Bookings by trip type
    const bookingsByTripType = bookings.reduce((acc, b) => {
      const tripType = b.trip_types as any
      const tripTypeName = tripType?.title || 'Unknown'
      acc[tripTypeName] = (acc[tripTypeName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      metrics: {
        totalBookings,
        totalRevenue,
        depositsCollected,
        totalGuests,
        averageBookingValue,
        averagePartySize,
      },
      breakdowns: {
        status: statusCounts,
        payment: paymentCounts,
        vessel: bookingsByVessel,
        tripType: bookingsByTripType,
      },
      charts: {
        revenueByMonth: Object.entries(revenueByMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, revenue]) => ({ month, revenue })),
      },
      bookings: bookings.map(b => {
        const vessel = b.vessels as any
        const tripType = b.trip_types as any
        return {
          id: b.id,
          guest_name: b.guest_name,
          party_size: b.party_size,
          scheduled_start: b.scheduled_start,
          status: b.status,
          payment_status: b.payment_status,
          total_price: b.total_price,
          vessel: vessel?.name,
          trip_type: tripType?.title,
        }
      }),
    })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
