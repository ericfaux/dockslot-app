import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { enforceFeature } from '@/lib/subscription/enforce'

// Submit a review (public endpoint, guest access via booking token)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    
    const {
      bookingId,
      token,
      overall_rating,
      vessel_rating,
      captain_rating,
      experience_rating,
      review_title,
      review_text,
    } = body

    // Validate required fields
    if (!bookingId || !token || !overall_rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify booking and token
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, captain_id, guest_name, guest_email, status, management_token')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify token
    if (booking.management_token !== token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }

    // Verify the captain has access to the reviews feature
    const gate = await enforceFeature(supabase, booking.captain_id, 'reviews_ratings')
    if (gate) return gate

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only review completed trips' },
        { status: 400 }
      )
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .single()

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already submitted for this booking' },
        { status: 400 }
      )
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        booking_id: bookingId,
        captain_id: booking.captain_id,
        overall_rating,
        vessel_rating: vessel_rating || null,
        captain_rating: captain_rating || null,
        experience_rating: experience_rating || null,
        review_title: review_title || null,
        review_text: review_text || null,
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
      })
      .select()
      .single()

    if (reviewError) {
      console.error('Review creation error:', reviewError)
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      )
    }

    // Log in booking_logs
    await supabase.from('booking_logs').insert({
      booking_id: bookingId,
      event_type: 'review_submitted',
      details: `Guest submitted ${overall_rating}-star review`,
      metadata: { review_id: review.id },
    })

    return NextResponse.json({
      success: true,
      review,
    })
  } catch (error) {
    console.error('Review submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get reviews for a captain (public)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = req.nextUrl.searchParams
    const captainId = searchParams.get('captainId')
    const includePrivate = searchParams.get('includePrivate') === 'true'

    if (!captainId) {
      return NextResponse.json(
        { error: 'Captain ID required' },
        { status: 400 }
      )
    }

    // Verify the captain has access to the reviews feature
    const gate = await enforceFeature(supabase, captainId, 'reviews_ratings')
    if (gate) return gate

    // Build query
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('captain_id', captainId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    // Only show public reviews unless includePrivate is true (and user is captain)
    if (!includePrivate) {
      query = query.eq('is_public', true)
    }

    const { data: reviews, error: reviewsError } = await query

    if (reviewsError) {
      console.error('Reviews fetch error:', reviewsError)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    // Get captain ratings
    const { data: ratings } = await supabase
      .rpc('get_captain_ratings', { captain_id_param: captainId })
      .single()

    return NextResponse.json({
      reviews,
      ratings: ratings || {
        total_reviews: 0,
        average_overall: 0,
        average_vessel: 0,
        average_captain: 0,
        average_experience: 0,
        rating_distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
      },
    })
  } catch (error) {
    console.error('Reviews GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
