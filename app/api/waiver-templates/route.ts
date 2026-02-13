import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Get all waiver templates for captain
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { data: templates, error } = await supabase
      .from('waiver_templates')
      .select('*')
      .eq('captain_id', profile.id)
      .order('is_default', { ascending: false })
      .order('name')

    if (error) {
      console.error('Templates fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error('Waiver templates GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new waiver template
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, content, isDefault } = body

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      )
    }

    // If setting as default, unset others
    if (isDefault) {
      await supabase
        .from('waiver_templates')
        .update({ is_default: false })
        .eq('captain_id', profile.id)
        .eq('is_default', true)
    }

    const { data: template, error } = await supabase
      .from('waiver_templates')
      .insert({
        captain_id: profile.id,
        name,
        content,
        is_default: isDefault || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Template creation error:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error('Waiver template creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
