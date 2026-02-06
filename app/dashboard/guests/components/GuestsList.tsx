'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Users,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Star,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

interface Guest {
  email: string;
  name: string;
  phone: string | null;
  bookings: any[];
  totalTrips: number;
  totalSpent: number;
  lastTripDate: string | null;
  firstTripDate: string | null;
  favoriteTrip: string | null;
}

interface Props {
  guests: Guest[];
}

export function GuestsList({ guests }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'repeat' | 'new'>('all');
  const [expandedGuest, setExpandedGuest] = useState<string | null>(null);

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'repeat' && guest.totalTrips > 1) ||
      (filterType === 'new' && guest.totalTrips === 1);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search guests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />

        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            All ({guests.length})
          </button>
          <button
            onClick={() => setFilterType('repeat')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'repeat'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Repeat ({guests.filter((g) => g.totalTrips > 1).length})
          </button>
          <button
            onClick={() => setFilterType('new')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'new'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            New ({guests.filter((g) => g.totalTrips === 1).length})
          </button>
        </div>
      </div>

      {/* Guests Grid */}
      <div className="space-y-3">
        {filteredGuests.map((guest) => {
          const isExpanded = expandedGuest === guest.email;
          const isRepeat = guest.totalTrips > 1;
          const isVIP = guest.totalTrips >= 5;

          return (
            <div
              key={guest.email}
              className={`rounded-lg border bg-slate-800 transition-colors ${
                isVIP
                  ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/5 to-transparent'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div
                className="flex cursor-pointer items-start justify-between p-5"
                onClick={() => setExpandedGuest(isExpanded ? null : guest.email)}
              >
                <div className="flex flex-1 items-start gap-4">
                  {/* Badge */}
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                      isVIP
                        ? 'bg-amber-500/20'
                        : isRepeat
                          ? 'bg-green-500/20'
                          : 'bg-blue-500/20'
                    }`}
                  >
                    {isVIP ? (
                      <Award className="h-6 w-6 text-amber-400" />
                    ) : isRepeat ? (
                      <Star className="h-6 w-6 text-green-400" />
                    ) : (
                      <Users className="h-6 w-6 text-blue-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{guest.name}</h3>
                      {isVIP && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                          VIP
                        </span>
                      )}
                      {isRepeat && !isVIP && (
                        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-300">
                          Repeat
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {guest.email}
                      </div>
                      {guest.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {guest.phone}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-slate-500">Total Trips</p>
                        <p className="font-semibold text-white">{guest.totalTrips}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Total Spent</p>
                        <p className="font-semibold text-white">
                          ${(guest.totalSpent / 100).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Favorite Trip</p>
                        <p className="font-semibold text-white">
                          {guest.favoriteTrip || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Last Trip</p>
                        <p className="font-semibold text-white">
                          {guest.lastTripDate
                            ? format(parseISO(guest.lastTripDate), 'MMM d, yyyy')
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expand Toggle */}
                <button className="ml-4 flex-shrink-0 text-slate-400 transition-colors hover:text-white">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-700 p-5">
                  <h4 className="mb-3 text-sm font-semibold text-white">
                    Booking History ({guest.bookings.length})
                  </h4>
                  <div className="space-y-2">
                    {guest.bookings.map((booking: any) => {
                      const tripType = Array.isArray(booking.trip_type)
                        ? booking.trip_type[0]
                        : booking.trip_type;

                      return (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between rounded-lg bg-slate-900/50 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                booking.status === 'completed'
                                  ? 'bg-green-500'
                                  : booking.status === 'confirmed'
                                    ? 'bg-blue-500'
                                    : booking.status === 'cancelled'
                                      ? 'bg-rose-500'
                                      : 'bg-amber-500'
                              }`}
                            />
                            <div>
                              <p className="text-sm font-medium text-white">
                                {tripType?.title || 'Unknown Trip'}
                              </p>
                              <p className="text-xs text-slate-400">
                                {format(parseISO(booking.scheduled_start), 'MMM d, yyyy')} •{' '}
                                {booking.party_size} guests
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">
                              ${((booking.total_price_cents || 0) / 100).toFixed(0)}
                            </p>
                            <p className="text-xs capitalize text-slate-400">
                              {booking.status.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <a
                      href={`mailto:${guest.email}?subject=Thank you for choosing us!&body=Hi ${guest.name},%0D%0A%0D%0AThank you for being a valued customer!`}
                      className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
                    >
                      <Mail className="h-4 w-4" />
                      Send Email
                    </a>
                    <button 
                      onClick={() => alert(`Discount feature coming soon! For now, contact ${guest.name} at ${guest.email} directly.`)}
                      className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
                    >
                      <DollarSign className="h-4 w-4" />
                      Offer Discount
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredGuests.length === 0 && (
        searchQuery || filterType !== 'all' ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-white">No guests found</h3>
            <p className="mt-2 text-sm text-slate-400">
              Try a different search term or filter
            </p>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No guests yet"
            description="Your guest list grows automatically as bookings come in. Share your booking link to get your first guest!"
            actions={[
              { label: 'Share Booking Link', href: '/dashboard/settings?tab=booking-page' },
            ]}
          />
        )
      )}
    </div>
  );
}
