// app/dashboard/page.tsx
// Captain's Dashboard - Maritime Chart Plotter Aesthetic
// Design: "The Captain's Horizon" - Garmin/Simrad/Raymarine inspired interface

import { createSupabaseServerClient } from "@/utils/supabase/server";
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
  FileCheck,
  CreditCard,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA - Replace with real data fetching
// ═══════════════════════════════════════════════════════════════════════════

const WEATHER_DATA = {
  waterTemp: 72,
  windSpeed: 8,
  windDirection: "NE",
  sunset: "7:42 PM",
};

const NEXT_TRIP = {
  time: "2:00 PM",
  tripType: "Half-Day Offshore",
  guestName: "Johnson Party",
  partySize: 4,
  status: "confirmed" as const,
  depositPaid: true,
  waiversSigned: 3,
  waiversTotal: 4,
};

const METRICS = {
  revenuePercent: 70,
  seasonDaysRemaining: 45,
  seasonDaysTotal: 120,
  pendingWaivers: 2,
  maxPending: 10,
};

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
// STATUS BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

type TripStatus = "confirmed" | "pending_deposit" | "weather_hold" | "cancelled";

interface StatusBadgeProps {
  status: TripStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    confirmed: {
      label: "Confirmed",
      dotColor: "bg-emerald-500",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
    pending_deposit: {
      label: "Awaiting Deposit",
      dotColor: "bg-amber-500",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
    weather_hold: {
      label: "Weather Hold",
      dotColor: "bg-cyan-500",
      textColor: "text-cyan-700",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
    },
    cancelled: {
      label: "Cancelled",
      dotColor: "bg-rose-500",
      textColor: "text-rose-700",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${config.bgColor} ${config.borderColor}`}
    >
      <div className={`h-2 w-2 rounded-full ${config.dotColor}`} />
      <span className={`text-xs font-semibold ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HORIZON WIDGET - Hero visualization with tide wave
// ═══════════════════════════════════════════════════════════════════════════

interface HorizonWidgetProps {
  captainName?: string;
}

function HorizonWidget({ captainName = "Captain" }: HorizonWidgetProps) {
  // Calculate NOW cursor position (hours since midnight / 24)
  const now = new Date();
  const hoursElapsed = now.getHours() + now.getMinutes() / 60;
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
        <div className="flex items-center gap-2">
          <ThermometerSun className="h-4 w-4 text-cyan-400" />
          <div className="text-right sm:text-left">
            <span className="font-mono text-lg font-bold text-cyan-400">
              {WEATHER_DATA.waterTemp}°
            </span>
            <span className="ml-1 text-[10px] uppercase tracking-wider text-slate-500">
              Water
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-cyan-400" />
          <div className="text-right sm:text-left">
            <span className="font-mono text-lg font-bold text-cyan-400">
              {WEATHER_DATA.windSpeed}
            </span>
            <span className="ml-1 font-mono text-sm text-cyan-400">
              {WEATHER_DATA.windDirection}
            </span>
            <span className="ml-1 text-[10px] uppercase tracking-wider text-slate-500">
              kts
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-400" />
          <div className="text-right sm:text-left">
            <span className="font-mono text-lg font-bold text-amber-400">
              {WEATHER_DATA.sunset}
            </span>
            <span className="ml-1 text-[10px] uppercase tracking-wider text-slate-500">
              Sunset
            </span>
          </div>
        </div>
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
// FLOAT PLAN CARD - Next trip display
// ═══════════════════════════════════════════════════════════════════════════

function FloatPlanCard() {
  const borderColorMap = {
    confirmed: "border-l-emerald-500",
    pending_deposit: "border-l-amber-500",
    weather_hold: "border-l-cyan-500",
    cancelled: "border-l-rose-500",
  };

  return (
    <div
      className={`overflow-hidden rounded-lg border-l-8 bg-white ${borderColorMap[NEXT_TRIP.status]}`}
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
    >
      <div className="p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-2xl font-bold text-slate-900">
              {NEXT_TRIP.time}
            </div>
            <div className="font-mono text-lg font-semibold text-slate-700">
              {NEXT_TRIP.tripType}
            </div>
          </div>
          <StatusBadge status={NEXT_TRIP.status} />
        </div>

        {/* Guest Info Panel */}
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Guest Details */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <div className="font-mono text-base font-semibold text-slate-900">
                  {NEXT_TRIP.guestName}
                </div>
                <div className="text-sm text-slate-500">
                  {NEXT_TRIP.partySize} guests
                </div>
              </div>
            </div>

            {/* Right: Status Indicators */}
            <div className="flex flex-wrap gap-4">
              {/* Waivers */}
              <div className="flex items-center gap-2">
                <FileCheck
                  className={`h-4 w-4 ${NEXT_TRIP.waiversSigned === NEXT_TRIP.waiversTotal ? "text-emerald-500" : "text-amber-500"}`}
                />
                <span
                  className={`text-sm font-medium ${NEXT_TRIP.waiversSigned === NEXT_TRIP.waiversTotal ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {NEXT_TRIP.waiversSigned}/{NEXT_TRIP.waiversTotal} waivers
                </span>
              </div>
              {/* Payment */}
              <div className="flex items-center gap-2">
                <CreditCard
                  className={`h-4 w-4 ${NEXT_TRIP.depositPaid ? "text-emerald-500" : "text-amber-500"}`}
                />
                <span
                  className={`text-sm font-medium ${NEXT_TRIP.depositPaid ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {NEXT_TRIP.depositPaid ? "Deposit Paid" : "Deposit Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Depart Button */}
        <button
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-4 font-mono text-lg font-bold uppercase tracking-wide text-white transition-all duration-75 ease-out hover:bg-slate-800 active:translate-y-1 active:border-b-0"
          style={{
            borderBottom: "4px solid #0f172a",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <Navigation className="h-5 w-5" />
          DEPART
        </button>
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

  return (
    <div className="space-y-6">
      {/* ═══ SECTION 1: THE HORIZON WIDGET ═══ */}
      <section aria-label="Day Overview">
        <HorizonWidget captainName={displayName} />
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
            value={METRICS.pendingWaivers}
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
        <FloatPlanCard />
      </section>

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
