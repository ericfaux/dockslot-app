'use client';

import { X, CalendarCheck, Loader2, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface BlackoutDate {
  id: string;
  blackout_date: string;
  reason: string | null;
}

interface UnblockConfirmModalProps {
  blackout: BlackoutDate | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending?: boolean;
}

export function UnblockConfirmModal({
  blackout,
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
}: UnblockConfirmModalProps) {
  if (!isOpen || !blackout) return null;

  const dateDisplay = format(parseISO(blackout.blackout_date + 'T12:00:00'), 'EEEE, MMMM d, yyyy');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="pointer-events-auto w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                <CalendarCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Unblock Date</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 p-4">
            <p className="text-sm text-slate-300">
              Are you sure you want to unblock this date? Guests will be able to book on this day again.
            </p>

            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <div className="text-sm font-medium text-white">{dateDisplay}</div>
              {blackout.reason && (
                <div className="mt-1 text-xs text-slate-400">
                  Reason: {blackout.reason}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-700 p-4">
            <button
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Unblocking...
                </>
              ) : (
                <>
                  <CalendarCheck className="h-4 w-4" />
                  Unblock
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
