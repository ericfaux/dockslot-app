'use client';

import { useState } from 'react';
import { X, Calendar, Loader2, Ban } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';

interface BlackoutDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (startDate: string, endDate: string, reason: string) => Promise<void>;
}

export function BlackoutDateModal({ isOpen, onClose, onSubmit }: BlackoutDateModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError('Both start and end dates are required');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('End date must be after start date');
      return;
    }

    setIsPending(true);
    try {
      await onSubmit(startDate, endDate, reason.trim());
      onClose();
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create blackout date');
    } finally {
      setIsPending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
                <Ban className="h-5 w-5 text-rose-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Block Dates</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Start Date */}
            <div className="space-y-2">
              <label htmlFor="start-date" className="block text-sm font-medium text-slate-600">
                Start Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label htmlFor="end-date" className="block text-sm font-medium text-slate-600">
                End Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || format(new Date(), 'yyyy-MM-dd')}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label htmlFor="reason" className="block text-sm font-medium text-slate-600">
                Reason (Optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Vessel maintenance, Personal time off..."
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                rows={3}
              />
              <p className="text-xs text-slate-500">
                This is for your reference only. Guests will just see dates as unavailable.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-500/30 p-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-rose-50 px-4 py-2 font-medium text-rose-600 transition-colors hover:bg-rose-500/30 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Blocking...
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4" />
                    Block Dates
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-400 transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
