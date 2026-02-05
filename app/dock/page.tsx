// app/dock/page.tsx
// Dock Mode Main Page - Server Component
// Fetches initial data and renders the Dock Mode client

export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { getBookingsWithFilters } from '@/lib/data/bookings';
import { format, addHours } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ACTIVE_BOOKING_STATUSES, BookingStatus } from '@/lib/db/types';
import { checkMarineConditions } from '@/lib/weather/noaa';
import { getBuoyData } from '@/lib/weather/buoy';
import { DockModeClient } from './DockModeClient';
import { DockTrip, DockWeatherData } from './context/DockModeContext';

export default async function DockPage() {
  const { user, supabase } = await requireAuth();

  // Fetch captain's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const timezone = profile?.timezone || 'America/New_York';
  const captainPhone = profile?.phone || null;
  const captainName = profile?.full_name || profile?.business_name || 'Captain';

  // Get today's date in captain's timezone
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');

  // Fetch today's active bookings
  const todayBookings = await getBookingsWithFilters({
    captainId: user.id,
    startDate: today,
    endDate: today,
    status: ACTIVE_BOOKING_STATUSES as BookingStatus[],
    sortField: 'scheduled_start',
    sortDir: 'asc',
    limit: 20,
  });

  // Fetch waiver counts for today's bookings
  const waiverCounts = new Map<string, { signed: number; total: number }>();
  if (todayBookings.bookings.length > 0) {
    const bookingIds = todayBookings.bookings.map((b) => b.id);

    // Get passenger counts per booking
    const { data: passengers } = await supabase
      .from('passengers')
      .select('booking_id')
      .in('booking_id', bookingIds);

    // Get waiver signature counts per booking
    const { data: signatures } = await supabase
      .from('waiver_signatures')
      .select('booking_id')
      .in('booking_id', bookingIds);

    // Count passengers per booking
    const passengerCountMap = new Map<string, number>();
    for (const p of passengers || []) {
      passengerCountMap.set(p.booking_id, (passengerCountMap.get(p.booking_id) || 0) + 1);
    }

    // Count signatures per booking
    const signatureCountMap = new Map<string, number>();
    for (const s of signatures || []) {
      signatureCountMap.set(s.booking_id, (signatureCountMap.get(s.booking_id) || 0) + 1);
    }

    // Build waiver counts map
    for (const booking of todayBookings.bookings) {
      const passengerCount = passengerCountMap.get(booking.id) || booking.party_size;
      const signatureCount = signatureCountMap.get(booking.id) || 0;
      waiverCounts.set(booking.id, {
        signed: signatureCount,
        total: passengerCount,
      });
    }
  }

  // Transform bookings to DockTrip format
  const trips: DockTrip[] = todayBookings.bookings.map((b) => {
    const waiverInfo = waiverCounts.get(b.id) || { signed: 0, total: b.party_size };
    return {
      id: b.id,
      scheduledStart: b.scheduled_start,
      scheduledEnd: b.scheduled_end,
      tripType: b.trip_type?.title || 'Charter Trip',
      guestName: b.guest_name,
      guestPhone: b.guest_phone,
      partySize: b.party_size,
      status: b.status,
      paymentStatus: b.payment_status,
      isPaid: b.payment_status === 'fully_paid' || b.payment_status === 'deposit_paid',
      waiversComplete: waiverInfo.signed >= waiverInfo.total,
      waiversSigned: waiverInfo.signed,
      waiversTotal: waiverInfo.total,
    };
  });

  // Fetch weather data if coordinates available
  let weather: DockWeatherData | null = null;

  if (profile?.meeting_spot_latitude && profile?.meeting_spot_longitude) {
    try {
      const lat = profile.meeting_spot_latitude;
      const lon = profile.meeting_spot_longitude;

      // Fetch NOAA marine forecast
      const conditions = await checkMarineConditions(lat, lon, now);

      // Fetch buoy data for water conditions
      const buoyData = await getBuoyData(lat, lon);

      // Build weather data object
      let windSpeed: number | null = null;
      let windDirection: string | null = null;

      if (conditions.forecast?.periods[0]) {
        const period = conditions.forecast.periods[0];
        const windMatch = period.windSpeed.match(/(\d+)\s*(?:to\s*(\d+))?\s*mph/);
        if (windMatch) {
          const maxWind = parseInt(windMatch[2] || windMatch[1]);
          windSpeed = Math.round(maxWind * 0.868976); // Convert mph to knots
          windDirection = period.windDirection;
        }
      }

      // Build 4-hour forecast
      const forecast: DockWeatherData['forecast'] = [];
      if (conditions.forecast?.periods) {
        for (let i = 0; i < Math.min(4, conditions.forecast.periods.length); i++) {
          const period = conditions.forecast.periods[i];
          const windMatch = period.windSpeed.match(/(\d+)\s*(?:to\s*(\d+))?\s*mph/);
          const periodWindSpeed = windMatch ? Math.round(parseInt(windMatch[2] || windMatch[1]) * 0.868976) : 0;

          forecast.push({
            time: formatInTimeZone(addHours(now, i), timezone, 'h a'),
            temperature: period.temperature,
            windSpeed: periodWindSpeed,
            conditions: period.shortForecast,
          });
        }
      }

      // Check for weather warnings
      let hasWarning = false;
      let warningMessage: string | null = null;

      if (windSpeed && windSpeed > 15) {
        hasWarning = true;
        warningMessage = `High winds: ${windSpeed} kts ${windDirection || ''} - Review bookings`;
      }

      if (buoyData?.waveHeight && buoyData.waveHeight > 3) {
        hasWarning = true;
        warningMessage = `Rough seas: ${buoyData.waveHeight.toFixed(1)}ft waves - Consider weather hold`;
      }

      weather = {
        temperature: buoyData?.waterTemperature ? Math.round(buoyData.waterTemperature) : null,
        windSpeed,
        windDirection,
        waveHeight: buoyData?.waveHeight || null,
        conditions: conditions.forecast?.periods[0]?.shortForecast || null,
        forecast,
        hasWarning,
        warningMessage,
      };
    } catch (error) {
      console.error('Failed to fetch weather for dock mode:', error);
    }
  }

  return (
    <DockModeClient
      initialTrips={trips}
      initialWeather={weather}
      captainPhone={captainPhone}
      captainName={captainName}
      timezone={timezone}
    />
  );
}
