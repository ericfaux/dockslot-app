import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/filter-presets
 * Returns all filter presets for the current captain
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
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Fetch presets
    const { data: presets, error } = await supabase
      .from('filter_presets')
      .select('*')
      .eq('owner_id', profile.id)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching filter presets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch presets' },
        { status: 500 }
      )
    }

    return NextResponse.json({ presets: presets || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/filter-presets
 * Creates a new filter preset
 */
export async function POST(request: NextRequest) {
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
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { name, filters, is_default } = body

    if (!name || !filters) {
      return NextResponse.json(
        { error: 'Name and filters are required' },
        { status: 400 }
      )
    }

    // If setting as default, clear other defaults first
    if (is_default) {
      await supabase
        .from('filter_presets')
        .update({ is_default: false })
        .eq('owner_id', profile.id)
    }

    // Create preset
    const { data, error } = await supabase
      .from('filter_presets')
      .insert({
        owner_id: profile.id,
        name,
        filters,
        is_default: is_default || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating filter preset:', error)
      return NextResponse.json(
        { error: 'Failed to create preset' },
        { status: 500 }
      )
    }

    return NextResponse.json({ preset: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
