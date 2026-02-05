'use client';

// app/dock/components/DockManifest.tsx
// Manifest view for Dock Mode
// Shows large passenger names with waiver status and tap-to-call

import { useState, useTransition } from 'react';
import { useDockMode } from '../context/DockModeContext';
import {
  ArrowLeft,
  Phone,
  CheckCircle2,
  AlertCircle,
  Users,
  UserCheck,
  Loader2,
} from 'lucide-react';

export function DockManifest() {
  const {
    currentTrip,
    passengers,
    goBack,
    timezone,
    refreshData,
  } = useDockMode();

  const [isPending, startTransition] = useTransition();
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  if (!currentTrip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <p className="text-2xl text-slate-400">No trip selected</p>
          <button
            onClick={goBack}
            className="mt-4 rounded-xl bg-cyan-600 px-8 py-4 text-xl font-bold text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleCheckInAll = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/dock/check-in-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: currentTrip.id }),
        });

        if (response.ok) {
          setCheckInSuccess(true);
          await refreshData();
          // Reset success message after 3 seconds
          setTimeout(() => setCheckInSuccess(false), 3000);
        }
      } catch (error) {
        console.error('Failed to check in all guests:', error);
      }
    });
  };

  const allWaiversSigned = passengers.every(p => p.waiverSigned);
  const signedCount = passengers.filter(p => p.waiverSigned).length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* Header with Back Button */}
      <header className="flex items-center gap-4 border-b border-slate-800 px-4 py-3">
        <button
          onClick={goBack}
          className="flex min-h-[60px] min-w-[60px] items-center justify-center rounded-xl bg-slate-800 text-white active:bg-slate-700"
          aria-label="Go back"
        >
          <ArrowLeft className="h-8 w-8" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Manifest</h1>
          <p className="text-lg text-slate-400">{currentTrip.guestName}</p>
        </div>
      </header>

      {/* Waiver Summary */}
      <div className="border-b border-slate-800 bg-slate-900 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 text-cyan-400" />
            <span className="text-xl text-white">
              {currentTrip.partySize} Guest{currentTrip.partySize !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {allWaiversSigned ? (
              <>
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                <span className="text-xl font-bold text-emerald-400">
                  All Waivers Signed
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-7 w-7 text-amber-400" />
                <span className="text-xl font-bold text-amber-400">
                  {signedCount}/{passengers.length} Signed
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Passenger List */}
      <main className="flex-1 overflow-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {passengers.length > 0 ? (
            passengers.map((passenger) => (
              <PassengerRow key={passenger.id} passenger={passenger} />
            ))
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <p className="text-xl text-slate-400">No passengers registered</p>
              <p className="text-base text-slate-500 mt-2">
                Guest manifest will appear here
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="border-t border-slate-800 bg-slate-900 px-4 py-4 safe-area-bottom">
        <div className="mx-auto max-w-2xl">
          {checkInSuccess ? (
            <div className="flex min-h-[72px] items-center justify-center gap-4 rounded-xl bg-emerald-600/20 border-2 border-emerald-500 px-6 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
              <span className="text-2xl font-bold">All Guests Checked In!</span>
            </div>
          ) : (
            <button
              onClick={handleCheckInAll}
              disabled={isPending}
              className="flex min-h-[72px] w-full items-center justify-center gap-4 rounded-xl bg-emerald-600 px-6 text-white active:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <UserCheck className="h-8 w-8" />
              )}
              <span className="text-2xl font-bold">
                {isPending ? 'Checking In...' : 'All Guests Checked In'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface PassengerRowProps {
  passenger: {
    id: string;
    name: string;
    phone: string | null;
    waiverSigned: boolean;
    isCheckedIn: boolean;
  };
}

function PassengerRow({ passenger }: PassengerRowProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        {/* Passenger Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Waiver Status Icon */}
          {passenger.waiverSigned ? (
            <CheckCircle2 className="h-8 w-8 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-8 w-8 flex-shrink-0 text-amber-400" />
          )}

          {/* Name */}
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold text-white truncate">
              {passenger.name}
            </p>
            <p className={`text-base ${passenger.waiverSigned ? 'text-emerald-400' : 'text-amber-400'}`}>
              {passenger.waiverSigned ? 'Waiver signed' : 'Waiver pending'}
            </p>
          </div>
        </div>

        {/* Call Button */}
        {passenger.phone && (
          <a
            href={`tel:${passenger.phone}`}
            className="flex min-h-[60px] min-w-[60px] items-center justify-center rounded-xl bg-cyan-600 text-white active:bg-cyan-700"
            aria-label={`Call ${passenger.name}`}
          >
            <Phone className="h-7 w-7" />
          </a>
        )}
      </div>
    </div>
  );
}
