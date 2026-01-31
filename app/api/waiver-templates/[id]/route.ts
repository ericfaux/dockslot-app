import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()

    const { data: template, error: templateError } = await supabase
      .from('waiver_templates')
      .select('*, profiles!inner(user_id)')
      .eq('id', id)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const profile = template.profiles as any
    if (profile.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates: Record<string, any> = {}
    if ('name' in body) updates.name = body.name
    if ('content' in body) updates.content = body.content
    if ('isActive' in body) updates.is_active = body.isActive
    if ('isDefault' in body) {
      updates.is_default = body.isDefault
      if (body.isDefault) {
        await supabase
          .from('waiver_templates')
          .update({ is_default: false })
          .eq('captain_id', template.captain_id)
          .eq('is_default', true)
          .neq('id', id)
      }
    }

    const { data: updated, error } = await supabase
      .from('waiver_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    return NextResponse.json({ success: true, template: updated })
  } catch (error) {
    console.error('Template update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const { data: template, error: templateError } = await supabase
      .from('waiver_templates')
      .select('*, profiles!inner(user_id)')
      .eq('id', id)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const profile = template.profiles as any
    if (profile.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('waiver_templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Template delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
