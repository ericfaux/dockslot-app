'use client';

import { CheckCircle2, Circle, FileSignature, PartyPopper } from 'lucide-react';

interface WaiverStatusProps {
  totalSigned: number;
  totalRequired: number;
  allComplete: boolean;
}

export function WaiverStatus({
  totalSigned,
  totalRequired,
  allComplete,
}: WaiverStatusProps) {
  const percentage = totalRequired > 0 ? (totalSigned / totalRequired) * 100 : 0;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      {allComplete ? (
        <div className="text-center py-4">
          <div className="flex justify-center mb-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <PartyPopper className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            All Waivers Complete!
          </h3>
          <p className="text-sm text-slate-400">
            All passengers have signed the required waivers. You&apos;re all set for your trip!
          </p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Waiver Progress</span>
            </div>
            <span className="text-sm text-slate-400">
              {totalSigned} of {totalRequired} signed
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative h-2 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Signed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Circle className="h-3.5 w-3.5 text-slate-500" />
              <span>Pending</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface PassengerWaiverCardProps {
  passengerName: string;
  isPrimaryContact: boolean;
  signedCount: number;
  totalCount: number;
  isComplete: boolean;
  onSignClick?: () => void;
}

export function PassengerWaiverCard({
  passengerName,
  isPrimaryContact,
  signedCount,
  totalCount,
  isComplete,
  onSignClick,
}: PassengerWaiverCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isComplete
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status icon */}
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isComplete ? 'bg-emerald-500/20' : 'bg-slate-800'
            }`}
          >
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <Circle className="h-5 w-5 text-slate-500" />
            )}
          </div>

          {/* Name and status */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{passengerName}</span>
              {isPrimaryContact && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-cyan-500/20 text-cyan-400 uppercase tracking-wide">
                  Primary
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">
              {isComplete ? (
                <span className="text-emerald-400">All waivers signed</span>
              ) : (
                <>
                  {signedCount} of {totalCount} waiver{totalCount !== 1 ? 's' : ''} signed
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action button */}
        {!isComplete && onSignClick && (
          <button
            onClick={onSignClick}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium transition-colors"
          >
            Sign Waiver
          </button>
        )}
        {isComplete && (
          <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Complete</span>
          </div>
        )}
      </div>
    </div>
  );
}
