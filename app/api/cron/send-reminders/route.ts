import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { sendTripReminder } from '@/lib/email/trip-reminders';
import { addDays, format, startOfDay, endOfDay, parseISO } from 'date-fns';

/**
 * Cron job to send trip reminders
 * Runs daily and sends reminders for trips happening in 24 hours
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

  try {
    // Calculate tomorrow's date range
    const tomorrow = addDays(new Date(), 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);

    // Find all confirmed/rescheduled bookings happening tomorrow
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, guest_name, guest_email, party_size, scheduled_start, management_token, reminder_sent_at, profile_id, trip_type_id, vessel_id')
      .in('status', ['confirmed', 'rescheduled'])
      .gte('scheduled_start', tomorrowStart.toISOString())
      .lte('scheduled_start', tomorrowEnd.toISOString())
      .is('reminder_sent_at', null); // Only send to those who haven't received reminder

    if (bookingsError) {
      console.error('Error fetching bookings for reminders:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No reminders to send',
        sent: 0,
      });
    }

    // Send reminder for each booking
    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        const managementUrl = `${process.env.NEXT_PUBLIC_APP_URL}/manage/${booking.management_token}`;
        const formattedDate = format(parseISO(booking.scheduled_start), 'EEEE, MMMM d, yyyy');
        const formattedTime = format(parseISO(booking.scheduled_start), 'h:mm a');

        // Fetch related data
        const [profileRes, tripTypeRes, vesselRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, business_name, meeting_spot_name, meeting_spot_address, phone')
            .eq('id', booking.profile_id)
            .single(),
          supabase
            .from('trip_types')
            .select('title')
            .eq('id', booking.trip_type_id)
            .single(),
          supabase
            .from('vessels')
            .select('name')
            .eq('id', booking.vessel_id)
            .single(),
        ]);

        const profile = profileRes.data;
        const tripType = tripTypeRes.data;
        const vessel = vesselRes.data;

        // Determine meeting spot description
        let meetingSpot = profile?.meeting_spot_name || 'Marina';
        if (profile?.meeting_spot_address) {
          meetingSpot += ` - ${profile.meeting_spot_address}`;
        }

        // Send reminder email
        const emailResult = await sendTripReminder({
          to: booking.guest_email,
          guestName: booking.guest_name,
          tripType: tripType?.title || 'Charter Trip',
          date: formattedDate,
          time: formattedTime,
          vessel: vessel?.name || 'Charter Vessel',
          meetingSpot,
          captainName: profile?.full_name || profile?.business_name || 'Your Captain',
          captainPhone: profile?.phone,
          passengerCount: booking.party_size || 1,
          managementUrl,
        });

        if (!emailResult.success) {
          console.error(`Failed to send reminder for booking ${booking.id}:`, emailResult.error);
          throw new Error(emailResult.error || 'Email send failed');
        }

        // Mark reminder as sent
        await supabase
          .from('bookings')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', booking.id);

        // Log the reminder
        await supabase.from('booking_logs').insert({
          booking_id: booking.id,
          actor: 'system',
          entry_type: 'reminder_sent',
          entry_text: `24-hour reminder email sent to ${booking.guest_email}`,
          metadata: {
            email_id: emailResult.messageId,
            scheduled_date: booking.scheduled_start,
          },
        });

        return { bookingId: booking.id, email: booking.guest_email };
      })
    );

    // Count successes and failures
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`Trip reminders sent: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: bookings.length,
      results: results.map((r, i) => ({
        bookingId: bookings[i].id,
        status: r.status,
        error: r.status === 'rejected' ? r.reason?.message : undefined,
      })),
    });
  } catch (error) {
    console.error('Error in send-reminders cron job:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
