import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PATCH /api/filter-presets/[id]
 * Updates a filter preset
 */
export async function PATCH(
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
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify ownership
    const { data: preset, error: presetError } = await supabase
      .from('filter_presets')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (presetError || !preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    if (preset.owner_id !== profile.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this preset' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, filters, is_default } = body

    // If setting as default, clear other defaults first
    if (is_default) {
      await supabase
        .from('filter_presets')
        .update({ is_default: false })
        .eq('owner_id', profile.id)
        .neq('id', id)
    }

    // Update preset
    const updates: {
      name?: string
      filters?: unknown
      is_default?: boolean
      updated_at: string
    } = { updated_at: new Date().toISOString() }

    if (name !== undefined) updates.name = name
    if (filters !== undefined) updates.filters = filters
    if (is_default !== undefined) updates.is_default = is_default

    const { data, error } = await supabase
      .from('filter_presets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating filter preset:', error)
      return NextResponse.json(
        { error: 'Failed to update preset' },
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

/**
 * DELETE /api/filter-presets/[id]
 * Deletes a filter preset
 */
export async function DELETE(
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
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify ownership
    const { data: preset, error: presetError } = await supabase
      .from('filter_presets')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (presetError || !preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    if (preset.owner_id !== profile.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this preset' },
        { status: 403 }
      )
    }

    // Delete preset
    const { error } = await supabase
      .from('filter_presets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting filter preset:', error)
      return NextResponse.json(
        { error: 'Failed to delete preset' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
