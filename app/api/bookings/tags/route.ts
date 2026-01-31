import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/bookings/tags
 * Returns all unique tags used across bookings for the current captain
 */
export async function GET() {
  try {
    const supabase = await createClient()

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
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Query all bookings and extract unique tags
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('tags')
      .eq('captain_id', profile.id)
      .not('tags', 'is', null)

    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      )
    }

    // Flatten and deduplicate tags
    const allTags = new Set<string>()
    bookings.forEach((booking) => {
      if (Array.isArray(booking.tags)) {
        booking.tags.forEach((tag: string) => {
          if (tag) allTags.add(tag)
        })
      }
    })

    // Convert to sorted array
    const uniqueTags = Array.from(allTags).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    )

    return NextResponse.json({ tags: uniqueTags })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
