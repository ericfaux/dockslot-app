import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, isValidPhoneNumber } from '@/lib/sms/twilio'

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
    const { message, templateId } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get booking with guest details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        captain_profiles!inner(id),
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

    if (!booking.guest_phone) {
      return NextResponse.json(
        { error: 'Guest phone number not found' },
        { status: 400 }
      )
    }

    // Validate phone number
    if (!isValidPhoneNumber(booking.guest_phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Send SMS via Twilio
    const result = await sendSMS({
      to: booking.guest_phone,
      message,
    })

    if (!result.success) {
      console.error('SMS send failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to send SMS' },
        { status: 500 }
      )
    }

    // Log the communication in booking_logs
    await supabase.from('booking_logs').insert({
      booking_id: bookingId,
      event_type: 'guest_communication',
      details: `SMS sent`,
      metadata: {
        message_preview: message.substring(0, 100),
        template_id: templateId || null,
        twilio_sid: result.messageId,
        method: 'sms',
      },
    })

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      booking_id: bookingId,
      action: 'sent_sms',
      entity_type: 'booking',
      entity_id: bookingId,
      changes: {
        recipient: booking.guest_phone,
        message_length: message.length,
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
      message: 'SMS sent successfully',
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('Send SMS error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
