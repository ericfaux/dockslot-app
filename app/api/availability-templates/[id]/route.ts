import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Update template
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

    const { id: templateId } = await context.params
    const body = await req.json()

    // Get template to verify ownership
    const { data: template, error: templateError } = await supabase
      .from('availability_templates')
      .select(`
        *,
        profiles!inner(user_id)
      `)
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Verify ownership
    const profile = template.profiles as any
    if (profile.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build updates
    const updates: Record<string, any> = {}
    if ('name' in body) updates.name = body.name
    if ('weeklySchedule' in body) updates.weekly_schedule = body.weeklySchedule
    if ('isDefault' in body) {
      updates.is_default = body.isDefault
      
      // If setting as default, unset others
      if (body.isDefault) {
        await supabase
          .from('availability_templates')
          .update({ is_default: false })
          .eq('captain_id', template.captain_id)
          .eq('is_default', true)
          .neq('id', templateId)
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Update template
    const { data: updated, error: updateError } = await supabase
      .from('availability_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      template: updated,
    })
  } catch (error) {
    console.error('Template update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete template
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

    const { id: templateId } = await context.params

    // Get template to verify ownership
    const { data: template, error: templateError } = await supabase
      .from('availability_templates')
      .select(`
        *,
        profiles!inner(user_id)
      `)
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Verify ownership
    const profile = template.profiles as any
    if (profile.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete template
    const { error: deleteError } = await supabase
      .from('availability_templates')
      .delete()
      .eq('id', templateId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Template delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Apply template to date range
export async function POST(
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

    const { id: templateId } = await context.params
    const body = await req.json()
    const { startDate, endDate } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    // Get template to verify ownership
    const { data: template, error: templateError } = await supabase
      .from('availability_templates')
      .select(`
        *,
        profiles!inner(user_id)
      `)
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Verify ownership
    const profile = template.profiles as any
    if (profile.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Apply template using database function
    const { data: slotsCreated, error: applyError } = await supabase
      .rpc('apply_availability_template', {
        template_id_param: templateId,
        start_date_param: startDate,
        end_date_param: endDate,
      })

    if (applyError) {
      console.error('Apply template error:', applyError)
      return NextResponse.json(
        { error: 'Failed to apply template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      slotsCreated,
    })
  } catch (error) {
    console.error('Apply template error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
