'use client';

// app/dock/components/DockTripCard.tsx
// Large trip card for Dock Mode
// Design: HUGE time, large guest info, giant action buttons

import { DockTrip, useDockMode } from '../context/DockModeContext';
import { formatInTimeZone } from 'date-fns-tz';
import {
  Phone,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface DockTripCardProps {
  trip: DockTrip;
}

export function DockTripCard({ trip }: DockTripCardProps) {
  const { timezone, goToManifest } = useDockMode();

  // Format trip time
  const tripTime = formatInTimeZone(
    new Date(trip.scheduledStart),
    timezone,
    'h:mm a'
  );
  const tripEndTime = formatInTimeZone(
    new Date(trip.scheduledEnd),
    timezone,
    'h:mm a'
  );

  // Determine trip status
  const now = new Date();
  const tripStart = new Date(trip.scheduledStart);
  const tripEnd = new Date(trip.scheduledEnd);
  const isInProgress = now >= tripStart && now <= tripEnd;
  const isUpcoming = now < tripStart;

  return (
    <div className="rounded-2xl border-2 border-slate-700 bg-slate-900 overflow-hidden">
      {/* Trip Time Header - HUGE */}
      <div className="bg-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-cyan-400" />
            <span className="text-lg text-slate-400 uppercase tracking-wide">
              {isInProgress ? 'In Progress' : isUpcoming ? 'Next Trip' : 'Completed'}
            </span>
          </div>
          <span className="text-xl text-slate-400">{trip.tripType}</span>
        </div>
        <div className="mt-2">
          <span className="text-6xl font-bold text-white tracking-tight">
            {tripTime}
          </span>
          <span className="ml-4 text-2xl text-slate-500">→ {tripEndTime}</span>
        </div>
      </div>

      {/* Guest Info */}
      <div className="px-6 py-5 border-b border-slate-800">
        <p className="text-3xl font-bold text-white mb-2">{trip.guestName}</p>
        <div className="flex items-center gap-4 text-xl text-slate-400">
          <Users className="h-6 w-6" />
          <span>{trip.partySize} guest{trip.partySize !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex border-b border-slate-800">
        <StatusIndicator
          label="Payment"
          isComplete={trip.isPaid}
          completeText={trip.paymentStatus === 'fully_paid' ? 'Paid in Full' : 'Deposit Paid'}
          incompleteText="Unpaid"
        />
        <StatusIndicator
          label="Waivers"
          isComplete={trip.waiversComplete}
          completeText={`${trip.waiversSigned}/${trip.waiversTotal} Signed`}
          incompleteText={`${trip.waiversSigned}/${trip.waiversTotal} Signed`}
        />
      </div>

      {/* Giant Action Buttons */}
      <div className="p-4 space-y-3">
        {/* Call Guest Button */}
        {trip.guestPhone ? (
          <a
            href={`tel:${trip.guestPhone}`}
            className="flex min-h-[72px] items-center justify-center gap-4 rounded-xl bg-emerald-600 px-6 text-white active:bg-emerald-700"
          >
            <Phone className="h-8 w-8" />
            <span className="text-2xl font-bold">CALL GUEST</span>
          </a>
        ) : (
          <div className="flex min-h-[72px] items-center justify-center gap-4 rounded-xl bg-slate-800 px-6 text-slate-500">
            <Phone className="h-8 w-8" />
            <span className="text-2xl font-bold">No Phone Number</span>
          </div>
        )}

        {/* View Manifest Button */}
        <button
          onClick={goToManifest}
          className="flex min-h-[72px] w-full items-center justify-center gap-4 rounded-xl bg-cyan-600 px-6 text-white active:bg-cyan-700"
        >
          <FileText className="h-8 w-8" />
          <span className="text-2xl font-bold">VIEW MANIFEST</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface StatusIndicatorProps {
  label: string;
  isComplete: boolean;
  completeText: string;
  incompleteText: string;
}

function StatusIndicator({
  label,
  isComplete,
  completeText,
  incompleteText,
}: StatusIndicatorProps) {
  return (
    <div className="flex-1 px-6 py-4 text-center">
      <p className="text-base text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-center justify-center gap-2">
        {isComplete ? (
          <>
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <span className="text-xl font-bold text-emerald-400">{completeText}</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-6 w-6 text-amber-400" />
            <span className="text-xl font-bold text-amber-400">{incompleteText}</span>
          </>
        )}
      </div>
    </div>
  );
}
