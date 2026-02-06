'use client';

import { User, Mail, Phone, Star } from 'lucide-react';
import { Passenger } from '@/lib/db/types';

interface PassengerListProps {
  passengers: Passenger[];
  isExpanded: boolean;
}

export function PassengerList({ passengers, isExpanded }: PassengerListProps) {
  if (!isExpanded || passengers.length === 0) {
    return null;
  }

  // Sort passengers: primary contact first, then alphabetically
  const sortedPassengers = [...passengers].sort((a, b) => {
    if (a.is_primary_contact && !b.is_primary_contact) return -1;
    if (!a.is_primary_contact && b.is_primary_contact) return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <User className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Passengers ({passengers.length})
        </span>
      </div>
      <div className="space-y-3">
        {sortedPassengers.map((passenger) => (
          <div
            key={passenger.id}
            className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-3"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{passenger.full_name}</span>
              {passenger.is_primary_contact && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-600">
                  <Star className="h-3 w-3" />
                  Primary
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
              {passenger.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {passenger.email}
                </span>
              )}
              {passenger.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {passenger.phone}
                </span>
              )}
            </div>
            {passenger.notes && (
              <p className="mt-1 text-xs text-slate-500">{passenger.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
