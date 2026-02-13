import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendCustomGuestMessage } from '@/lib/email/resend'

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

    const { id: bookingId } = await context.params
    const body = await req.json()
    const { subject, message, templateId } = body

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      )
    }

    // Get booking with guest details and captain info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        captain_profiles!inner(id, full_name, email),
        vessels(name),
        trip_types(name)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify ownership
    if (booking.captain_profiles.id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!booking.guest_email) {
      return NextResponse.json(
        { error: 'Guest email not found' },
        { status: 400 }
      )
    }

    // Send email via Resend
    const captainName = booking.captain_profiles.full_name || undefined
    const captainEmail = booking.captain_profiles.email || user.email || undefined

    const emailResult = await sendCustomGuestMessage({
      to: booking.guest_email,
      guestName: booking.guest_name,
      subject,
      message,
      bookingId: booking.id,
      captainName,
      captainEmail,
    })

    if (!emailResult.success) {
      console.error('Email send failed:', emailResult.error)
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    // Log the communication in booking_logs
    await supabase.from('booking_logs').insert({
      booking_id: bookingId,
      event_type: 'guest_communication',
      details: `Email sent: ${subject}`,
      metadata: {
        subject,
        message_preview: message.substring(0, 100),
        template_id: templateId || null,
      },
    })

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      booking_id: bookingId,
      action: 'sent_message',
      entity_type: 'booking',
      entity_id: bookingId,
      changes: {
        subject,
        recipient: booking.guest_email,
      },
    })

    // If template was used, increment use count
    if (templateId) {
      await supabase.rpc('increment_template_use_count', {
        template_id: templateId,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
