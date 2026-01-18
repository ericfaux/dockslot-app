'use client';

import { useState, useTransition, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Vessel } from '@/lib/db/types';

interface VesselFormProps {
  vessel: Vessel | null;
  onSubmit: (data: {
    name: string;
    capacity: number;
    description?: string;
  }) => Promise<boolean>;
  onClose: () => void;
  error?: string | null;
}

function VesselForm({ vessel, onSubmit, onClose, error }: VesselFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form state from vessel prop (only on mount)
  const [name, setName] = useState(vessel?.name ?? '');
  const [capacity, setCapacity] = useState(vessel?.capacity?.toString() ?? '');
  const [description, setDescription] = useState(vessel?.description ?? '');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate
    if (!name.trim()) {
      setFormError('Vessel name is required');
      return;
    }

    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap <= 0) {
      setFormError('Capacity must be a positive number');
      return;
    }

    if (cap > 100) {
      setFormError('Capacity cannot exceed 100 passengers');
      return;
    }

    startTransition(async () => {
      await onSubmit({
        name: name.trim(),
        capacity: cap,
        description: description.trim() || undefined,
      });
    });
  }, [name, capacity, description, onSubmit]);

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
        {/* Name */}
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">
            Vessel Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Sea Hunter"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            disabled={isPending}
            autoFocus
            required
          />
        </div>

        {/* Capacity */}
        <div>
          <label htmlFor="capacity" className="mb-1.5 block text-sm font-medium text-slate-300">
            Passenger Capacity <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            id="capacity"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="e.g., 6"
            step="1"
            min="1"
            max="100"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 font-mono text-white placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            disabled={isPending}
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Maximum number of passengers this vessel can accommodate
          </p>
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
            placeholder="Brief description of the vessel, equipment, or amenities..."
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
              {vessel ? 'Saving...' : 'Creating...'}
            </>
          ) : vessel ? (
            'Save Changes'
          ) : (
            'Create Vessel'
          )}
        </button>
      </div>
    </form>
  );
}

interface VesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    capacity: number;
    description?: string;
  }) => Promise<boolean>;
  vessel: Vessel | null;
  error?: string | null;
}

export function VesselModal({
  isOpen,
  onClose,
  onSubmit,
  vessel,
  error,
}: VesselModalProps) {
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

  // Use key to remount the form when vessel changes
  const formKey = vessel?.id ?? 'new';

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
            {vessel ? 'Edit Vessel' : 'Add Vessel'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form with key for remounting */}
        <VesselForm
          key={formKey}
          vessel={vessel}
          onSubmit={onSubmit}
          onClose={onClose}
          error={error}
        />
      </div>
    </div>
  );
}
