import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { checkMarineConditions, generateWeatherHoldReason } from '@/lib/weather/noaa';
import { sendEmail } from '@/lib/email/resend';
import { addDays, parseISO, differenceInHours } from 'date-fns';

/**
 * Cron endpoint: Check weather for upcoming trips
 * Run daily via Vercel Cron or external service
 * 
 * Checks all bookings in next 48 hours for unsafe weather
 * Notifies captain if action needed
 */
export async function GET(request: NextRequest) {
  // Verify cron authorization (Vercel sets this header)
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  if (process.env.CRON_SECRET && authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    
    // Get bookings in next 24-48 hours
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const dayAfter = addDays(now, 2);

    const { data: upcomingBookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        captain_id,
        scheduled_start,
        guest_name,
        guest_email,
        trip_type:trip_types(title),
        profile:profiles!captain_id(business_name, full_name, email, meeting_spot_latitude, meeting_spot_longitude)
      `)
      .in('status', ['confirmed', 'pending_deposit'])
      .gte('scheduled_start', tomorrow.toISOString())
      .lte('scheduled_start', dayAfter.toISOString());

    if (error) {
      console.error('Failed to fetch bookings:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const results = [];

    for (const booking of upcomingBookings || []) {
      const profile = Array.isArray(booking.profile) ? booking.profile[0] : booking.profile;
      const tripType = Array.isArray(booking.trip_type) ? booking.trip_type[0] : booking.trip_type;
      
      // Skip if no lat/lon (can't check weather)
      if (!profile?.meeting_spot_latitude || !profile?.meeting_spot_longitude) {
        continue;
      }

      try {
        const conditions = await checkMarineConditions(
          profile.meeting_spot_latitude,
          profile.meeting_spot_longitude,
          parseISO(booking.scheduled_start)
        );

        // If unsafe or caution, notify captain
        if (conditions.recommendation === 'dangerous' || conditions.recommendation === 'caution') {
          const hoursUntil = differenceInHours(parseISO(booking.scheduled_start), now);
          
          const weatherReason = generateWeatherHoldReason(conditions);

          // Send email to captain
          const captainEmail = profile.email || `captain-${booking.captain_id}@dockslot.app`;
          
          const emailResult = await sendEmail({
            to: captainEmail,
            subject: `⚠️ Weather Alert: ${tripType.title} in ${hoursUntil}h`,
            html: weatherAlertEmailTemplate({
              captainName: profile.business_name || profile.full_name,
              guestName: booking.guest_name,
              tripType: tripType.title,
              tripDate: new Date(booking.scheduled_start).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }),
              hoursUntil: hoursUntil.toString(),
              weatherReason,
              recommendation: conditions.recommendation,
              alerts: conditions.alerts.map(a => a.headline).join('; '),
              bookingId: booking.id,
            }),
          });

          results.push({
            bookingId: booking.id,
            status: emailResult.success ? 'notified' : 'failed',
            recommendation: conditions.recommendation,
            reason: weatherReason,
          });
        } else {
          results.push({
            bookingId: booking.id,
            status: 'safe',
            recommendation: conditions.recommendation,
          });
        }
      } catch (err) {
        console.error(`Weather check failed for booking ${booking.id}:`, err);
        results.push({
          bookingId: booking.id,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      checked: (upcomingBookings || []).length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weather cron error:', error);
    return NextResponse.json(
      { error: 'Failed to check weather' },
      { status: 500 }
    );
  }
}

function weatherAlertEmailTemplate(params: {
  captainName: string;
  guestName: string;
  tripType: string;
  tripDate: string;
  hoursUntil: string;
  weatherReason: string;
  recommendation: string;
  alerts: string;
  bookingId: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #1e293b;">
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, ${
        params.recommendation === 'dangerous' ? '#991b1b' : '#92400e'
      }, #0f172a);">
        <h1 style="margin: 0; color: ${
          params.recommendation === 'dangerous' ? '#fca5a5' : '#fbbf24'
        }; font-size: 28px;">⚠️ Weather Alert</h1>
        <p style="margin: 10px 0 0; color: #94a3b8;">Upcoming Trip - Action May Be Required</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 30px 20px;">
        <h2 style="margin: 0 0 20px; color: #f1f5f9; font-size: 24px;">Captain ${params.captainName},</h2>
        <p style="margin: 0 0 20px; color: #cbd5e1; line-height: 1.6;">
          <strong style="color: ${
            params.recommendation === 'dangerous' ? '#fca5a5' : '#fbbf24'
          };">
            ${params.recommendation === 'dangerous' ? 'DANGEROUS' : 'CAUTION'}
          </strong> weather conditions detected for your upcoming trip in <strong>${params.hoursUntil} hours</strong>.
        </p>
        
        <div style="background-color: #0f172a; border-left: 4px solid ${
          params.recommendation === 'dangerous' ? '#dc2626' : '#f59e0b'
        }; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 10px; color: #f1f5f9;">Trip Details</h3>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Guest:</strong> ${params.guestName}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Trip:</strong> ${params.tripType}</p>
          <p style="margin: 5px 0; color: #cbd5e1;"><strong>Date:</strong> ${params.tripDate}</p>
        </div>

        <div style="background-color: ${
          params.recommendation === 'dangerous' ? '#450a0a' : '#422006'
        }; border-left: 4px solid ${
    params.recommendation === 'dangerous' ? '#dc2626' : '#f59e0b'
  }; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 10px; color: ${
            params.recommendation === 'dangerous' ? '#fca5a5' : '#fde68a'
          };">NOAA Weather Update</h3>
          <p style="margin: 0 0 15px; color: #fde68a; font-style: italic;">"${params.weatherReason}"</p>
          ${
            params.alerts
              ? `<p style="margin: 0; color: #fef3c7; font-size: 13px;"><strong>Active Alerts:</strong> ${params.alerts}</p>`
              : ''
          }
        </div>

        <div style="background-color: #0f172a; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 15px; color: #f1f5f9;">Recommended Actions</h3>
          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; line-height: 1.8;">
            ${
              params.recommendation === 'dangerous'
                ? `
              <li><strong>Consider canceling or rescheduling</strong> for guest safety</li>
              <li>Contact guest immediately via phone or email</li>
              <li>Place booking on Weather Hold if conditions don't improve</li>
              <li>Monitor weather updates closely</li>
            `
                : `
              <li>Monitor weather conditions before departure</li>
              <li>Brief guest on expected conditions</li>
              <li>Have contingency plan ready</li>
              <li>Consider Weather Hold if conditions worsen</li>
            `
            }
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="margin: 0 0 15px; color: #cbd5e1;">Access your dashboard to place this trip on Weather Hold:</p>
          <a href="https://dockslot.app/dashboard/schedule" style="display: inline-block; background-color: ${
            params.recommendation === 'dangerous' ? '#dc2626' : '#f59e0b'
          }; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Dashboard
          </a>
        </div>

        <p style="margin: 30px 0 0; color: #94a3b8; font-size: 13px; text-align: center;">
          This is an automated weather alert from DockSlot. Weather data provided by NOAA Marine Weather.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 20px; text-align: center; background-color: #0f172a; border-top: 1px solid #334155;">
        <p style="margin: 0; color: #64748b; font-size: 12px;">
          Powered by <span style="color: #06b6d4;">DockSlot</span> + NOAA Marine Weather
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
