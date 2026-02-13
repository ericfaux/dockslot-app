import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Get all templates for captain
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
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

    // Get templates
    const { data: templates, error: templatesError } = await supabase
      .from('availability_templates')
      .select('*')
      .eq('captain_id', profile.id)
      .order('is_default', { ascending: false })
      .order('name')

    if (templatesError) {
      console.error('Templates fetch error:', templatesError)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create new template
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
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

    const body = await req.json()
    const { name, weeklySchedule, isDefault } = body

    if (!name || !weeklySchedule) {
      return NextResponse.json(
        { error: 'Name and weekly schedule are required' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('availability_templates')
        .update({ is_default: false })
        .eq('captain_id', profile.id)
        .eq('is_default', true)
    }

    // Create template
    const { data: template, error: createError } = await supabase
      .from('availability_templates')
      .insert({
        captain_id: profile.id,
        name,
        weekly_schedule: weeklySchedule,
        is_default: isDefault || false,
      })
      .select()
      .single()

    if (createError) {
      console.error('Template creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error) {
    console.error('Template creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
