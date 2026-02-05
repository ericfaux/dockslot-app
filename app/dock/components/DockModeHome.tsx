'use client';

// app/dock/components/DockModeHome.tsx
// Dock Mode Home Screen
// Shows current/next trip, weather, and captain's phone number
// Design: LARGE text, HIGH contrast, HUGE tap targets

import { useDockMode } from '../context/DockModeContext';
import { DockTripCard } from './DockTripCard';
import { DockWeatherWidget } from './DockWeatherWidget';
import { DockQuickActions } from './DockQuickActions';
import { Phone, Anchor, RefreshCw } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';

export function DockModeHome() {
  const {
    todayTrips,
    currentTrip,
    weather,
    captainPhone,
    captainName,
    timezone,
    isLoading,
    refreshData,
  } = useDockMode();

  const hasTripsToday = todayTrips.length > 0;

  // Format current time in captain's timezone
  const currentTime = formatInTimeZone(new Date(), timezone, 'h:mm a');

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* Header - Minimal with time and branding */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Anchor className="h-6 w-6 text-cyan-400" />
          <span className="text-lg font-bold text-white tracking-wide">DOCK MODE</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-mono font-bold text-white">{currentTime}</span>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="rounded-full bg-slate-800 p-3 text-slate-400 hover:text-white active:bg-slate-700 disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Weather Widget - Always visible */}
          <DockWeatherWidget />

          {/* Trip Content */}
          {hasTripsToday && currentTrip ? (
            <DockTripCard trip={currentTrip} />
          ) : (
            <NoTripsMessage />
          )}

          {/* Captain's Emergency Phone - For guests to call */}
          {captainPhone && (
            <div className="rounded-2xl border-2 border-slate-700 bg-slate-900 p-6">
              <p className="mb-3 text-center text-lg text-slate-400">
                Your number (for guests):
              </p>
              <a
                href={`tel:${captainPhone}`}
                className="flex items-center justify-center gap-4 rounded-xl bg-slate-800 px-6 py-4"
              >
                <Phone className="h-8 w-8 text-cyan-400" />
                <span className="text-2xl font-bold text-white tracking-wide">
                  {formatPhoneNumber(captainPhone)}
                </span>
              </a>
              <p className="mt-3 text-center text-sm text-slate-500">
                Show this to guests if they need to reach you
              </p>
            </div>
          )}

          {/* Multiple Trips Indicator */}
          {todayTrips.length > 1 && (
            <TripSelector />
          )}
        </div>
      </main>

      {/* Quick Actions - Fixed at bottom */}
      <DockQuickActions />
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function NoTripsMessage() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
      <Anchor className="mx-auto h-16 w-16 text-slate-600 mb-4" />
      <h2 className="text-3xl font-bold text-white mb-2">No Trips Today</h2>
      <p className="text-xl text-slate-400">Enjoy your day off, Captain!</p>
    </div>
  );
}

function TripSelector() {
  const { todayTrips, currentTrip, setCurrentTrip, timezone } = useDockMode();

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="mb-3 text-center text-base text-slate-400">
        {todayTrips.length} trips today - tap to switch
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {todayTrips.map((trip, index) => {
          const isActive = trip.id === currentTrip?.id;
          const tripTime = formatInTimeZone(
            new Date(trip.scheduledStart),
            timezone,
            'h:mm a'
          );
          return (
            <button
              key={trip.id}
              onClick={() => setCurrentTrip(trip)}
              className={`min-h-[60px] min-w-[100px] rounded-xl border-2 px-4 py-3 text-lg font-bold transition-all ${
                isActive
                  ? 'border-cyan-500 bg-cyan-500/20 text-white'
                  : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              {tripTime}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}
