import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Update modification request (approve/reject)
export async function PATCH(
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

    const { id: modificationId } = await context.params
    const body = await req.json()
    const { status, captainResponse } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Get modification request with booking
    const { data: modRequest, error: modError } = await supabase
      .from('booking_modification_requests')
      .select(`
        *,
        bookings!inner(
          captain_id,
          captain_profiles!inner(user_id)
        )
      `)
      .eq('id', modificationId)
      .single()

    if (modError || !modRequest) {
      return NextResponse.json(
        { error: 'Modification request not found' },
        { status: 404 }
      )
    }

    // Verify captain ownership
    const booking = modRequest.bookings as any
    if (booking.captain_profiles.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if already processed
    if (modRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request already processed' },
        { status: 400 }
      )
    }

    // Update modification request
    const { data: updated, error: updateError } = await supabase
      .from('booking_modification_requests')
      .update({
        status,
        captain_response: captainResponse || null,
        responded_at: new Date().toISOString(),
      })
      .eq('id', modificationId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      )
    }

    // If approved, apply modifications to booking
    if (status === 'approved') {
      const { error: applyError } = await supabase.rpc('apply_booking_modification', {
        modification_id: modificationId,
      })

      if (applyError) {
        console.error('Apply modification error:', applyError)
        return NextResponse.json(
          { error: 'Failed to apply modifications' },
          { status: 500 }
        )
      }
    }

    // Log status change
    await supabase.from('booking_logs').insert({
      booking_id: modRequest.booking_id,
      event_type: status === 'approved' ? 'modification_approved' : 'modification_rejected',
      details: `Captain ${status} modification request`,
      metadata: {
        modification_id: modificationId,
        captain_response: captainResponse,
      },
    })

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      booking_id: modRequest.booking_id,
      action: `${status}_modification`,
      entity_type: 'modification_request',
      entity_id: modificationId,
      changes: { status, captain_response: captainResponse },
    })

    return NextResponse.json({
      success: true,
      modification: updated,
      applied: status === 'approved',
    })
  } catch (error) {
    console.error('Modification update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
