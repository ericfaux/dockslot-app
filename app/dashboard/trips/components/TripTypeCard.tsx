'use client';

import { useState } from 'react';
import { Clock, DollarSign, Pencil, Trash2, AlertTriangle, Navigation } from 'lucide-react';
import { TripType } from '@/lib/db/types';
import { formatDollars } from '@/lib/utils/format';

interface TripTypeCardProps {
  tripType: TripType;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function TripTypeCard({ tripType, onEdit, onDelete, isDeleting }: TripTypeCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDuration = (hours: number) => {
    if (hours === 1) return '1 hour';
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (Number.isInteger(hours)) return `${hours} hours`;
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className="group relative flex flex-col rounded-lg border border-slate-200 bg-white transition-all hover:border-cyan-300"
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between border-b border-slate-200 p-4">
        <div className="flex-1 pr-2">
          <h3 className="font-medium text-slate-900">{tripType.title}</h3>
          {tripType.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-400">{tripType.description}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="rounded-md p-2 text-slate-400 hover:bg-white hover:text-cyan-600"
            title="Edit trip type"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="rounded-md p-2 text-slate-400 hover:bg-white hover:text-rose-600 disabled:opacity-50"
            title="Delete trip type"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Card Body - Stats */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Duration */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
            <Clock className="h-4 w-4 text-cyan-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Duration</div>
            <div className="font-mono text-lg text-slate-900">
              {formatDuration(tripType.duration_hours)}
            </div>
          </div>
        </div>

        {/* Total Price */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Total Price</div>
            <div className="font-mono text-lg text-emerald-600">
              {formatDollars(tripType.price_total)}
            </div>
          </div>
        </div>

        {/* Deposit */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
            <DollarSign className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Deposit Required</div>
            <div className="font-mono text-lg text-amber-600">
              {formatDollars(tripType.deposit_amount)}
            </div>
          </div>
        </div>

        {/* Departure Times */}
        {tripType.departure_times && tripType.departure_times.length > 0 && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
              <Navigation className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Departures</div>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {tripType.departure_times.map((time) => (
                  <span
                    key={time}
                    className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {time}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-white/95 p-4">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
            <AlertTriangle className="h-6 w-6 text-rose-600" />
          </div>
          <p className="mb-4 text-center text-sm text-slate-600">
            Delete <span className="font-medium text-slate-900">{tripType.title}</span>?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCancelDelete}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
