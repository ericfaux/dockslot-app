import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.id !== booking.captain_id) {
      return NextResponse.json(
        { error: 'Not authorized to edit this booking' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { internal_notes, tags } = body

    // Validate tags array if provided
    if (tags !== undefined && !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Tags must be an array of strings' },
        { status: 400 }
      )
    }

    // Update notes and/or tags
    const updates: { internal_notes?: string; tags?: string[] } = {}
    if (internal_notes !== undefined) updates.internal_notes = internal_notes
    if (tags !== undefined) updates.tags = tags

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating booking notes/tags:', error)
      return NextResponse.json(
        { error: 'Failed to update notes/tags' },
        { status: 500 }
      )
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      table_name: 'bookings',
      record_id: id,
      action: 'update',
      changed_fields: Object.keys(updates),
      user_id: user.id,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
