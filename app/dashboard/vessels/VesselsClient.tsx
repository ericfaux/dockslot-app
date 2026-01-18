'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { Vessel } from '@/lib/db/types';
import { VesselCard } from './components/VesselCard';
import { VesselModal } from './components/VesselModal';
import { createVessel, updateVessel, deleteVessel } from '@/app/actions/vessels';

interface VesselsClientProps {
  initialVessels: Vessel[];
}

export function VesselsClient({ initialVessels }: VesselsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [vessels, setVessels] = useState<Vessel[]>(initialVessels);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddNew = () => {
    setEditingVessel(null);
    setIsModalOpen(true);
    setError(null);
  };

  const handleEdit = (vessel: Vessel) => {
    setEditingVessel(vessel);
    setIsModalOpen(true);
    setError(null);
  };

  const handleDelete = (vesselId: string) => {
    startTransition(async () => {
      setError(null);
      const result = await deleteVessel(vesselId);
      if (result.success) {
        setVessels((prev) => prev.filter((v) => v.id !== vesselId));
        router.refresh();
      } else {
        setError(result.error || 'Failed to delete vessel');
      }
    });
  };

  const handleModalSubmit = async (data: {
    name: string;
    capacity: number;
    description?: string;
  }) => {
    setError(null);

    if (editingVessel) {
      // Update existing vessel
      const result = await updateVessel(editingVessel.id, data);
      if (result.success && result.data) {
        setVessels((prev) =>
          prev.map((v) => (v.id === editingVessel.id ? result.data! : v))
        );
        setIsModalOpen(false);
        setEditingVessel(null);
        router.refresh();
        return true;
      } else {
        setError(result.error || 'Failed to update vessel');
        return false;
      }
    } else {
      // Create new vessel
      const result = await createVessel(data);
      if (result.success && result.data) {
        setVessels((prev) => [...prev, result.data!]);
        setIsModalOpen(false);
        router.refresh();
        return true;
      } else {
        setError(result.error || 'Failed to create vessel');
        return false;
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingVessel(null);
    setError(null);
  };

  return (
    <>
      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Add Vessel Button */}
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
          Add Vessel
        </button>
      </div>

      {/* Vessels List */}
      {vessels.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/50 py-16">
          <div className="mb-4 rounded-full bg-slate-800 p-4">
            <Plus className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-slate-300">No vessels yet</h3>
          <p className="mb-4 max-w-sm text-center text-sm text-slate-500">
            Add your first vessel to start managing your fleet and assigning boats to trips.
          </p>
          <button
            onClick={handleAddNew}
            className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
          >
            Add your first vessel
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vessels.map((vessel) => (
            <VesselCard
              key={vessel.id}
              vessel={vessel}
              onEdit={() => handleEdit(vessel)}
              onDelete={() => handleDelete(vessel.id)}
              isDeleting={isPending}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <VesselModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        vessel={editingVessel}
        error={error}
      />
    </>
  );
}
