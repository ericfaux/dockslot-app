'use client';

// app/dock/components/DockQuickActions.tsx
// Quick action bar for Dock Mode
// Fixed at bottom of screen with large buttons

import { useState, useTransition } from 'react';
import { useDockMode } from '../context/DockModeContext';
import {
  CheckCircle2,
  CloudRain,
  LogOut,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DockQuickActions() {
  const router = useRouter();
  const {
    currentTrip,
    markTripComplete,
    setWeatherHold,
    isLoading,
  } = useDockMode();

  const [isPending, startTransition] = useTransition();
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  const [showConfirmWeatherHold, setShowConfirmWeatherHold] = useState(false);

  const handleMarkComplete = () => {
    if (showConfirmComplete) {
      startTransition(async () => {
        await markTripComplete();
        setShowConfirmComplete(false);
      });
    } else {
      setShowConfirmComplete(true);
      setShowConfirmWeatherHold(false);
      // Auto-hide after 3 seconds
      setTimeout(() => setShowConfirmComplete(false), 3000);
    }
  };

  const handleWeatherHold = () => {
    if (showConfirmWeatherHold) {
      startTransition(async () => {
        await setWeatherHold();
        setShowConfirmWeatherHold(false);
      });
    } else {
      setShowConfirmWeatherHold(true);
      setShowConfirmComplete(false);
      // Auto-hide after 3 seconds
      setTimeout(() => setShowConfirmWeatherHold(false), 3000);
    }
  };

  const handleExitDockMode = () => {
    router.push('/dashboard');
  };

  const isDisabled = isLoading || isPending || !currentTrip;

  return (
    <div className="border-t-2 border-slate-800 bg-slate-900 px-4 py-4 safe-area-bottom">
      <div className="mx-auto max-w-2xl">
        <div className="grid grid-cols-3 gap-3">
          {/* Mark Trip Complete */}
          <button
            onClick={handleMarkComplete}
            disabled={isDisabled}
            className={`flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-xl px-4 text-white transition-colors disabled:opacity-50 ${
              showConfirmComplete
                ? 'bg-emerald-600 active:bg-emerald-700'
                : 'bg-slate-800 active:bg-slate-700'
            }`}
          >
            {isPending && showConfirmComplete ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            )}
            <span className="text-sm font-bold uppercase tracking-wide">
              {showConfirmComplete ? 'Confirm?' : 'Complete'}
            </span>
          </button>

          {/* Weather Hold */}
          <button
            onClick={handleWeatherHold}
            disabled={isDisabled}
            className={`flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-xl px-4 text-white transition-colors disabled:opacity-50 ${
              showConfirmWeatherHold
                ? 'bg-amber-600 active:bg-amber-700'
                : 'bg-slate-800 active:bg-slate-700'
            }`}
          >
            {isPending && showConfirmWeatherHold ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <CloudRain className="h-7 w-7 text-amber-400" />
            )}
            <span className="text-sm font-bold uppercase tracking-wide">
              {showConfirmWeatherHold ? 'Confirm?' : 'Weather'}
            </span>
          </button>

          {/* Exit Dock Mode */}
          <button
            onClick={handleExitDockMode}
            className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 text-white active:bg-slate-700"
          >
            <LogOut className="h-7 w-7 text-rose-400" />
            <span className="text-sm font-bold uppercase tracking-wide">
              Exit
            </span>
          </button>
        </div>

        {/* Confirmation Messages */}
        {showConfirmComplete && (
          <p className="mt-3 text-center text-base text-emerald-400">
            Tap again to mark trip as complete
          </p>
        )}
        {showConfirmWeatherHold && (
          <p className="mt-3 text-center text-base text-amber-400">
            Tap again to set weather hold
          </p>
        )}
      </div>
    </div>
  );
}
