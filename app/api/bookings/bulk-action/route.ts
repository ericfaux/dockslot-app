import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendCancellationConfirmation } from '@/lib/email/resend'
import { format, parseISO } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
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

    // Parse request body
    const body = await request.json()
    const { action, booking_ids, data } = body

    if (!action || !booking_ids || !Array.isArray(booking_ids)) {
      return NextResponse.json(
        { error: 'Action and booking_ids array are required' },
        { status: 400 }
      )
    }

    // Verify all bookings belong to this captain
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, captain_id, status, guest_name, guest_email, scheduled_start, vessel_id, deposit_paid_cents, trip_type:trip_types(title)')
      .in('id', booking_ids)

    if (fetchError || !bookings) {
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    const unauthorizedBookings = bookings.filter(
      (b) => b.captain_id !== profile.id
    )
    if (unauthorizedBookings.length > 0) {
      return NextResponse.json(
        { error: 'Not authorized for some bookings' },
        { status: 403 }
      )
    }

    let successCount = 0
    let errors: string[] = []

    // Perform bulk action
    switch (action) {
      case 'cancel': {
        const reason = data?.reason || 'Cancelled by captain'

        // Fetch captain profile and email prefs for cancellation emails
        const { data: captainProfile } = await supabase
          .from('profiles')
          .select('business_name, full_name, phone')
          .eq('id', profile.id)
          .single()

        const { data: emailPrefs } = await supabase
          .from('email_preferences')
          .select('business_name_override, logo_url')
          .eq('captain_id', profile.id)
          .single()

        const displayName = emailPrefs?.business_name_override || captainProfile?.business_name || captainProfile?.full_name || 'Your Captain'

        for (const bookingId of booking_ids) {
          const { error } = await supabase
            .from('bookings')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', bookingId)

          if (error) {
            errors.push(`Failed to cancel ${bookingId}`)
          } else {
            // Log the cancellation
            await supabase.from('booking_logs').insert({
              booking_id: bookingId,
              entry_type: 'status_changed',
              description: `Bulk cancelled: ${reason}`,
              actor_type: 'captain',
              actor_id: user.id,
            })

            // Send cancellation email to guest
            const bookingData = bookings.find((b) => b.id === bookingId)
            if (bookingData && !bookingData.guest_email.includes('@placeholder.dockslot')) {
              const { data: guestToken } = await supabase
                .from('guest_tokens')
                .select('token')
                .eq('booking_id', bookingId)
                .single()

              const vesselRes = bookingData.vessel_id
                ? await supabase.from('vessels').select('name').eq('id', bookingData.vessel_id).single()
                : { data: null }

              const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dockslot.app'
              const managementUrl = guestToken
                ? `${appUrl}/manage/${guestToken.token}`
                : appUrl

              const tripType = Array.isArray(bookingData.trip_type) ? bookingData.trip_type[0] : bookingData.trip_type
              const refundInfo = bookingData.deposit_paid_cents > 0
                ? `A deposit of $${(bookingData.deposit_paid_cents / 100).toFixed(2)} was on file. Refund eligibility depends on the cancellation policy.`
                : undefined

              sendCancellationConfirmation({
                to: bookingData.guest_email,
                guestName: bookingData.guest_name,
                tripType: tripType?.title || 'Charter Trip',
                date: format(parseISO(bookingData.scheduled_start), 'EEEE, MMMM d, yyyy'),
                time: format(parseISO(bookingData.scheduled_start), 'h:mm a'),
                vessel: vesselRes.data?.name || 'Charter Vessel',
                captainName: displayName,
                reason,
                refundInfo,
                managementUrl,
                businessName: emailPrefs?.business_name_override || captainProfile?.business_name || undefined,
                logoUrl: emailPrefs?.logo_url || undefined,
              }).catch(err => {
                console.warn(`Failed to send cancellation email for booking ${bookingId}:`, err)
              })
            }

            successCount++
          }
        }
        break
      }

      case 'add_tag': {
        const tag = data?.tag
        if (!tag) {
          return NextResponse.json(
            { error: 'Tag is required for add_tag action' },
            { status: 400 }
          )
        }

        for (const bookingId of booking_ids) {
          // Fetch current tags
          const { data: booking } = await supabase
            .from('bookings')
            .select('tags')
            .eq('id', bookingId)
            .single()

          if (booking) {
            const currentTags = booking.tags || []
            if (!currentTags.includes(tag)) {
              const { error } = await supabase
                .from('bookings')
                .update({
                  tags: [...currentTags, tag],
                  updated_at: new Date().toISOString(),
                })
                .eq('id', bookingId)

              if (error) {
                errors.push(`Failed to tag ${bookingId}`)
              } else {
                successCount++
              }
            } else {
              successCount++ // Already has tag
            }
          }
        }
        break
      }

      case 'remove_tag': {
        const tag = data?.tag
        if (!tag) {
          return NextResponse.json(
            { error: 'Tag is required for remove_tag action' },
            { status: 400 }
          )
        }

        for (const bookingId of booking_ids) {
          // Fetch current tags
          const { data: booking } = await supabase
            .from('bookings')
            .select('tags')
            .eq('id', bookingId)
            .single()

          if (booking) {
            const currentTags = booking.tags || []
            const { error } = await supabase
              .from('bookings')
              .update({
                tags: currentTags.filter((t: string) => t !== tag),
                updated_at: new Date().toISOString(),
              })
              .eq('id', bookingId)

            if (error) {
              errors.push(`Failed to untag ${bookingId}`)
            } else {
              successCount++
            }
          }
        }
        break
      }

      case 'export': {
        // Already handled by export endpoint, this is a placeholder
        return NextResponse.json(
          { error: 'Use /api/bookings/export for CSV export' },
          { status: 400 }
        )
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      processed: booking_ids.length,
      succeeded: successCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Unexpected error in bulk action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
