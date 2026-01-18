'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { TripType } from '@/lib/db/types';

interface TripTypeFormProps {
  tripType: TripType | null;
  onSubmit: (data: {
    title: string;
    duration_hours: number;
    price_total: number;
    deposit_amount: number;
    description?: string;
  }) => Promise<boolean>;
  onClose: () => void;
  error?: string | null;
}

function TripTypeForm({ tripType, onSubmit, onClose, error }: TripTypeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Initialize form state from tripType prop (only on mount)
  const [title, setTitle] = useState(tripType?.title ?? '');
  const [durationHours, setDurationHours] = useState(
    tripType?.duration_hours?.toString() ?? ''
  );
  const [priceTotal, setPriceTotal] = useState(
    tripType?.price_total?.toString() ?? ''
  );
  const [depositAmount, setDepositAmount] = useState(
    tripType?.deposit_amount?.toString() ?? ''
  );
  const [description, setDescription] = useState(tripType?.description ?? '');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate
    if (!title.trim()) {
      setFormError('Title is required');
      return;
    }

    const hours = parseFloat(durationHours);
    if (isNaN(hours) || hours <= 0) {
      setFormError('Duration must be a positive number');
      return;
    }

    const total = parseFloat(priceTotal);
    if (isNaN(total) || total < 0) {
      setFormError('Total price must be a non-negative number');
      return;
    }

    const deposit = parseFloat(depositAmount);
    if (isNaN(deposit) || deposit < 0) {
      setFormError('Deposit must be a non-negative number');
      return;
    }

    if (deposit > total) {
      setFormError('Deposit cannot exceed total price');
      return;
    }

    startTransition(async () => {
      await onSubmit({
        title: title.trim(),
        duration_hours: hours,
        price_total: total,
        deposit_amount: deposit,
        description: description.trim() || undefined,
      });
    });
  }, [title, durationHours, priceTotal, depositAmount, description, onSubmit]);

  const displayError = formError || error;

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {/* Error Message */}
      {displayError && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {displayError}
        </div>
      )}

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-300">
            Title <span className="text-rose-400">*</span>
          </label>
          <input
            ref={titleInputRef}
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Half Day Inshore"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            disabled={isPending}
            autoFocus
            required
          />
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="mb-1.5 block text-sm font-medium text-slate-300">
            Duration (hours) <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            id="duration"
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            placeholder="e.g., 4"
            step="0.5"
            min="0.5"
            max="24"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 font-mono text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            disabled={isPending}
            required
          />
        </div>

        {/* Price and Deposit Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Price */}
          <div>
            <label htmlFor="price" className="mb-1.5 block text-sm font-medium text-slate-300">
              Total Price ($) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                id="price"
                value={priceTotal}
                onChange={(e) => setPriceTotal(e.target.value)}
                placeholder="0"
                step="1"
                min="0"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-7 pr-4 font-mono text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                disabled={isPending}
                required
              />
            </div>
          </div>

          {/* Deposit Amount */}
          <div>
            <label htmlFor="deposit" className="mb-1.5 block text-sm font-medium text-slate-300">
              Deposit ($) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                id="deposit"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0"
                step="1"
                min="0"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-7 pr-4 font-mono text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                disabled={isPending}
                required
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-300">
            Description <span className="text-slate-500">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this trip includes..."
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            disabled={isPending}
          />
        </div>
      </div>

      {/* Modal Footer */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-cyan-500 disabled:opacity-50"
          style={{
            boxShadow: '0 4px 14px rgba(34, 211, 238, 0.25)',
          }}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {tripType ? 'Saving...' : 'Creating...'}
            </>
          ) : tripType ? (
            'Save Changes'
          ) : (
            'Create Trip Type'
          )}
        </button>
      </div>
    </form>
  );
}

interface TripTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    duration_hours: number;
    price_total: number;
    deposit_amount: number;
    description?: string;
  }) => Promise<boolean>;
  tripType: TripType | null;
  error?: string | null;
}

export function TripTypeModal({
  isOpen,
  onClose,
  onSubmit,
  tripType,
  error,
}: TripTypeModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Use key to remount the form when tripType changes
  const formKey = tripType?.id ?? 'new';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-lg border border-slate-700 bg-slate-900"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 id="modal-title" className="text-lg font-medium text-white">
            {tripType ? 'Edit Trip Type' : 'Add Trip Type'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form with key for remounting */}
        <TripTypeForm
          key={formKey}
          tripType={tripType}
          onSubmit={onSubmit}
          onClose={onClose}
          error={error}
        />
      </div>
    </div>
  );
}
