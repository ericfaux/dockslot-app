'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import { X, Loader2, Plus, Clock } from 'lucide-react';
import { TripType } from '@/lib/db/types';
import { ImageUpload } from '@/components/ui/ImageUpload';

// Generate time options in 30-minute increments for the dropdown
function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      const label = m === 0
        ? `${displayH}:00 ${period}`
        : `${displayH}:${String(m).padStart(2, '0')} ${period}`;
      options.push({ value: label, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

interface TripTypeFormData {
  title: string;
  duration_hours: number;
  price_total: number;
  deposit_amount: number;
  description?: string;
  departure_times?: string[] | null;
  image_url?: string | null;
}

interface TripTypeFormProps {
  tripType: TripType | null;
  captainId?: string;
  onSubmit: (data: TripTypeFormData) => Promise<boolean>;
  onClose: () => void;
  error?: string | null;
}

function TripTypeForm({ tripType, captainId, onSubmit, onClose, error }: TripTypeFormProps) {
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
  const [imageUrl, setImageUrl] = useState(tripType?.image_url ?? '');
  const [departureTimes, setDepartureTimes] = useState<string[]>(
    tripType?.departure_times ?? []
  );
  const [newDepartureTime, setNewDepartureTime] = useState('');

  const addDepartureTime = () => {
    if (!newDepartureTime) return;
    if (departureTimes.includes(newDepartureTime)) return;
    setDepartureTimes(prev => [...prev, newDepartureTime].sort((a, b) => {
      return TIME_OPTIONS.findIndex(o => o.value === a) - TIME_OPTIONS.findIndex(o => o.value === b);
    }));
    setNewDepartureTime('');
  };

  const removeDepartureTime = (time: string) => {
    setDepartureTimes(prev => prev.filter(t => t !== time));
  };

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
        departure_times: departureTimes.length > 0 ? departureTimes : null,
        image_url: imageUrl || null,
      });
    });
  }, [title, durationHours, priceTotal, depositAmount, description, departureTimes, imageUrl, onSubmit]);

  const displayError = formError || error;

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {/* Error Message */}
      {displayError && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {displayError}
        </div>
      )}

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-600">
            Title <span className="text-rose-600">*</span>
          </label>
          <input
            ref={titleInputRef}
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Half Day Inshore"
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            disabled={isPending}
            autoFocus
            required
          />
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="mb-1.5 block text-sm font-medium text-slate-600">
            Duration (hours) <span className="text-rose-600">*</span>
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
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-mono text-slate-900 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            disabled={isPending}
            required
          />
        </div>

        {/* Price and Deposit Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Price */}
          <div>
            <label htmlFor="price" className="mb-1.5 block text-sm font-medium text-slate-600">
              Total Price ($) <span className="text-rose-600">*</span>
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
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-7 pr-4 font-mono text-slate-900 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                disabled={isPending}
                required
              />
            </div>
          </div>

          {/* Deposit Amount */}
          <div>
            <label htmlFor="deposit" className="mb-1.5 block text-sm font-medium text-slate-600">
              Deposit ($) <span className="text-rose-600">*</span>
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
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-7 pr-4 font-mono text-slate-900 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                disabled={isPending}
                required
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-600">
            Description <span className="text-slate-500">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this trip includes..."
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            disabled={isPending}
          />
        </div>

        {/* Trip Image */}
        <ImageUpload
          currentImageUrl={imageUrl || null}
          onUpload={(url) => setImageUrl(url)}
          onRemove={() => setImageUrl('')}
          bucket="captain-assets"
          storagePath={`${captainId || 'unknown'}/trips/${tripType?.id || 'new'}`}
          label="Trip Image"
          hint="Shown on the trip card. Square or landscape images work best."
          maxSizeMB={3}
          aspectRatio="16/9"
        />

        {/* Departure Times */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            Departure Times <span className="text-slate-500">(optional)</span>
          </label>
          <p className="mb-2 text-xs text-slate-400">
            Set specific departure times. If none are set, slots are generated every 30 minutes.
          </p>

          {/* Existing departure times */}
          {departureTimes.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {departureTimes.map((time) => (
                <span
                  key={time}
                  className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm text-cyan-700"
                >
                  <Clock className="h-3 w-3" />
                  {time}
                  <button
                    type="button"
                    onClick={() => removeDepartureTime(time)}
                    disabled={isPending}
                    className="ml-0.5 rounded-full p-0.5 text-cyan-400 hover:bg-cyan-100 hover:text-cyan-700 disabled:opacity-50"
                    aria-label={`Remove ${time}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add departure time */}
          <div className="flex gap-2">
            <select
              value={newDepartureTime}
              onChange={(e) => setNewDepartureTime(e.target.value)}
              disabled={isPending}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="">Select a time...</option>
              {TIME_OPTIONS.filter(opt => !departureTimes.includes(opt.value)).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addDepartureTime}
              disabled={isPending || !newDepartureTime}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white disabled:opacity-50"
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
  onSubmit: (data: TripTypeFormData) => Promise<boolean>;
  tripType: TripType | null;
  captainId?: string;
  error?: string | null;
}

export function TripTypeModal({
  isOpen,
  onClose,
  onSubmit,
  tripType,
  captainId,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-t-lg">
          <h2 id="modal-title" className="text-lg font-medium text-slate-900">
            {tripType ? 'Edit Trip Type' : 'Add Trip Type'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form with key for remounting */}
        <TripTypeForm
          key={formKey}
          tripType={tripType}
          captainId={captainId}
          onSubmit={onSubmit}
          onClose={onClose}
          error={error}
        />
      </div>
    </div>
  );
}
