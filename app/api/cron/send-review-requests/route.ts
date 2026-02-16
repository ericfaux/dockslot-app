import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { sendReviewRequest } from '@/lib/email/review-requests';

const TIMING_OFFSETS_MS: Record<string, number> = {
  immediate: 0,
  '8h': 8 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '48h': 48 * 60 * 60 * 1000,
};

/**
 * Cron job: Send review requests for completed trips
 * Runs hourly to support variable timing (immediate, 8h, 24h, 48h)
 *
 * For each completed booking where no review request has been sent yet,
 * checks the captain's chosen timing offset against scheduled_end.
 * Only sends if scheduled_end + offset <= now.
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
    const now = new Date();

    // Safety cap: only consider bookings that ended in the last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find completed bookings that haven't received a review request yet
    // and ended within the last 7 days
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        guest_name,
        guest_email,
        scheduled_start,
        scheduled_end,
        management_token,
        captain_id,
        vessel_id,
        trip_type_id,
        review_request_sent_at,
        profile:profiles!captain_id!inner(subscription_tier)
      `)
      .eq('status', 'completed')
      .gte('scheduled_end', sevenDaysAgo.toISOString())
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

    // Batch-fetch captain preferences to reduce DB round trips
    const captainIds = [...new Set(bookings.map((b) => b.captain_id))];
    const { data: allPrefs } = await supabase
      .from('email_preferences')
      .select(
        'captain_id, review_request_enabled, review_request_timing, review_request_custom_message, google_review_link, include_google_review_link'
      )
      .in('captain_id', captainIds);

    const prefsMap = new Map(
      (allPrefs || []).map((p) => [p.captain_id, p])
    );

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const booking of bookings) {
      try {
        if (!booking.guest_email) {
          failCount++;
          continue;
        }

        // Get captain preferences (defaults if not set)
        const prefs = prefsMap.get(booking.captain_id);
        const reviewEnabled = prefs ? prefs.review_request_enabled : true;
        const timing = prefs?.review_request_timing || '24h';

        if (!reviewEnabled) {
          results.push({
            booking_id: booking.id,
            status: 'skipped',
            reason: 'disabled by captain',
          });
          continue;
        }

        // Check if timing offset has elapsed since scheduled_end
        const scheduledEnd = new Date(booking.scheduled_end);
        const offsetMs = TIMING_OFFSETS_MS[timing] ?? TIMING_OFFSETS_MS['24h'];
        const sendAfter = new Date(scheduledEnd.getTime() + offsetMs);

        if (now < sendAfter) {
          // Not time yet — skip
          results.push({
            booking_id: booking.id,
            status: 'skipped',
            reason: `waiting until ${sendAfter.toISOString()} (timing: ${timing})`,
          });
          continue;
        }

        // Check if review already exists for this booking
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('booking_id', booking.id)
          .single();

        if (existingReview) {
          results.push({
            booking_id: booking.id,
            status: 'skipped',
            reason: 'review exists',
          });
          continue;
        }

        // Fetch related data
        const [vesselRes, tripTypeRes, profileRes] = await Promise.all([
          supabase
            .from('vessels')
            .select('name')
            .eq('id', booking.vessel_id)
            .single(),
          supabase
            .from('trip_types')
            .select('title')
            .eq('id', booking.trip_type_id)
            .single(),
          supabase
            .from('profiles')
            .select('business_name, full_name')
            .eq('id', booking.captain_id)
            .single(),
        ]);

        const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dockslot-app.vercel.app'}/review/${booking.management_token}`;

        const result = await sendReviewRequest({
          to: booking.guest_email,
          guestName: booking.guest_name,
          tripType: tripTypeRes.data?.title || 'Your trip',
          vesselName: vesselRes.data?.name || 'Charter Vessel',
          tripDate: new Date(booking.scheduled_start).toLocaleDateString(
            'en-US',
            {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }
          ),
          captainName:
            profileRes.data?.business_name ||
            profileRes.data?.full_name ||
            'us',
          reviewUrl,
          customMessage: prefs?.review_request_custom_message || null,
          googleReviewLink: prefs?.google_review_link || null,
          includeGoogleReviewLink:
            prefs?.include_google_review_link || false,
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
              timing,
              sent_at: new Date().toISOString(),
            },
          });

          successCount++;
          results.push({ booking_id: booking.id, status: 'sent' });
        } else {
          failCount++;
          results.push({
            booking_id: booking.id,
            status: 'failed',
            error: result.error,
          });
        }
      } catch (error) {
        console.error(
          `Failed to send review request for booking ${booking.id}:`,
          error
        );
        failCount++;
        results.push({
          booking_id: booking.id,
          status: 'error',
          error:
            error instanceof Error ? error.message : 'Unknown error',
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
