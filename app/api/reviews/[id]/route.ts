import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Update review (captain only - feature, respond, toggle visibility)
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

    const { id: reviewId } = await context.params
    const body = await req.json()

    // Get review to verify ownership
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        *,
        captain_profiles!inner(id)
      `)
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Verify ownership
    if ((review.captain_profiles as any).id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build updates
    const updates: Record<string, any> = {}
    
    if ('is_featured' in body) {
      updates.is_featured = body.is_featured
    }
    if ('is_public' in body) {
      updates.is_public = body.is_public
    }
    if ('is_approved' in body) {
      updates.is_approved = body.is_approved
    }
    if ('captain_response' in body) {
      updates.captain_response = body.captain_response
      updates.captain_response_at = new Date().toISOString()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Update review
    const { data: updated, error: updateError } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single()

    if (updateError) {
      console.error('Review update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      )
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'updated_review',
      entity_type: 'review',
      entity_id: reviewId,
      changes: updates,
    })

    return NextResponse.json({
      success: true,
      review: updated,
    })
  } catch (error) {
    console.error('Review update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete review (captain only)
export async function DELETE(
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

    const { id: reviewId } = await context.params

    // Get review to verify ownership
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        *,
        captain_profiles!inner(id)
      `)
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Verify ownership
    if ((review.captain_profiles as any).id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete review
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (deleteError) {
      console.error('Review delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete review' },
        { status: 500 }
      )
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'deleted_review',
      entity_type: 'review',
      entity_id: reviewId,
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Review delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
