import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(
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

    // Get captain profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get original booking
    const { data: originalBooking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (bookingError || !originalBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify captain owns this booking
    if (originalBooking.captain_id !== profile.id) {
      return NextResponse.json(
        { error: 'Not authorized to duplicate this booking' },
        { status: 403 }
      )
    }

    // Parse request body for override values
    const body = await request.json()
    const {
      scheduled_start,
      scheduled_end,
      guest_name,
      guest_email,
      guest_phone,
      party_size,
    } = body

    // Generate new management token
    const managementToken = crypto.randomBytes(32).toString('hex')

    // Create duplicate booking
    const { data: newBooking, error: createError } = await supabase
      .from('bookings')
      .insert({
        captain_id: originalBooking.captain_id,
        trip_type_id: originalBooking.trip_type_id,
        vessel_id: originalBooking.vessel_id,
        guest_name: guest_name || originalBooking.guest_name,
        guest_email: guest_email || originalBooking.guest_email,
        guest_phone: guest_phone || originalBooking.guest_phone,
        party_size: party_size || originalBooking.party_size,
        scheduled_start: scheduled_start || originalBooking.scheduled_start,
        scheduled_end: scheduled_end || originalBooking.scheduled_end,
        status: 'pending_deposit',
        payment_status: 'unpaid',
        total_price_cents: originalBooking.total_price_cents,
        deposit_paid_cents: 0,
        balance_due_cents: originalBooking.total_price_cents,
        special_requests: originalBooking.special_requests,
        captain_instructions: originalBooking.captain_instructions,
        management_token: managementToken,
        // Don't copy: internal_notes, tags, weather_hold_reason, etc.
      })
      .select()
      .single()

    if (createError || !newBooking) {
      console.error('Error creating duplicate booking:', createError)
      return NextResponse.json(
        { error: 'Failed to duplicate booking' },
        { status: 500 }
      )
    }

    // Create booking log
    await supabase.from('booking_logs').insert({
      booking_id: newBooking.id,
      entry_type: 'booking_created',
      description: `Booking duplicated from ${originalBooking.guest_name} (${originalBooking.id})`,
      actor_type: 'captain',
      actor_id: user.id,
    })

    return NextResponse.json({
      success: true,
      booking: newBooking,
      message: 'Booking duplicated successfully',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
