import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET /api/search
 *
 * Global search across bookings and guests
 *
 * Query Parameters:
 * - q (required): Search query
 * - limit: Maximum results (default 10, max 50)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
        message: 'Query too short',
      })
    }

    // Parse limit
    let limit = 10
    const limitParam = searchParams.get('limit')
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10)
      if (!isNaN(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 50) {
        limit = parsedLimit
      }
    }

    // Prepare search pattern
    const searchPattern = `%${query}%`

    // Search bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        guest_name,
        guest_email,
        guest_phone,
        scheduled_start,
        status,
        trip_type:trip_types(title)
      `
      )
      .eq('captain_id', user.id)
      .or(
        `guest_name.ilike.${searchPattern},guest_email.ilike.${searchPattern},guest_phone.ilike.${searchPattern},id.ilike.${searchPattern}`
      )
      .order('scheduled_start', { ascending: false })
      .limit(limit)

    if (bookingsError) {
      console.error('Search bookings error:', bookingsError)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    // Transform results
    const results = (bookings || []).map((booking) => {
      // Handle the trip_type which can be an array or object depending on the relationship
      const tripType = Array.isArray(booking.trip_type)
        ? booking.trip_type[0]?.title
        : (booking.trip_type as { title?: string } | null)?.title

      return {
        id: booking.id,
        type: 'booking' as const,
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        guestPhone: booking.guest_phone,
        scheduledStart: booking.scheduled_start,
        status: booking.status,
        tripType,
      }
    })

    return NextResponse.json({
      results,
      query,
      count: results.length,
    })
  } catch (error) {
    console.error('Error in GET /api/search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
