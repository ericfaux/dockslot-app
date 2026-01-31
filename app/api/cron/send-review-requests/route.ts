import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendReviewRequest } from '@/lib/email/review-requests'

/**
 * Cron job: Send review requests for recently completed trips
 * Runs daily at 10 AM UTC
 * Sends emails to guests whose trips were completed 1 day ago
 */
export async function GET(req: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Calculate date range: trips completed yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find completed trips from yesterday that don't have reviews yet
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        guest_name,
        guest_email,
        scheduled_start,
        management_token,
        vessels(name),
        trip_types(title),
        captain_profiles(business_name),
        reviews(id)
      `)
      .eq('status', 'completed')
      .gte('scheduled_start', yesterday.toISOString())
      .lt('scheduled_start', today.toISOString())
      .is('reviews.id', null) // No review submitted yet

    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No trips eligible for review requests',
        sent: 0,
      })
    }

    const results = []
    let successCount = 0
    let failCount = 0

    // Send review request emails
    for (const booking of bookings) {
      try {
        if (!booking.guest_email) {
          console.log(`No email for booking ${booking.id}, skipping`)
          failCount++
          continue
        }

        const vessel = booking.vessels as any
        const tripType = booking.trip_types as any
        const captain = booking.captain_profiles as any

        const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dockslot-app.vercel.app'}/review/${booking.management_token}`

        const result = await sendReviewRequest({
          to: booking.guest_email,
          guestName: booking.guest_name,
          tripType: tripType?.title || 'Your trip',
          vesselName: vessel?.name || 'Unknown',
          tripDate: new Date(booking.scheduled_start).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          captainName: captain?.business_name || 'us',
          reviewUrl,
        })

        if (result.success) {
          // Log in booking_logs
          await supabase.from('booking_logs').insert({
            booking_id: booking.id,
            event_type: 'guest_communication',
            details: 'Review request email sent',
            metadata: {
              email_type: 'review_request',
              sent_at: new Date().toISOString(),
            },
          })

          successCount++
          results.push({
            booking_id: booking.id,
            guest_email: booking.guest_email,
            status: 'sent',
          })
        } else {
          failCount++
          results.push({
            booking_id: booking.id,
            guest_email: booking.guest_email,
            status: 'failed',
            error: result.error,
          })
        }
      } catch (error) {
        console.error(`Failed to send review request for booking ${booking.id}:`, error)
        failCount++
        results.push({
          booking_id: booking.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Review requests processed: ${successCount} sent, ${failCount} failed`,
      sent: successCount,
      failed: failCount,
      total: bookings.length,
      results,
    })
  } catch (error) {
    console.error('Review request cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
