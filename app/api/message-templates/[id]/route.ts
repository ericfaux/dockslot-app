import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify ownership
    const { data: template } = await supabase
      .from('message_templates')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (!template || template.owner_id !== profile.id) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, subject, body: templateBody, category } = body

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (name !== undefined) updates.name = name
    if (subject !== undefined) updates.subject = subject
    if (templateBody !== undefined) updates.body = templateBody
    if (category !== undefined) updates.category = category

    const { data, error } = await supabase
      .from('message_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ template: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify ownership
    const { data: template } = await supabase
      .from('message_templates')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (!template || template.owner_id !== profile.id) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json(
        { error: 'Failed to delete template' },
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Increment use count
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await supabase.rpc('increment', {
      row_id: id,
      table_name: 'message_templates',
      column_name: 'use_count',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error incrementing use count:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
