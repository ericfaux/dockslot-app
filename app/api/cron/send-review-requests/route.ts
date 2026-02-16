import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { sendReviewRequest } from '@/lib/email/review-requests';

/**
 * Cron job: Send review requests for recently completed trips
 * Runs daily at 10 AM UTC
 * Sends emails to guests whose trips were completed 1 day ago
 *
 * Uses service client (not session client) since cron jobs run without auth.
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServiceClient();

    // Calculate date range: trips completed yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find completed trips from yesterday that don't have reviews yet
    // and haven't already received a review request
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        guest_name,
        guest_email,
        scheduled_start,
        management_token,
        captain_id,
        vessel_id,
        trip_type_id,
        review_request_sent_at,
        profile:profiles!captain_id!inner(subscription_tier)
      `)
      .eq('status', 'completed')
      .gte('scheduled_start', yesterday.toISOString())
      .lt('scheduled_start', today.toISOString())
      .is('review_request_sent_at', null)
      .in('profile.subscription_tier', ['captain', 'fleet']);

    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No trips eligible for review requests',
        sent: 0,
      });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const booking of bookings) {
      try {
        if (!booking.guest_email) {
          failCount++;
          continue;
        }

        // Check captain email preferences
        const { data: prefs } = await supabase
          .from('email_preferences')
          .select('review_request_enabled')
          .eq('captain_id', booking.captain_id)
          .single();

        if (prefs && !prefs.review_request_enabled) {
          results.push({ booking_id: booking.id, status: 'skipped', reason: 'disabled by captain' });
          continue;
        }

        // Check if review already exists for this booking
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('booking_id', booking.id)
          .single();

        if (existingReview) {
          results.push({ booking_id: booking.id, status: 'skipped', reason: 'review exists' });
          continue;
        }

        // Fetch related data
        const [vesselRes, tripTypeRes, profileRes] = await Promise.all([
          supabase.from('vessels').select('name').eq('id', booking.vessel_id).single(),
          supabase.from('trip_types').select('title').eq('id', booking.trip_type_id).single(),
          supabase.from('profiles').select('business_name, full_name').eq('id', booking.captain_id).single(),
        ]);

        const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dockslot-app.vercel.app'}/review/${booking.management_token}`;

        const result = await sendReviewRequest({
          to: booking.guest_email,
          guestName: booking.guest_name,
          tripType: tripTypeRes.data?.title || 'Your trip',
          vesselName: vesselRes.data?.name || 'Charter Vessel',
          tripDate: new Date(booking.scheduled_start).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          captainName: profileRes.data?.business_name || profileRes.data?.full_name || 'us',
          reviewUrl,
        });

        if (result.success) {
          // Mark review request as sent
          await supabase
            .from('bookings')
            .update({ review_request_sent_at: new Date().toISOString() })
            .eq('id', booking.id);

          // Log in booking_logs
          await supabase.from('booking_logs').insert({
            booking_id: booking.id,
            actor: 'system',
            entry_type: 'guest_communication',
            entry_text: 'Review request email sent',
            metadata: {
              email_type: 'review_request',
              email_id: result.messageId,
              sent_at: new Date().toISOString(),
            },
          });

          successCount++;
          results.push({ booking_id: booking.id, status: 'sent' });
        } else {
          failCount++;
          results.push({ booking_id: booking.id, status: 'failed', error: result.error });
        }
      } catch (error) {
        console.error(`Failed to send review request for booking ${booking.id}:`, error);
        failCount++;
        results.push({
          booking_id: booking.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Review requests processed: ${successCount} sent, ${failCount} failed`,
      sent: successCount,
      failed: failCount,
      total: bookings.length,
      results,
    });
  } catch (error) {
    console.error('Review request cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
