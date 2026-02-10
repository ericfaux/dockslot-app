import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { sendTripReminder } from '@/lib/email/trip-reminders';
import { sendDayOfReminderSMS } from '@/lib/sms/notifications';
import { getMarineForecast } from '@/lib/weather/noaa';
import { addDays, format, startOfDay, endOfDay, parseISO } from 'date-fns';

/**
 * Cron job to send trip reminders
 * Runs daily and sends reminders for trips happening in 24h and/or 48h
 * Respects captain email preferences for timing and content
 *
 * Vercel Cron: Configure in vercel.json
 * Security: Optional CRON_SECRET check
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createSupabaseServiceClient();

  try {
    const now = new Date();
    const results: Array<{ bookingId: string; timing: string; status: string; error?: string }> = [];

    // Process both 24h and 48h reminders
    for (const timing of ['24h', '48h'] as const) {
      const daysAhead = timing === '24h' ? 1 : 2;
      const targetDay = addDays(now, daysAhead);
      const targetStart = startOfDay(targetDay);
      const targetEnd = endOfDay(targetDay);
      const sentAtColumn = timing === '24h' ? 'reminder_sent_at' : 'reminder_48h_sent_at';

      // Find confirmed/rescheduled bookings in the target window
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, guest_name, guest_email, guest_phone, party_size, scheduled_start, management_token, captain_id, trip_type_id, vessel_id, reminder_sent_at, reminder_48h_sent_at')
        .in('status', ['confirmed', 'rescheduled'])
        .gte('scheduled_start', targetStart.toISOString())
        .lte('scheduled_start', targetEnd.toISOString())
        .is(sentAtColumn, null);

      if (bookingsError) {
        console.error(`Error fetching bookings for ${timing} reminders:`, bookingsError);
        continue;
      }

      if (!bookings || bookings.length === 0) continue;

      for (const booking of bookings) {
        try {
          // Fetch captain email preferences
          const { data: prefs } = await supabase
            .from('email_preferences')
            .select('*')
            .eq('captain_id', booking.captain_id)
            .single();

          // Check if trip reminders are enabled
          if (prefs && !prefs.trip_reminder_enabled) {
            results.push({ bookingId: booking.id, timing, status: 'skipped_disabled' });
            continue;
          }

          // Check if this timing is selected
          const selectedTimings = prefs?.trip_reminder_timing || ['24h'];
          if (!selectedTimings.includes(timing)) {
            results.push({ bookingId: booking.id, timing, status: 'skipped_timing' });
            continue;
          }

          // Fetch related data
          const [profileRes, tripTypeRes, vesselRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, business_name, meeting_spot_name, meeting_spot_address, meeting_spot_instructions, meeting_spot_latitude, meeting_spot_longitude, phone, timezone')
              .eq('id', booking.captain_id)
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

          // Format date/time in captain's timezone
          const tz = profile?.timezone || 'America/New_York';
          const formattedDate = format(parseISO(booking.scheduled_start), 'EEEE, MMMM d, yyyy');
          const formattedTime = format(parseISO(booking.scheduled_start), 'h:mm a');
          const managementUrl = `${process.env.NEXT_PUBLIC_APP_URL}/manage/${booking.management_token}`;

          // Build meeting spot
          let meetingSpot = profile?.meeting_spot_name || 'Marina';
          if (profile?.meeting_spot_address) {
            meetingSpot += ` - ${profile.meeting_spot_address}`;
          }

          // Fetch weather forecast if coordinates available
          let weatherForecast: string | undefined;
          let weatherTemp: string | undefined;
          let weatherWind: string | undefined;

          if (profile?.meeting_spot_latitude && profile?.meeting_spot_longitude) {
            try {
              const forecast = await getMarineForecast(
                profile.meeting_spot_latitude,
                profile.meeting_spot_longitude
              );
              if (forecast && forecast.periods.length > 0) {
                const period = forecast.periods[0];
                weatherForecast = period.shortForecast;
                weatherTemp = `${period.temperature}°${period.temperatureUnit}`;
                weatherWind = `${period.windSpeed} ${period.windDirection}`;
              }
            } catch (weatherErr) {
              console.error(`Weather fetch failed for booking ${booking.id}:`, weatherErr);
            }
          }

          // Check waiver status
          let waiverUrl: string | undefined;
          let waiverSigned = true;

          const { data: waiverTemplate } = await supabase
            .from('waiver_templates')
            .select('id')
            .eq('owner_id', booking.captain_id)
            .eq('is_active', true)
            .limit(1)
            .single();

          if (waiverTemplate) {
            const { data: signature } = await supabase
              .from('waiver_signatures')
              .select('id')
              .eq('booking_id', booking.id)
              .limit(1)
              .single();

            if (!signature) {
              waiverSigned = false;
              waiverUrl = `${managementUrl}#waiver`;
            }
          }

          // Resolve captain phone — use override only if it's not placeholder text
          const phoneOverride = prefs?.business_phone_override || '';
          const isPlaceholderPhone = phoneOverride.includes('(555) 123-4567');
          const resolvedPhone = (!isPlaceholderPhone && phoneOverride) ? phoneOverride : (profile?.phone || undefined);

          // Send the reminder email
          const emailResult = await sendTripReminder({
            to: booking.guest_email,
            guestName: booking.guest_name,
            tripType: tripType?.title || 'Charter Trip',
            date: formattedDate,
            time: formattedTime,
            vessel: vessel?.name || 'Charter Vessel',
            meetingSpot,
            meetingSpotInstructions: profile?.meeting_spot_instructions || undefined,
            captainName: profile?.full_name || profile?.business_name || 'Your Captain',
            captainPhone: resolvedPhone,
            passengerCount: booking.party_size || 1,
            managementUrl,
            waiverUrl,
            waiverSigned,
            weatherForecast,
            weatherTemp,
            weatherWind,
            whatToBring: prefs?.custom_what_to_bring || undefined,
            businessName: prefs?.business_name_override || profile?.business_name || undefined,
            logoUrl: prefs?.logo_url || undefined,
            emailSignature: prefs?.email_signature || undefined,
            reminderTiming: timing,
          });

          if (!emailResult.success) {
            console.error(`Failed to send ${timing} reminder for booking ${booking.id}:`, emailResult.error);
            results.push({ bookingId: booking.id, timing, status: 'email_failed', error: emailResult.error });
            continue;
          }

          // Mark reminder as sent
          await supabase
            .from('bookings')
            .update({ [sentAtColumn]: new Date().toISOString() })
            .eq('id', booking.id);

          // Log the reminder
          await supabase.from('booking_logs').insert({
            booking_id: booking.id,
            actor: 'system',
            entry_type: 'guest_communication',
            entry_text: `${timing} trip reminder email sent to ${booking.guest_email}`,
            metadata: {
              email_id: emailResult.messageId,
              email_type: 'trip_reminder',
              timing,
              scheduled_date: booking.scheduled_start,
            },
          });

          // Send SMS day-of reminder if 24h and enabled
          if (timing === '24h' && booking.guest_phone) {
            const smsEnabled = !prefs || prefs.sms_day_of_reminder;
            if (smsEnabled) {
              try {
                await sendDayOfReminderSMS({
                  to: booking.guest_phone,
                  guestName: booking.guest_name,
                  tripType: tripType?.title || 'Charter Trip',
                  time: formattedTime,
                  meetingSpot,
                  captainPhone: profile?.phone || undefined,
                  managementUrl,
                });
              } catch (smsErr) {
                console.error(`SMS failed for booking ${booking.id}:`, smsErr);
              }
            }
          }

          results.push({ bookingId: booking.id, timing, status: 'sent' });
        } catch (err) {
          console.error(`Error processing ${timing} reminder for booking ${booking.id}:`, err);
          results.push({
            bookingId: booking.id,
            timing,
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status === 'email_failed' || r.status === 'error').length;

    console.log(`Trip reminders: ${sent} sent, ${failed} failed, ${results.length} total processed`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: results.length,
      results,
    });
  } catch (error) {
    console.error('Error in send-reminders cron job:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
