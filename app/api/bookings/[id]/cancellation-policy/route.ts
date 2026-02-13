import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: bookingId } = await context.params

    // Get booking with trip type policy
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        captain_profiles!inner(id),
        trip_types(
          id,
          title,
          cancellation_policy_hours,
          cancellation_refund_percentage,
          cancellation_policy_text
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify ownership (captain or guest)
    const isCaptain = booking.captain_profiles.id === user.id
    // For guest access, would need token auth - skipping for now
    
    if (!isCaptain) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Call the database function to calculate refund
    const { data: policyData, error: policyError } = await supabase
      .rpc('calculate_cancellation_refund', {
        booking_id_param: bookingId,
      })
      .single()

    if (policyError || !policyData) {
      console.error('Policy calculation error:', policyError)
      return NextResponse.json(
        { error: 'Failed to calculate refund policy' },
        { status: 500 }
      )
    }

    // Cast to expected type
    const policy = policyData as {
      refund_percentage: number
      refund_amount: number
      policy_description: string
    }

    // Calculate hours until trip
    const scheduledStart = new Date(booking.scheduled_start)
    const now = new Date()
    const hoursUntilTrip = (scheduledStart.getTime() - now.getTime()) / (1000 * 60 * 60)

    return NextResponse.json({
      booking: {
        id: booking.id,
        scheduled_start: booking.scheduled_start,
        total_price: booking.total_price,
        payment_status: booking.payment_status,
        status: booking.status,
      },
      trip_type: booking.trip_types,
      policy: {
        hours_required: booking.trip_types.cancellation_policy_hours,
        hours_until_trip: Math.round(hoursUntilTrip * 10) / 10,
        refund_percentage: policy.refund_percentage,
        refund_amount: policy.refund_amount,
        description: policy.policy_description,
        custom_text: booking.trip_types.cancellation_policy_text,
      },
      eligible_for_full_refund: policy.refund_percentage === 100,
      can_cancel: booking.status === 'confirmed' || booking.status === 'pending_deposit',
    })
  } catch (error) {
    console.error('Cancellation policy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
