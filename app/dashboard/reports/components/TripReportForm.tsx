'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Save, AlertCircle } from 'lucide-react';

interface Vessel {
  id: string;
  name: string;
}

interface Booking {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  guest_name: string;
  party_size: number;
  vessel_id: string;
  trip_type: any;
}

interface Props {
  vessels: Vessel[];
  booking?: Booking | null;
}

export function TripReportForm({ vessels, booking }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultStart = booking?.scheduled_start
    ? new Date(booking.scheduled_start)
    : new Date();
  const defaultEnd = booking?.scheduled_end ? new Date(booking.scheduled_end) : new Date();

  const [formData, setFormData] = useState({
    bookingId: booking?.id || '',
    vesselId: booking?.vessel_id || vessels[0]?.id || '',
    departureTime: format(defaultStart, "yyyy-MM-dd'T'HH:mm"),
    arrivalTime: format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
    actualPassengers: booking?.party_size || 1,
    conditionsSummary: 'Calm',
    incidents: '',
    notes: '',
    safetyEquipmentChecked: true,
    fuelUsed: '',
    hoursOperated: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/trip-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          bookingId: formData.bookingId || null,
          fuelUsed: formData.fuelUsed ? parseFloat(formData.fuelUsed) : null,
          hoursOperated: formData.hoursOperated
            ? parseFloat(formData.hoursOperated)
            : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create report');
      }

      router.push('/dashboard/reports');
      router.refresh();
    } catch (err) {
      console.error('Failed to create report:', err);
      setError(err instanceof Error ? err.message : 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-4 text-rose-600">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Trip Details</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Vessel */}
          <div>
            <label className="block text-sm font-medium text-slate-600">Vessel</label>
            <select
              value={formData.vesselId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, vesselId: e.target.value }))
              }
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {vessels.map((vessel) => (
                <option key={vessel.id} value={vessel.id}>
                  {vessel.name}
                </option>
              ))}
            </select>
          </div>

          {/* Passengers */}
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Actual Passengers
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.actualPassengers}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  actualPassengers: parseInt(e.target.value),
                }))
              }
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Departure Time */}
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Departure Time
            </label>
            <input
              type="datetime-local"
              value={formData.departureTime}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, departureTime: e.target.value }))
              }
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Arrival Time */}
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Arrival Time
            </label>
            <input
              type="datetime-local"
              value={formData.arrivalTime}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, arrivalTime: e.target.value }))
              }
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Conditions</h2>

        <div className="space-y-4">
          {/* Conditions Summary */}
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Sea Conditions
            </label>
            <select
              value={formData.conditionsSummary}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, conditionsSummary: e.target.value }))
              }
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="Calm">Calm (&lt; 1 ft seas)</option>
              <option value="Moderate">Moderate (1-3 ft seas)</option>
              <option value="Rough">Rough (3-6 ft seas)</option>
              <option value="Very Rough">Very Rough (6+ ft seas)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Safety & Incidents */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Safety & Incidents</h2>

        <div className="space-y-4">
          {/* Safety Equipment */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="safetyCheck"
              checked={formData.safetyEquipmentChecked}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  safetyEquipmentChecked: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-slate-300 bg-slate-100 text-cyan-600 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-slate-800"
            />
            <label htmlFor="safetyCheck" className="text-sm text-slate-600">
              Safety equipment checked and accounted for
            </label>
          </div>

          {/* Incidents */}
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Incidents / Issues (if any)
            </label>
            <textarea
              value={formData.incidents}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, incidents: e.target.value }))
              }
              rows={3}
              placeholder="Any injuries, equipment failures, near-misses, or other incidents..."
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Operational */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Operational Notes</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Fuel Used */}
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Fuel Used (gallons, optional)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.fuelUsed}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, fuelUsed: e.target.value }))
              }
              placeholder="0.0"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Engine Hours */}
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Engine Hours (optional)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.hoursOperated}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, hoursOperated: e.target.value }))
              }
              placeholder="0.0"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* General Notes */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-600">
            General Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={4}
            placeholder="Guest experience, route taken, wildlife sightings, maintenance needed..."
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-slate-300 bg-slate-100 px-6 py-3 font-medium text-slate-900 transition-colors hover:bg-slate-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save Report'}
        </button>
      </div>
    </form>
  );
}
