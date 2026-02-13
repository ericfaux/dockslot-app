import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Create modification request (guest or captain)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    
    const {
      bookingId,
      token, // For guest access
      modificationType,
      newScheduledStart,
      newScheduledEnd,
      newPartySize,
      reason,
    } = body

    // Validate required fields
    if (!bookingId || !modificationType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Determine if request is from guest or captain
    let requestedBy: 'guest' | 'captain' = 'guest'
    
    // Try captain auth first
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Captain access - verify ownership
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (profile && profile.id === booking.captain_id) {
        requestedBy = 'captain'
      }
    } else if (token) {
      // Guest access - verify token
      if (booking.management_token !== token) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
      }
      requestedBy = 'guest'
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate modification type and values
    if (modificationType === 'date_time' || modificationType === 'both') {
      if (!newScheduledStart || !newScheduledEnd) {
        return NextResponse.json(
          { error: 'New date/time required for date_time modification' },
          { status: 400 }
        )
      }
    }
    
    if (modificationType === 'party_size' || modificationType === 'both') {
      if (!newPartySize) {
        return NextResponse.json(
          { error: 'New party size required for party_size modification' },
          { status: 400 }
        )
      }
    }

    // Create modification request
    const { data: modRequest, error: modError } = await supabase
      .from('booking_modification_requests')
      .insert({
        booking_id: bookingId,
        requested_by: requestedBy,
        modification_type: modificationType,
        new_scheduled_start: newScheduledStart || null,
        new_scheduled_end: newScheduledEnd || null,
        new_party_size: newPartySize || null,
        original_scheduled_start: booking.scheduled_start,
        original_scheduled_end: booking.scheduled_end,
        original_party_size: booking.party_size,
        reason: reason || null,
        status: requestedBy === 'captain' ? 'approved' : 'pending', // Captain requests auto-approve
      })
      .select()
      .single()

    if (modError) {
      console.error('Modification request creation error:', modError)
      return NextResponse.json(
        { error: 'Failed to create modification request' },
        { status: 500 }
      )
    }

    // If captain-initiated, auto-approve and apply
    if (requestedBy === 'captain') {
      await supabase.rpc('apply_booking_modification', {
        modification_id: modRequest.id,
      })
    }

    // Log in booking_logs
    await supabase.from('booking_logs').insert({
      booking_id: bookingId,
      event_type: 'modification_requested',
      details: `${requestedBy === 'guest' ? 'Guest' : 'Captain'} requested ${modificationType} modification`,
      metadata: { modification_id: modRequest.id },
    })

    return NextResponse.json({
      success: true,
      modification: modRequest,
      auto_approved: requestedBy === 'captain',
    })
  } catch (error) {
    console.error('Modification request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get modification requests (captain only)
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

    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('booking_modification_requests')
      .select(`
        *,
        bookings!inner(
          id,
          guest_name,
          scheduled_start,
          scheduled_end,
          party_size,
          captain_id
        )
      `)
      .eq('bookings.captain_id', profile.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: requests, error: requestsError } = await query

    if (requestsError) {
      console.error('Requests fetch error:', requestsError)
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Modification requests GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
