'use client';

import { useState, useMemo } from 'react';
import { Search, Calendar, ClipboardList } from 'lucide-react';
import { BookingWithPassengers } from '@/lib/db/types';
import { BookingCard } from './components/BookingCard';
import {
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
} from 'date-fns';

interface ManifestClientProps {
  initialBookings: BookingWithPassengers[];
}

type DateFilter = 'today' | 'this_week' | 'this_month' | 'all';

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'all', label: 'All Upcoming' },
];

export function ManifestClient({ initialBookings }: ManifestClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filteredBookings = useMemo(() => {
    let bookings = initialBookings;

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let start: Date;
      let end: Date;

      switch (dateFilter) {
        case 'today':
          start = startOfToday();
          end = endOfToday();
          break;
        case 'this_week':
          start = startOfWeek(now, { weekStartsOn: 0 });
          end = endOfWeek(now, { weekStartsOn: 0 });
          break;
        case 'this_month':
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
        default:
          start = startOfToday();
          end = new Date(9999, 11, 31);
      }

      bookings = bookings.filter((booking) => {
        const scheduledStart = parseISO(booking.scheduled_start);
        return isWithinInterval(scheduledStart, { start, end });
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      bookings = bookings.filter((booking) => {
        const guestName = booking.guest_name.toLowerCase();
        const guestEmail = booking.guest_email.toLowerCase();
        return guestName.includes(query) || guestEmail.includes(query);
      });
    }

    return bookings;
  }, [initialBookings, dateFilter, searchQuery]);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            {DATE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setDateFilter(filter.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  dateFilter === filter.value
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <ClipboardList className="h-4 w-4" />
        <span>
          {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Bookings Grid */}
      {filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-16">
          <div className="mb-4 rounded-full bg-white p-4">
            <ClipboardList className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-slate-600">No bookings found</h3>
          <p className="mb-4 max-w-sm text-center text-sm text-slate-500">
            {searchQuery || dateFilter !== 'all'
              ? 'Try adjusting your filters to see more bookings.'
              : 'You have no upcoming bookings at this time.'}
          </p>
          {(searchQuery || dateFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDateFilter('all');
              }}
              className="text-sm font-medium text-cyan-600 hover:text-cyan-600"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </>
  );
}
