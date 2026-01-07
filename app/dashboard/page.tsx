// app/dashboard/page.tsx
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Anchor, AlertCircle, DollarSign, Calendar, Ship, Plus } from "lucide-react";
import Link from "next/link";

// Static data for MVP - structured for easy DB swap later
const METRICS = {
  upcomingTrips: 3,
  pendingActions: 1,
  pendingActionLabel: "Waiver Missing",
  monthRevenue: 2450,
};

const NEXT_TRIP = {
  time: "2:30 PM",
  guestName: "Rodriguez Party",
  partySize: 4,
  vesselName: "Sea Breeze",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Captain";

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Captain&apos;s Log
          </h1>
          <p className="mt-1 text-zinc-500">
            Welcome back, Captain {displayName} · {formatDate()}
          </p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="inline-flex h-12 items-center justify-center gap-2 bg-slate-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 sm:h-10 sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Booking
        </Link>
      </header>

      {/* Key Metrics Grid - The Instrument Panel */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Key Metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Upcoming Trips */}
          <div className="border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                  Upcoming Trips
                </p>
                <p className="mt-2 font-mono text-4xl font-semibold tabular-nums text-slate-900">
                  {METRICS.upcomingTrips}
                </p>
                <p className="mt-1 text-sm text-zinc-500">Scheduled</p>
              </div>
              <div className="rounded-sm border border-slate-200 p-2">
                <Anchor className="h-5 w-5 text-slate-900" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Pending Actions */}
          <div className="border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                  Pending Actions
                </p>
                <p className="mt-2 font-mono text-4xl font-semibold tabular-nums text-slate-900">
                  {METRICS.pendingActions}
                </p>
                <p className="mt-1 text-sm text-amber-600 font-medium">
                  {METRICS.pendingActionLabel}
                </p>
              </div>
              <div className="rounded-sm border border-amber-300 bg-amber-50 p-2">
                <AlertCircle className="h-5 w-5 text-amber-500" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Month Revenue */}
          <div className="border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                  Month Revenue
                </p>
                <p className="mt-2 font-mono text-4xl font-semibold tabular-nums text-slate-900">
                  {formatCurrency(METRICS.monthRevenue)}
                </p>
                <p className="mt-1 text-sm text-zinc-500">This month</p>
              </div>
              <div className="rounded-sm border border-slate-200 p-2">
                <DollarSign className="h-5 w-5 text-slate-900" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Up Section - The Manifest Preview */}
      <section aria-labelledby="next-up-heading">
        <h2
          id="next-up-heading"
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          Next Up
        </h2>
        {NEXT_TRIP ? (
          <div className="mt-4 border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              {/* Left: Time Badge + Guest Info */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-20 flex-col items-center justify-center border border-slate-900 bg-slate-900 text-white">
                  <span className="font-mono text-lg font-semibold tabular-nums">
                    {NEXT_TRIP.time.split(" ")[0]}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-slate-300">
                    {NEXT_TRIP.time.split(" ")[1]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{NEXT_TRIP.guestName}</p>
                  <p className="text-sm text-zinc-500">
                    {NEXT_TRIP.partySize} guests · {NEXT_TRIP.vesselName}
                  </p>
                </div>
              </div>

              {/* Right: Dashed border ticket stub effect */}
              <div className="hidden h-14 w-px border-l border-dashed border-slate-300 sm:block" aria-hidden="true" />

              {/* Ticket Stub - Vessel */}
              <div className="flex items-center gap-3 border-t border-dashed border-slate-200 pt-4 sm:border-t-0 sm:pt-0">
                <Ship className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Vessel
                  </p>
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {NEXT_TRIP.vesselName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 border border-dashed border-slate-300 bg-white p-8 text-center">
            <Anchor className="mx-auto h-8 w-8 text-zinc-400" aria-hidden="true" />
            <p className="mt-2 text-sm text-zinc-500">No trips scheduled today</p>
            <p className="mt-1 text-xs text-zinc-400">
              Your next booking will appear here
            </p>
          </div>
        )}
      </section>

      {/* Quick Actions Row */}
      <section aria-labelledby="quick-actions-heading">
        <h2
          id="quick-actions-heading"
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          Quick Actions
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/calendar"
            className="flex h-14 items-center gap-3 border border-slate-200 bg-white px-6 transition-colors hover:border-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            <Calendar className="h-5 w-5 text-slate-900" aria-hidden="true" />
            <span className="font-semibold text-slate-900">View Calendar</span>
          </Link>
          <Link
            href="/dashboard/vessels"
            className="flex h-14 items-center gap-3 border border-slate-200 bg-white px-6 transition-colors hover:border-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            <Ship className="h-5 w-5 text-slate-900" aria-hidden="true" />
            <span className="font-semibold text-slate-900">Manage Vessels</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
