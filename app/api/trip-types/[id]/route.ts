import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    const { id: tripTypeId } = await context.params
    const body = await req.json()

    // Get trip type to verify ownership
    const { data: tripType, error: tripTypeError } = await supabase
      .from('trip_types')
      .select('captain_id')
      .eq('id', tripTypeId)
      .single()

    if (tripTypeError || !tripType) {
      return NextResponse.json({ error: 'Trip type not found' }, { status: 404 })
    }

    // Verify captain owns this trip type
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.id !== tripType.captain_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update trip type
    const updates: Record<string, any> = {}
    
    if ('cancellation_policy_hours' in body) {
      updates.cancellation_policy_hours = body.cancellation_policy_hours
    }
    if ('cancellation_refund_percentage' in body) {
      updates.cancellation_refund_percentage = body.cancellation_refund_percentage
    }
    if ('cancellation_policy_text' in body) {
      updates.cancellation_policy_text = body.cancellation_policy_text
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('trip_types')
      .update(updates)
      .eq('id', tripTypeId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update trip type' }, { status: 500 })
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'updated_trip_type_policy',
      entity_type: 'trip_type',
      entity_id: tripTypeId,
      changes: updates,
    })

    return NextResponse.json({
      success: true,
      trip_type: updated,
    })
  } catch (error) {
    console.error('Trip type update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
