// app/dashboard/page.tsx
// Captain's Dashboard - Maritime Chart Plotter Aesthetic
// Design: "The Captain's Horizon" - Garmin/Simrad/Raymarine inspired interface

export const dynamic = 'force-dynamic';

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getBookingsWithFilters } from "@/lib/data/bookings";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import {
  Anchor,
  Wind,
  ThermometerSun,
  Sun,
  Fish,
  Receipt,
  CalendarX,
  MessageSquare,
  Navigation,
  Users,
} from "lucide-react";
import { FloatPlanCard } from "./components/FloatPlanCard";
import { BookingLinkCard } from "@/components/BookingLinkCard";
import { BookingStatus, ACTIVE_BOOKING_STATUSES } from "@/lib/db/types";
import { checkMarineConditions } from "@/lib/weather/noaa";
import { getBuoyData } from "@/lib/weather/buoy";
import SunCalc from "suncalc";
import { weatherCache } from "@/lib/cache";

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
        className="relative h-28 w-28 rounded-full bg-slate-800"
        style={{
          boxShadow:
            "inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <svg
          className="h-28 w-28"
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
// ROCKER SWITCH COMPONENT - Tactile marine control button
// ═══════════════════════════════════════════════════════════════════════════

interface RockerSwitchProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function RockerSwitch({ icon, label, onClick }: RockerSwitchProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-5 transition-all duration-75 ease-out hover:bg-slate-700 active:translate-y-1 active:border-b-0"
      style={{
        borderBottom: "4px solid #0f172a",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* LED Indicator */}
      <div className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-slate-600 transition-all group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
      {/* Icon */}
      <div className="text-slate-400 transition-colors group-hover:text-cyan-300">
        {icon}
      </div>
      {/* Label */}
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
    </button>
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
  const tzNow = formatInTimeZone(now, timezone, "yyyy-MM-dd'T'HH:mm:ss");
  const tzDate = new Date(tzNow);
  const hoursElapsed = tzDate.getHours() + tzDate.getMinutes() / 60;
  const nowPosition = (hoursElapsed / 24) * 100;

  return (
    <div
      className="relative h-72 w-full overflow-hidden rounded-lg bg-slate-900 sm:h-80"
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

      {/* Branding - Top Left */}
      <div className="absolute left-4 top-4 flex items-center gap-2">
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
      <div className="absolute right-4 top-4 flex flex-col gap-3 sm:flex-row sm:gap-6">
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
        className="absolute bottom-12 left-0 h-32 w-full"
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
        className="absolute bottom-12 top-20 flex flex-col items-center"
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

      {/* Time Scale - Bottom */}
      <div className="absolute bottom-3 left-4 right-4 flex justify-between">
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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('meeting_spot_latitude, meeting_spot_longitude, timezone, business_name, full_name')
      .eq('id', user.id)
      .single();

    if (profile) {
      captainProfile = profile;
      captainTimezone = profile.timezone || "America/New_York";

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

  // Fetch today's bookings for the Float Plan
  const today = format(new Date(), "yyyy-MM-dd");
  let nextTrip = null;
  let pendingCount = 0;

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
        limit: 10,
      });

      // Find the next upcoming trip (first one that hasn't started yet or is in progress)
      const now = new Date();
      const upcomingBooking = todayBookings.bookings.find((b) => {
        const startTime = parseISO(b.scheduled_start);
        const endTime = parseISO(b.scheduled_end);
        // Show if it hasn't ended yet
        return endTime > now;
      });

      if (upcomingBooking) {
        // For now, use mock waiver data until waiver system is integrated
        nextTrip = {
          id: upcomingBooking.id,
          time: format(parseISO(upcomingBooking.scheduled_start), "h:mm a"),
          tripType: upcomingBooking.trip_type?.title || "Charter Trip",
          guestName: upcomingBooking.guest_name,
          partySize: upcomingBooking.party_size,
          status: upcomingBooking.status,
          paymentStatus: upcomingBooking.payment_status,
          waiversSigned: upcomingBooking.party_size - 1, // Mock: assume most signed
          waiversTotal: upcomingBooking.party_size,
        };
      }

      // Count pending deposit bookings
      const pendingBookings = await getBookingsWithFilters({
        captainId: user.id,
        status: ["pending_deposit"],
        limit: 100,
      });
      pendingCount = pendingBookings.totalCount;
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }

  // Mock metrics (would come from aggregation queries in production)
  const METRICS = {
    revenuePercent: 70,
    seasonDaysRemaining: 45,
    seasonDaysTotal: 120,
    pendingItems: pendingCount,
    maxPending: 10,
  };

  return (
    <div className="space-y-6">
      {/* ═══ SECTION 1: THE HORIZON WIDGET ═══ */}
      <section aria-label="Day Overview">
        <HorizonWidget 
          captainName={displayName} 
          timezone={captainTimezone}
          weatherData={weatherData}
        />
      </section>

      {/* ═══ SECTION 2: FUEL GAUGES ═══ */}
      <section aria-label="Key Metrics" className="py-2">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          <FuelGauge
            value={METRICS.revenuePercent}
            maxValue={100}
            label="Revenue"
            unit="% goal"
            color="emerald"
          />
          <FuelGauge
            value={METRICS.seasonDaysRemaining}
            maxValue={METRICS.seasonDaysTotal}
            label="Season"
            unit="days"
            color="blue"
          />
          <FuelGauge
            value={METRICS.pendingItems}
            maxValue={METRICS.maxPending}
            label="Pending"
            unit="items"
            color="amber"
          />
        </div>
      </section>

      {/* ═══ SECTION 3: FLOAT PLAN / NEXT TRIP ═══ */}
      <section aria-label="Next Trip">
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Float Plan
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
        <FloatPlanCard booking={nextTrip} />
      </section>

      {/* ═══ SECTION 3.5: BOOKING LINK ═══ */}
      {user && (
        <section aria-label="Booking Link">
          <div className="mb-3 flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
              Share
            </span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
          <BookingLinkCard captainId={user.id} compact />
        </section>
      )}

      {/* ═══ SECTION 4: ROCKER SWITCHES / QUICK ACTIONS ═══ */}
      <section aria-label="Quick Actions">
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Controls
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <RockerSwitch
            icon={<Fish className="h-6 w-6" />}
            label="Log Catch"
          />
          <RockerSwitch
            icon={<Receipt className="h-6 w-6" />}
            label="Expense"
          />
          <RockerSwitch
            icon={<CalendarX className="h-6 w-6" />}
            label="Quick Block"
          />
          <RockerSwitch
            icon={<MessageSquare className="h-6 w-6" />}
            label="Message"
          />
        </div>
      </section>

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
