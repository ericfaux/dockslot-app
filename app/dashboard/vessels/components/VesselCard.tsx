'use client';

import { useState } from 'react';
import { Ship, Users, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Vessel } from '@/lib/db/types';

interface VesselCardProps {
  vessel: Vessel;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function VesselCard({ vessel, onEdit, onDelete, isDeleting }: VesselCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
          <div className="flex items-center gap-2">
            <Ship className="h-5 w-5 text-cyan-600" />
            <h3 className="font-medium text-slate-900">{vessel.name}</h3>
          </div>
          {vessel.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-400">{vessel.description}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="rounded-md p-2 text-slate-400 hover:bg-white hover:text-cyan-600"
            title="Edit vessel"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="rounded-md p-2 text-slate-400 hover:bg-white hover:text-rose-600 disabled:opacity-50"
            title="Delete vessel"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Card Body - Stats */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Capacity */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Passenger Capacity</div>
            <div className="font-mono text-lg text-emerald-600">
              {vessel.capacity} {vessel.capacity === 1 ? 'passenger' : 'passengers'}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-white/95 p-4">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
            <AlertTriangle className="h-6 w-6 text-rose-600" />
          </div>
          <p className="mb-4 text-center text-sm text-slate-600">
            Delete <span className="font-medium text-slate-900">{vessel.name}</span>?
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
