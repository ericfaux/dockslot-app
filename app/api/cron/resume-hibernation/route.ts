import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { sendHibernationEndNotification, sendCaptainHibernationEndNotification } from '@/lib/email/hibernation';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Cron job to automatically resume hibernating captains
 * Runs every hour to check for scheduled hibernation end times
 *
 * Vercel Cron: Configure in vercel.json
 * Security: Optional CRON_SECRET check
 */
export async function GET(request: NextRequest) {
  // Optional: Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createSupabaseServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dockslot.app';

  try {
    const now = new Date();
    const todayDate = format(now, 'yyyy-MM-dd');

    // Find all hibernating profiles with an end date of today or earlier
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, business_name, email, timezone, hibernation_end_date, hibernation_resume_time, hibernation_allow_notifications')
      .eq('is_hibernating', true)
      .not('hibernation_end_date', 'is', null)
      .lte('hibernation_end_date', todayDate);

    if (profilesError) {
      console.error('Error fetching hibernating profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hibernations to resume',
        resumed: 0,
      });
    }

    const results = await Promise.allSettled(
      profiles.map(async (profile) => {
        // Check if resume time has passed (if specified)
        if (profile.hibernation_resume_time && profile.hibernation_end_date === todayDate) {
          const timezone = profile.timezone || 'America/New_York';
          const nowInTimezone = toZonedTime(now, timezone);
          const currentTime = format(nowInTimezone, 'HH:mm');

          // If resume time hasn't passed yet, skip this profile
          if (currentTime < profile.hibernation_resume_time) {
            return { skipped: true, profileId: profile.id, reason: 'Resume time not reached' };
          }
        }

        // Resume hibernation (set is_hibernating to false)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            is_hibernating: false,
            hibernation_end_date: null,
            hibernation_resume_time: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`Error resuming hibernation for ${profile.id}:`, updateError);
          throw new Error(`Failed to update profile: ${updateError.message}`);
        }

        // Get subscribers who want to be notified
        let notifiedCount = 0;
        if (profile.hibernation_allow_notifications) {
          const { data: subscribers } = await supabase
            .from('hibernation_subscribers')
            .select('id, email, name')
            .eq('captain_id', profile.id)
            .is('unsubscribed_at', null)
            .is('notified_at', null);

          if (subscribers && subscribers.length > 0) {
            const businessName = profile.business_name || profile.full_name || 'Your Captain';
            const bookingUrl = `${appUrl}/book/${profile.id}`;

            // Send notifications to all subscribers
            const notificationResults = await Promise.allSettled(
              subscribers.map(async (sub) => {
                const result = await sendHibernationEndNotification({
                  to: sub.email,
                  subscriberName: sub.name,
                  businessName,
                  bookingUrl,
                });

                if (result.success) {
                  // Mark as notified
                  await supabase
                    .from('hibernation_subscribers')
                    .update({ notified_at: new Date().toISOString() })
                    .eq('id', sub.id);
                }

                return result;
              })
            );

            notifiedCount = notificationResults.filter(r => r.status === 'fulfilled').length;
          }
        }

        // Send notification to captain
        if (profile.email) {
          const captainName = profile.full_name || 'Captain';
          const businessName = profile.business_name || profile.full_name || 'Your Business';
          const dashboardUrl = `${appUrl}/dashboard`;

          await sendCaptainHibernationEndNotification({
            to: profile.email,
            captainName,
            businessName,
            subscriberCount: notifiedCount,
            dashboardUrl,
          });
        }

        return {
          profileId: profile.id,
          businessName: profile.business_name || profile.full_name,
          subscribersNotified: notifiedCount,
        };
      })
    );

    // Count successes and failures
    const successful = results.filter(
      (r) => r.status === 'fulfilled' && !(r.value as { skipped?: boolean }).skipped
    ).length;
    const skipped = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as { skipped?: boolean }).skipped
    ).length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`Hibernation resume: ${successful} resumed, ${skipped} skipped, ${failed} failed`);

    return NextResponse.json({
      success: true,
      resumed: successful,
      skipped,
      failed,
      total: profiles.length,
      results: results.map((r, i) => ({
        profileId: profiles[i].id,
        status: r.status,
        ...(r.status === 'fulfilled' ? { data: r.value } : { error: r.reason?.message }),
      })),
    });
  } catch (error) {
    console.error('Error in resume-hibernation cron job:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
