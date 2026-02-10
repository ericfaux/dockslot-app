'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import {
  Users,
  Mail,
  Phone,
  DollarSign,
  Star,
  Award,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { SendEmailModal } from './SendEmailModal';
import { OfferDiscountModal } from './OfferDiscountModal';

const PAGE_SIZE = 25;

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

interface TripTypeOption {
  id: string;
  title: string;
}

interface GuestStats {
  totalGuests: number;
  repeatGuests: number;
  newGuests: number;
  repeatRate: number;
  avgTripsPerGuest: number;
}

interface Props {
  tripTypes: TripTypeOption[];
  businessName: string;
}

export function GuestsList({ tripTypes, businessName }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<GuestStats>({
    totalGuests: 0,
    repeatGuests: 0,
    newGuests: 0,
    repeatRate: 0,
    avgTripsPerGuest: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGuest, setExpandedGuest] = useState<string | null>(null);

  // Modal state
  const [emailGuest, setEmailGuest] = useState<Guest | null>(null);
  const [discountGuest, setDiscountGuest] = useState<Guest | null>(null);

  // Read state from URL params
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const searchQuery = searchParams.get('search') || '';
  const filterType = (searchParams.get('filter') || 'all') as 'all' | 'repeat' | 'new';

  // Local input state for search (debounced)
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync search input when URL changes (e.g. back/forward navigation)
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const updateURL = useCallback(
    (updates: { page?: number; search?: string; filter?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.page !== undefined) {
        if (updates.page <= 1) {
          params.delete('page');
        } else {
          params.set('page', String(updates.page));
        }
      }
      if (updates.search !== undefined) {
        if (updates.search) {
          params.set('search', updates.search);
        } else {
          params.delete('search');
        }
      }
      if (updates.filter !== undefined) {
        if (updates.filter === 'all') {
          params.delete('filter');
        } else {
          params.set('filter', updates.filter);
        }
      }

      const paramStr = params.toString();
      router.replace(`/dashboard/guests${paramStr ? `?${paramStr}` : ''}`, { scroll: false });
    },
    [searchParams, router]
  );

  const setPage = useCallback(
    (page: number) => {
      updateURL({ page });
    },
    [updateURL]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateURL({ search: value, page: 1 });
      }, 300);
    },
    [updateURL]
  );

  const handleFilterChange = useCallback(
    (filter: 'all' | 'repeat' | 'new') => {
      updateURL({ filter, page: 1 });
    },
    [updateURL]
  );

  // Fetch guests from API
  const fetchGuests = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
      });
      if (searchQuery) params.set('search', searchQuery);
      if (filterType !== 'all') params.set('filter', filterType);

      const response = await fetch(`/api/guests?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setGuests(data.guests || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 0);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching guests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, filterType]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + guests.length, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalGuests}</p>
              <p className="text-sm text-slate-400">Total Guests</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.repeatGuests}</p>
              <p className="text-sm text-slate-400">Repeat Guests</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.repeatRate.toFixed(0)}%</p>
              <p className="text-sm text-slate-400">Repeat Rate</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50">
              <Users className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.avgTripsPerGuest.toFixed(1)}
              </p>
              <p className="text-sm text-slate-400">Avg Trips/Guest</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search guests..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />

        <div className="flex gap-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({stats.totalGuests})
          </button>
          <button
            onClick={() => handleFilterChange('repeat')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'repeat'
                ? 'bg-green-600 text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Repeat ({stats.repeatGuests})
          </button>
          <button
            onClick={() => handleFilterChange('new')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'new'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            New ({stats.newGuests})
          </button>
        </div>
      </div>

      {/* Showing count */}
      <p className="text-sm text-slate-400">
        {isLoading ? (
          'Loading...'
        ) : totalCount === 0 ? (
          '0 guests found'
        ) : (
          <>
            Showing {startIndex + 1}&ndash;{startIndex + guests.length} of {totalCount} guest
            {totalCount !== 1 ? 's' : ''}
          </>
        )}
      </p>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : guests.length === 0 ? (
        searchQuery || filterType !== 'all' ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">No guests found</h3>
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
      ) : (
        <>
          {/* Guests Grid */}
          <div className="space-y-3">
            {guests.map((guest) => {
              const isExpanded = expandedGuest === guest.email;
              const isRepeat = guest.totalTrips > 1;
              const isVIP = guest.totalTrips >= 5;

              return (
                <div
                  key={guest.email}
                  className={`rounded-lg border bg-white transition-colors ${
                    isVIP
                      ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/5 to-transparent'
                      : 'border-slate-200 hover:border-slate-300'
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
                            ? 'bg-amber-50'
                            : isRepeat
                              ? 'bg-green-500/20'
                              : 'bg-blue-50'
                        }`}
                      >
                        {isVIP ? (
                          <Award className="h-6 w-6 text-amber-600" />
                        ) : isRepeat ? (
                          <Star className="h-6 w-6 text-green-400" />
                        ) : (
                          <Users className="h-6 w-6 text-blue-600" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{guest.name}</h3>
                          {isVIP && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
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
                            <p className="font-semibold text-slate-900">{guest.totalTrips}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Total Spent</p>
                            <p className="font-semibold text-slate-900">
                              ${(guest.totalSpent / 100).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Favorite Trip</p>
                            <p className="font-semibold text-slate-900">
                              {guest.favoriteTrip || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Last Trip</p>
                            <p className="font-semibold text-slate-900">
                              {guest.lastTripDate
                                ? format(parseISO(guest.lastTripDate), 'MMM d, yyyy')
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expand Toggle */}
                    <button className="ml-4 flex-shrink-0 text-slate-400 transition-colors hover:text-slate-900">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 p-5">
                      <h4 className="mb-3 text-sm font-semibold text-slate-900">
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
                              className="flex items-center justify-between rounded-lg bg-white p-3"
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
                                  <p className="text-sm font-medium text-slate-900">
                                    {tripType?.title || 'Unknown Trip'}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {format(parseISO(booking.scheduled_start), 'MMM d, yyyy')} •{' '}
                                    {booking.party_size} guests
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-slate-900">
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmailGuest(guest);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
                        >
                          <Mail className="h-4 w-4" />
                          Send Email
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDiscountGuest(guest);
                          }}
                          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-between border-t border-slate-200 pt-4"
              aria-label="Guests pagination"
            >
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {generatePageNumbers(currentPage, totalPages).map((pageNum, i) =>
                  pageNum === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-slate-400">
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum as number)}
                      className={`min-w-[2.25rem] rounded-md px-3 py-2 text-sm font-medium ${
                        pageNum === currentPage
                          ? 'bg-cyan-500 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </>
      )}

      {/* Send Email Modal */}
      {emailGuest && (
        <SendEmailModal
          guest={emailGuest}
          businessName={businessName}
          onClose={() => setEmailGuest(null)}
        />
      )}

      {/* Offer Discount Modal */}
      {discountGuest && (
        <OfferDiscountModal
          guest={discountGuest}
          tripTypes={tripTypes}
          onClose={() => setDiscountGuest(null)}
        />
      )}
    </div>
  );
}

/**
 * Generate an array of page numbers with ellipsis for pagination display.
 */
function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  pages.push(1);

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);

  return pages;
}
