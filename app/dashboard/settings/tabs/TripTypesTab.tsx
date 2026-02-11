'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { TripType } from '@/lib/db/types';
import { TripTypeCard } from '@/app/dashboard/trips/components/TripTypeCard';
import { TripTypeModal } from '@/app/dashboard/trips/components/TripTypeModal';
import { createTripType, updateTripType, deleteTripType, reactivateTripType } from '@/app/actions/trips';

interface TripTypesTabProps {
  initialTripTypes: TripType[];
  captainId?: string;
}

export function TripTypesTab({ initialTripTypes, captainId }: TripTypesTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tripTypes, setTripTypes] = useState<TripType[]>(initialTripTypes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTripType, setEditingTripType] = useState<TripType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeTripTypes = tripTypes.filter((t) => t.is_active);
  const archivedTripTypes = tripTypes.filter((t) => !t.is_active);

  const handleAddNew = () => {
    setEditingTripType(null);
    setIsModalOpen(true);
    setError(null);
  };

  const handleEdit = (tripType: TripType) => {
    setEditingTripType(tripType);
    setIsModalOpen(true);
    setError(null);
  };

  const handleDelete = (tripTypeId: string) => {
    startTransition(async () => {
      setError(null);
      const result = await deleteTripType(tripTypeId);
      if (result.success) {
        if (result.data?.archived) {
          // Soft deleted — mark as inactive in local state
          setTripTypes((prev) =>
            prev.map((t) => (t.id === tripTypeId ? { ...t, is_active: false } : t))
          );
        } else {
          // Hard deleted — remove from local state
          setTripTypes((prev) => prev.filter((t) => t.id !== tripTypeId));
        }
        router.refresh();
      } else {
        setError(result.error || 'Failed to archive trip type');
      }
    });
  };

  const handleRestore = (tripTypeId: string) => {
    startTransition(async () => {
      setError(null);
      const result = await reactivateTripType(tripTypeId);
      if (result.success && result.data) {
        setTripTypes((prev) =>
          prev.map((t) => (t.id === tripTypeId ? result.data! : t))
        );
        router.refresh();
      } else {
        setError(result.error || 'Failed to restore trip type');
      }
    });
  };

  const handleModalSubmit = async (data: {
    title: string;
    duration_hours: number;
    price_total: number;
    deposit_amount: number;
    description?: string;
    departure_times?: string[] | null;
    image_url?: string | null;
  }) => {
    setError(null);

    if (editingTripType) {
      const result = await updateTripType(editingTripType.id, data);
      if (result.success && result.data) {
        setTripTypes((prev) =>
          prev.map((t) => (t.id === editingTripType.id ? result.data! : t))
        );
        setIsModalOpen(false);
        setEditingTripType(null);
        router.refresh();
        return true;
      } else {
        setError(result.error || 'Failed to update trip type');
        return false;
      }
    } else {
      const result = await createTripType(data);
      if (result.success && result.data) {
        setTripTypes((prev) => [...prev, result.data!]);
        setIsModalOpen(false);
        router.refresh();
        return true;
      } else {
        setError(result.error || 'Failed to create trip type');
        return false;
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTripType(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-400">
          Configure the types of trips you offer. Each trip type defines the duration, pricing, and deposit requirements.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* Add Trip Type Button */}
      <div className="flex justify-end">
        <button
          onClick={handleAddNew}
          disabled={isPending}
          className="group flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-75 hover:bg-cyan-500 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            boxShadow: '0 4px 14px rgba(34, 211, 238, 0.25)',
          }}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add Trip Type
        </button>
      </div>

      {/* Active Trip Types List */}
      {activeTripTypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-16">
          <div className="mb-4 rounded-full bg-white p-4">
            <Plus className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-slate-600">No trip types yet</h3>
          <p className="mb-4 max-w-sm text-center text-sm text-slate-500">
            Create your first trip type to define the fishing charters and excursions you offer.
          </p>
          <button
            onClick={handleAddNew}
            className="text-sm font-medium text-cyan-600 hover:text-cyan-600"
          >
            Add your first trip type
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeTripTypes.map((tripType) => (
            <TripTypeCard
              key={tripType.id}
              tripType={tripType}
              onEdit={() => handleEdit(tripType)}
              onDelete={() => handleDelete(tripType.id)}
              isDeleting={isPending}
            />
          ))}
        </div>
      )}

      {/* Archived Section */}
      {archivedTripTypes.length > 0 && (
        <div className="border-t border-slate-200 pt-6">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <Archive className="h-4 w-4" />
            Archived Trip Types ({archivedTripTypes.length})
            {showArchived ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {showArchived && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archivedTripTypes.map((tripType) => (
                <TripTypeCard
                  key={tripType.id}
                  tripType={tripType}
                  onEdit={() => handleEdit(tripType)}
                  onDelete={() => handleDelete(tripType.id)}
                  onRestore={() => handleRestore(tripType.id)}
                  isDeleting={isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <TripTypeModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        tripType={editingTripType}
        captainId={captainId}
        error={error}
      />
    </div>
  );
}
