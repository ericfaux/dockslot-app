// app/dashboard/page.tsx
// Captain's Dashboard - Maritime Chart Plotter Aesthetic
// Design: "The Captain's Horizon" - Garmin/Simrad/Raymarine inspired interface

export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { getBookingsWithFilters } from "@/lib/data/bookings";
import { format, parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import {
  Anchor,
  Wind,
  ThermometerSun,
  Sun,
  Navigation,
} from "lucide-react";
import { FloatPlanWidget, FloatPlanTrip, WeatherSummary } from "./components/FloatPlanWidget";
import { BookingLinkCard } from "@/components/BookingLinkCard";
import { ActionItemsWidget } from "./components/ActionItemsWidget";
import WeatherAlertWidget from "./components/WeatherAlertWidget";
import { getActionItems } from "@/app/actions/action-items";
import { BookingStatus, ACTIVE_BOOKING_STATUSES } from "@/lib/db/types";
import { addHours } from "date-fns";
import { checkMarineConditions } from "@/lib/weather/noaa";
import { getBuoyData } from "@/lib/weather/buoy";
import SunCalc from "suncalc";
import { weatherCache } from "@/lib/cache";
import QuickStatsWidgets from "./components/QuickStatsWidgets";
import { OnboardingChecklist } from "./components/OnboardingChecklist";

interface WeatherData {
  waterTemp: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  sunset: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUEL GAUGE COMPONENT - Circular instrument gauge
// ═══════════════════════════════════════════════════════════════════════════

interface FuelGaugeProps {
  value: number;
  maxValue: number;
  label: string;
  unit?: string;
  color: "emerald" | "blue" | "amber" | "cyan";
}

function FuelGauge({ value, maxValue, label, unit, color }: FuelGaugeProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const radius = 42;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  // 270-degree arc (75% of circle)
  const arcLength = circumference * 0.75;
  const filledLength = (percentage / 100) * arcLength;

  const colorMap = {
    emerald: {
      stroke: "#34d399",
      glow: "drop-shadow(0 0 8px rgba(52, 211, 153, 0.6))",
      text: "text-emerald-400",
    },
    blue: {
      stroke: "#60a5fa",
      glow: "drop-shadow(0 0 8px rgba(96, 165, 250, 0.6))",
      text: "text-blue-400",
    },
    amber: {
      stroke: "#fbbf24",
      glow: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))",
      text: "text-amber-400",
    },
    cyan: {
      stroke: "#22d3ee",
      glow: "drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))",
      text: "text-cyan-400",
    },
  };

  const colors = colorMap[color];

  return (
    <div className="flex flex-col items-center">
      {/* Gauge Container */}
      <div
        className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-slate-800"
        style={{
          boxShadow:
            "inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <svg
          className="h-24 w-24 sm:h-28 sm:w-28"
          viewBox="0 0 100 100"
          style={{ transform: "rotate(-225deg)" }}
        >
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${filledLength} ${circumference}`}
            strokeLinecap="round"
            style={{ filter: colors.glow }}
          />
        </svg>
        {/* Center value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-mono text-2xl font-bold ${colors.text}`}
            style={{ filter: colors.glow }}
          >
            {value}
          </span>
          {unit && (
            <span className="font-mono text-[10px] text-slate-500">{unit}</span>
          )}
        </div>
      </div>
      {/* Label */}
      <span className="mt-2 text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// HORIZON WIDGET - Hero visualization with tide wave
// ═══════════════════════════════════════════════════════════════════════════

interface HorizonWidgetProps {
  captainName?: string;
  timezone?: string;
  weatherData: WeatherData;
}

function HorizonWidget({ captainName = "Captain", timezone = "America/New_York", weatherData }: HorizonWidgetProps) {
  // Calculate NOW cursor position in captain's timezone
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  const hoursElapsed = zonedNow.getHours() + zonedNow.getMinutes() / 60;
  const nowPosition = (hoursElapsed / 24) * 100;

  return (
    <div
      className="relative h-48 w-full overflow-hidden rounded-lg bg-slate-900 sm:h-72 md:h-80"
      style={{
        boxShadow:
          "inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      {/* Grid Pattern Background */}
      <svg className="absolute inset-0 h-full w-full opacity-20">
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#334155"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Radial Gradient Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(3,7,18,0.6) 100%)",
        }}
      />

      {/* Horizon Line */}
      <div
        className="absolute left-0 right-0 h-px"
        style={{
          top: "33%",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.4) 30%, rgba(34,211,238,0.6) 50%, rgba(34,211,238,0.4) 70%, transparent 100%)",
        }}
      />

      {/* Branding - Top Left (hidden on small mobile) */}
      <div className="absolute left-4 top-4 hidden sm:flex items-center gap-2">
        <Anchor className="h-4 w-4 text-slate-600" />
        <span className="font-mono text-sm tracking-widest text-slate-600">
          DOCKSLOT HELM
        </span>
      </div>

      {/* Captain Greeting - Top Center */}
      <div className="absolute left-1/2 top-4 hidden -translate-x-1/2 md:block">
        <span className="font-mono text-sm text-slate-500">
          Welcome aboard, <span className="text-cyan-400">{captainName}</span>
        </span>
      </div>

      {/* Weather Data Overlay - Top Right */}
      <div className="absolute right-3 top-3 sm:right-4 sm:top-4 flex flex-col gap-2 sm:flex-row sm:gap-6">
        {/* Show weather data if available */}
        {(weatherData.waterTemp !== null || weatherData.windSpeed !== null || weatherData.sunset) ? (
          <>
            {weatherData.waterTemp !== null && (
              <div className="flex items-center gap-2">
                <ThermometerSun className="h-4 w-4 text-cyan-400" />
                <div className="text-right sm:text-left">
                  <span className="font-mono text-lg font-bold text-cyan-400">
                    {weatherData.waterTemp}°
                  </span>
                  <span className="ml-1 text-[10px] uppercase tracking-wider text-slate-500">
                    Water
                  </span>
                </div>
              </div>
            )}
            {weatherData.windSpeed !== null && (
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-cyan-400" />
                <div className="text-right sm:text-left">
                  <span className="font-mono text-lg font-bold text-cyan-400">
                    {weatherData.windSpeed}
                  </span>
                  {weatherData.windDirection && (
                    <span className="ml-1 font-mono text-sm text-cyan-400">
                      {weatherData.windDirection}
                    </span>
                  )}
                  <span className="ml-1 text-[10px] uppercase tracking-wider text-slate-500">
                    kts
                  </span>
                </div>
              </div>
            )}
            {weatherData.sunset && (
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-400" />
                <div className="text-right sm:text-left">
                  <span className="font-mono text-lg font-bold text-amber-400">
                    {weatherData.sunset}
                  </span>
                  <span className="ml-1 text-[10px] uppercase tracking-wider text-slate-500">
                    Sunset
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Show helpful message if no weather data */
          <div className="rounded-lg bg-slate-800/80 px-4 py-2 backdrop-blur-sm">
            <p className="text-xs text-slate-400">
              Set meeting spot in Settings to see weather
            </p>
          </div>
        )}
      </div>

      {/* Tide Wave SVG */}
      <svg
        className="absolute bottom-4 sm:bottom-12 left-0 h-20 sm:h-32 w-full"
        viewBox="0 0 1200 128"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Wave gradient fill */}
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.3)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0.02)" />
          </linearGradient>
          {/* Wave stroke gradient */}
          <linearGradient
            id="strokeGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="rgba(34,211,238,0.1)" />
            <stop offset="30%" stopColor="rgba(34,211,238,0.6)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.8)" />
            <stop offset="70%" stopColor="rgba(34,211,238,0.6)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0.1)" />
          </linearGradient>
        </defs>
        {/* Secondary subtle wave for depth */}
        <path
          d="M0,80 C100,50 200,110 300,80 C400,50 500,110 600,80 C700,50 800,110 900,80 C1000,50 1100,110 1200,80 L1200,128 L0,128 Z"
          fill="rgba(34,211,238,0.05)"
        />
        {/* Primary wave fill */}
        <path
          d="M0,64 C100,32 200,96 300,64 C400,32 500,96 600,64 C700,32 800,96 900,64 C1000,32 1100,96 1200,64 L1200,128 L0,128 Z"
          fill="url(#waveGradient)"
        />
        {/* Primary wave stroke */}
        <path
          d="M0,64 C100,32 200,96 300,64 C400,32 500,96 600,64 C700,32 800,96 900,64 C1000,32 1100,96 1200,64"
          fill="none"
          stroke="url(#strokeGradient)"
          strokeWidth="2"
        />
      </svg>

      {/* NOW Cursor */}
      <div
        className="absolute bottom-4 sm:bottom-12 top-10 sm:top-20 flex flex-col items-center"
        style={{ left: `${Math.max(5, Math.min(95, nowPosition))}%` }}
      >
        {/* NOW Label */}
        <div className="mb-1 rounded bg-amber-400/20 px-2 py-0.5">
          <span
            className="font-mono text-xs font-bold text-amber-400"
            style={{ filter: "drop-shadow(0 0 4px rgba(251,191,36,0.6))" }}
          >
            NOW
          </span>
        </div>
        {/* Vertical dashed line */}
        <div
          className="flex-1 border-l-2 border-dashed border-amber-400"
          style={{ filter: "drop-shadow(0 0 4px rgba(251,191,36,0.4))" }}
        />
        {/* Boat indicator */}
        <div className="relative -mb-2">
          <Navigation
            className="h-5 w-5 -rotate-45 text-amber-400"
            style={{ filter: "drop-shadow(0 0 6px rgba(251,191,36,0.8))" }}
          />
        </div>
      </div>

      {/* Time Scale - Bottom (hidden on small mobile) */}
      <div className="absolute bottom-3 left-4 right-4 hidden sm:flex justify-between">
        {["6AM", "9AM", "12PM", "3PM", "6PM", "9PM"].map((time) => (
          <span key={time} className="font-mono text-[10px] text-slate-600">
            {time}
          </span>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default async function DashboardPage() {
  const { user, supabase } = await requireAuth()

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Captain";

  // Fetch captain's profile for weather data
  let captainProfile = null;
  let captainTimezone = "America/New_York";
  let weatherData: WeatherData = {
    waterTemp: null,
    windSpeed: null,
    windDirection: null,
    sunset: null,
  };

  let dockModeEnabled = false;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('meeting_spot_latitude, meeting_spot_longitude, timezone, business_name, full_name, dock_mode_enabled, season_revenue_goal_cents, is_hibernating, hibernation_end_date')
      .eq('id', user.id)
      .single();

    if (profile) {
      captainProfile = profile;
      // "UTC" is not a valid captain timezone - treat it as unset
      captainTimezone = (profile.timezone && profile.timezone !== "UTC") ? profile.timezone : "America/New_York";
      dockModeEnabled = profile.dock_mode_enabled || false;

      // Fetch real weather data if coordinates available
      if (profile.meeting_spot_latitude && profile.meeting_spot_longitude) {
        try {
          const cacheKey = `weather:${profile.meeting_spot_latitude}:${profile.meeting_spot_longitude}`;
          
          // Check cache first (5-minute TTL)
          let cachedWeather = weatherCache.get<WeatherData>(cacheKey);
          
          if (cachedWeather) {
            // Use cached data
            weatherData = cachedWeather;
          } else {
            // Fetch NOAA marine forecast for wind
            const conditions = await checkMarineConditions(
              profile.meeting_spot_latitude,
              profile.meeting_spot_longitude,
              new Date()
            );

            // Parse wind data from forecast
            if (conditions.forecast?.periods[0]) {
              const period = conditions.forecast.periods[0];
              
              // Parse wind speed (e.g., "10 to 15 mph" -> take max)
              const windMatch = period.windSpeed.match(/(\d+)\s*(?:to\s*(\d+))?\s*mph/);
              if (windMatch) {
                const maxWind = parseInt(windMatch[2] || windMatch[1]);
                weatherData.windSpeed = Math.round(maxWind * 0.868976); // Convert mph to knots
                weatherData.windDirection = period.windDirection;
              }
            }

            // Fetch NOAA buoy data for water temperature
            const buoyData = await getBuoyData(
              profile.meeting_spot_latitude,
              profile.meeting_spot_longitude
            );
            
            if (buoyData?.waterTemperature) {
              weatherData.waterTemp = Math.round(buoyData.waterTemperature);
            }

            // Calculate sunset time using suncalc (no API needed!)
            const sunTimes = SunCalc.getTimes(
              new Date(),
              profile.meeting_spot_latitude,
              profile.meeting_spot_longitude
            );
            
            weatherData.sunset = formatInTimeZone(
              sunTimes.sunset,
              captainTimezone,
              'h:mm a'
            );

            // Cache for 5 minutes
            weatherCache.set(cacheKey, weatherData, 300000);
          }
        } catch (error) {
          console.error('Failed to fetch weather data:', error);
          // Gracefully degrade - leave weatherData as nulls
        }
      }
    }
  }

  // Fetch today's and tomorrow's bookings for the Float Plan
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const tomorrow = format(addHours(now, 24), "yyyy-MM-dd");

  let todayTrips: FloatPlanTrip[] = [];
  let tomorrowTrips: FloatPlanTrip[] = [];
  let nextUpcomingTrip: FloatPlanTrip | null = null;
  let pendingCount = 0;
  let upcoming48hCount = 0;
  let floatPlanWeather: WeatherSummary | null = null;

  if (user) {
    try {
      // Get today's active bookings, sorted by start time
      const todayBookings = await getBookingsWithFilters({
        captainId: user.id,
        startDate: today,
        endDate: today,
        status: ACTIVE_BOOKING_STATUSES as BookingStatus[],
        sortField: "scheduled_start",
        sortDir: "asc",
        limit: 20,
      });

      // Get tomorrow's bookings
      const tomorrowBookings = await getBookingsWithFilters({
        captainId: user.id,
        startDate: tomorrow,
        endDate: tomorrow,
        status: ACTIVE_BOOKING_STATUSES as BookingStatus[],
        sortField: "scheduled_start",
        sortDir: "asc",
        limit: 10,
      });

      // Fetch waiver counts for today's bookings
      const waiverCounts = new Map<string, { signed: number; total: number }>();
      if (todayBookings.bookings.length > 0) {
        const bookingIds = todayBookings.bookings.map((b) => b.id);

        // Get passenger counts per booking
        const { data: passengers } = await supabase
          .from("passengers")
          .select("booking_id")
          .in("booking_id", bookingIds);

        // Get waiver signature counts per booking
        const { data: signatures } = await supabase
          .from("waiver_signatures")
          .select("booking_id")
          .in("booking_id", bookingIds);

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

      // Transform today's bookings to FloatPlanTrip format
      todayTrips = todayBookings.bookings.map((b) => {
        const waiverInfo = waiverCounts.get(b.id) || { signed: 0, total: b.party_size };
        return {
          id: b.id,
          scheduledStart: b.scheduled_start,
          scheduledEnd: b.scheduled_end,
          tripType: b.trip_type?.title || "Charter Trip",
          guestName: b.guest_name,
          guestPhone: b.guest_phone,
          partySize: b.party_size,
          vesselCapacity: b.vessel?.capacity || 6,
          status: b.status,
          paymentStatus: b.payment_status,
          waiversSigned: waiverInfo.signed,
          waiversTotal: waiverInfo.total,
        };
      });

      // Transform tomorrow's bookings
      tomorrowTrips = tomorrowBookings.bookings.map((b) => ({
        id: b.id,
        scheduledStart: b.scheduled_start,
        scheduledEnd: b.scheduled_end,
        tripType: b.trip_type?.title || "Charter Trip",
        guestName: b.guest_name,
        guestPhone: b.guest_phone,
        partySize: b.party_size,
        vesselCapacity: b.vessel?.capacity || 6,
        status: b.status,
        paymentStatus: b.payment_status,
        waiversSigned: 0, // Not needed for tomorrow preview
        waiversTotal: b.party_size,
      }));

      // If no trips today, find the next upcoming trip
      if (todayTrips.length === 0) {
        const futureBookings = await getBookingsWithFilters({
          captainId: user.id,
          startDate: tomorrow,
          status: ACTIVE_BOOKING_STATUSES as BookingStatus[],
          sortField: "scheduled_start",
          sortDir: "asc",
          limit: 1,
        });

        if (futureBookings.bookings.length > 0) {
          const b = futureBookings.bookings[0];
          nextUpcomingTrip = {
            id: b.id,
            scheduledStart: b.scheduled_start,
            scheduledEnd: b.scheduled_end,
            tripType: b.trip_type?.title || "Charter Trip",
            guestName: b.guest_name,
            guestPhone: b.guest_phone,
            partySize: b.party_size,
            vesselCapacity: b.vessel?.capacity || 6,
            status: b.status,
            paymentStatus: b.payment_status,
            waiversSigned: 0,
            waiversTotal: b.party_size,
          };
        }
      }

      // Count pending deposit bookings
      const pendingBookings = await getBookingsWithFilters({
        captainId: user.id,
        status: ["pending_deposit"],
        limit: 100,
      });
      pendingCount = pendingBookings.totalCount;

      // Count bookings in the next 48 hours (for weather alert widget)
      const in48h = addHours(now, 48);
      const upcoming48hBookings = await getBookingsWithFilters({
        captainId: user.id,
        startDate: format(now, "yyyy-MM-dd"),
        endDate: format(in48h, "yyyy-MM-dd"),
        status: ["confirmed", "rescheduled"] as BookingStatus[],
        limit: 100,
      });
      upcoming48hCount = upcoming48hBookings.totalCount;

      // Build weather summary for Float Plan (if we have weather data and trips today)
      if (todayTrips.length > 0 && (weatherData.windSpeed !== null || weatherData.waterTemp !== null)) {
        // Check if there are any weather advisories
        let hasAdvisory = false;
        let advisoryMessage = "";

        if (weatherData.windSpeed !== null && weatherData.windSpeed > 15) {
          hasAdvisory = true;
          advisoryMessage = `Wind advisory: ${weatherData.windSpeed} kts ${weatherData.windDirection || ""} - review trips`;
        }

        floatPlanWeather = {
          temperature: weatherData.waterTemp || undefined,
          windSpeed: weatherData.windSpeed ? `${weatherData.windSpeed} kts` : undefined,
          windDirection: weatherData.windDirection || undefined,
          condition: "Good conditions for charter",
          hasAdvisory,
          advisoryMessage,
        };
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }

  // Fetch action items
  const actionItems = user ? await getActionItems() : [];

  // Onboarding checklist: check setup completion
  let hasVessel = false;
  let hasTripType = false;
  let hasAnyBooking = false;
  let hasAvailability = false;
  const hasMeetingSpot = !!(captainProfile?.meeting_spot_latitude && captainProfile?.meeting_spot_longitude);

  if (user) {
    try {
      const [vesselResult, tripTypeResult, bookingResult, availabilityResult] = await Promise.all([
        supabase.from('vessels').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
        supabase.from('trip_types').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('captain_id', user.id).limit(1),
        supabase.from('availability_windows').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
      ]);
      hasVessel = (vesselResult.count || 0) > 0;
      hasTripType = (tripTypeResult.count || 0) > 0;
      hasAnyBooking = (bookingResult.count || 0) > 0;
      hasAvailability = (availabilityResult.count || 0) > 0;
    } catch (err) {
      console.error('Error checking onboarding status:', err);
    }
  }

  // Calculate real metrics from Supabase data
  let seasonRevenueCents = 0;
  let seasonRevenueGoalCents = captainProfile?.season_revenue_goal_cents || 0;

  if (user) {
    try {
      // Season revenue: sum of payments from bookings this year
      const yearStart = `${now.getFullYear()}-01-01T00:00:00`;
      const { data: seasonBookings } = await supabase
        .from('bookings')
        .select('deposit_paid_cents, total_price_cents, payment_status')
        .eq('captain_id', user.id)
        .gte('scheduled_start', yearStart);

      seasonRevenueCents = (seasonBookings || []).reduce((sum, b) => {
        if (b.payment_status === 'fully_paid') return sum + b.total_price_cents;
        if (b.payment_status === 'deposit_paid') return sum + b.deposit_paid_cents;
        return sum;
      }, 0);
    } catch (err) {
      console.error('Error calculating season revenue:', err);
    }
  }

  // Revenue percentage: actual vs goal (default goal $10k if not configured)
  const effectiveGoal = seasonRevenueGoalCents > 0 ? seasonRevenueGoalCents : 1000000; // $10,000 default
  const revenuePercent = Math.min(Math.round((seasonRevenueCents / effectiveGoal) * 100), 100);

  // Season days: calculate from availability windows or hibernation end date
  let seasonDaysRemaining = 0;
  let seasonDaysTotal = 365;

  if (captainProfile?.is_hibernating && captainProfile?.hibernation_end_date) {
    // If hibernating with end date, show days until season resumes
    const endDate = new Date(captainProfile.hibernation_end_date);
    seasonDaysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    seasonDaysTotal = seasonDaysRemaining; // gauge shows countdown
  } else {
    // Show days remaining in the calendar year (boating season proxy)
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    seasonDaysRemaining = Math.ceil((yearEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    seasonDaysTotal = 365;
  }

  const hasRevenueGoal = seasonRevenueGoalCents > 0;

  const METRICS = {
    revenuePercent,
    hasRevenueGoal,
    seasonDaysRemaining,
    seasonDaysTotal,
    pendingItems: pendingCount,
    maxPending: Math.max(pendingCount, 5),
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ═══ SECTION 1: THE HORIZON WIDGET ═══ */}
      <section aria-label="Day Overview">
        <HorizonWidget
          captainName={displayName}
          timezone={captainTimezone}
          weatherData={weatherData}
        />
      </section>

      {/* ═══ DOCK MODE BUTTON ═══ */}
      {dockModeEnabled && (
        <section aria-label="Dock Mode">
          <a
            href="/dock"
            className="group flex w-full items-center justify-between gap-4 rounded-xl border-2 border-cyan-500/50 bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 px-6 py-4 transition-all hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20">
                <Anchor className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">Enter Dock Mode</span>
                <p className="text-sm text-slate-400">Simplified view for on-water use</p>
              </div>
            </div>
            <Navigation className="h-6 w-6 text-cyan-400 transition-transform group-hover:translate-x-1" />
          </a>
        </section>
      )}

      {/* ═══ SECTION 1.25: WEATHER ALERT ═══ */}
      <section aria-label="Weather Alert">
        <WeatherAlertWidget
          lat={captainProfile?.meeting_spot_latitude ?? null}
          lon={captainProfile?.meeting_spot_longitude ?? null}
          upcomingBookingsCount={upcoming48hCount}
        />
      </section>

      {/* ═══ ONBOARDING CHECKLIST (for new captains) ═══ */}
      {user && (
        <section aria-label="Getting Started">
          <OnboardingChecklist
            hasMeetingSpot={hasMeetingSpot}
            hasVessel={hasVessel}
            hasTripType={hasTripType}
            hasBooking={hasAnyBooking}
            hasAvailability={hasAvailability}
            bookingPageUrl={`/book/${user.id}`}
          />
        </section>
      )}

      {/* ═══ SECTION 1.5: QUICK STATS ═══ */}
      <section aria-label="Quick Statistics">
        <QuickStatsWidgets captainId={user?.id || ''} />
      </section>

      {/* ═══ SECTION 2: FUEL GAUGES ═══ */}
      {(METRICS.hasRevenueGoal || METRICS.pendingItems > 0) && (
        <section aria-label="Key Metrics" className="py-2">
          <div className="grid grid-cols-2 gap-6 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-12">
            {METRICS.hasRevenueGoal && (
              <FuelGauge
                value={METRICS.revenuePercent}
                maxValue={100}
                label="Revenue"
                unit="% goal"
                color="emerald"
              />
            )}
            <FuelGauge
              value={METRICS.seasonDaysRemaining}
              maxValue={METRICS.seasonDaysTotal}
              label="Season"
              unit="days"
              color="blue"
            />
            {METRICS.pendingItems > 0 && (
              <FuelGauge
                value={METRICS.pendingItems}
                maxValue={METRICS.maxPending}
                label="Pending"
                unit="items"
                color="amber"
              />
            )}
          </div>
        </section>
      )}

      {/* ═══ SECTION 3: FLOAT PLAN / MISSION CONTROL ═══ */}
      <section aria-label="Float Plan - Today's Trips">
        <div className="mb-4 flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Float Plan
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
        <FloatPlanWidget
          todayTrips={todayTrips}
          tomorrowTrips={tomorrowTrips}
          nextUpcomingTrip={nextUpcomingTrip}
          weather={floatPlanWeather}
          timezone={captainTimezone}
        />
      </section>

      {/* ═══ SECTION 3.3: ACTION ITEMS ═══ */}
      <section aria-label="Action Items">
        <div className="mb-4 flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Attention
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
        <ActionItemsWidget items={actionItems} />
      </section>

      {/* ═══ SECTION 3.5: BOOKING LINK ═══ */}
      {user && (
        <section aria-label="Booking Link">
          <div className="mb-4 flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
              Share
            </span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
          <BookingLinkCard captainId={user.id} compact />
        </section>
      )}

      {/* ═══ BOTTOM ACCENT BAR ═══ */}
      <div
        className="mx-auto h-1 w-32 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)",
        }}
      />
    </div>
  );
}
