'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { TripType } from '@/lib/db/types';
import { TripTypeCard } from './components/TripTypeCard';
import { TripTypeModal } from './components/TripTypeModal';
import { createTripType, updateTripType, deleteTripType } from '@/app/actions/trips';

interface TripsClientProps {
  initialTripTypes: TripType[];
}

export function TripsClient({ initialTripTypes }: TripsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tripTypes, setTripTypes] = useState<TripType[]>(initialTripTypes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTripType, setEditingTripType] = useState<TripType | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setTripTypes((prev) => prev.filter((t) => t.id !== tripTypeId));
        router.refresh();
      } else {
        setError(result.error || 'Failed to delete trip type');
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
  }) => {
    setError(null);

    if (editingTripType) {
      // Update existing trip type
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
      // Create new trip type
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
    <>
      {/* Error Message */}
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

      {/* Trip Types List */}
      {tripTypes.length === 0 ? (
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
          {tripTypes.map((tripType) => (
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

      {/* Modal */}
      <TripTypeModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        tripType={editingTripType}
        error={error}
      />
    </>
  );
}
