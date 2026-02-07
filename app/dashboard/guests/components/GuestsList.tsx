'use client';

import { useState, useTransition } from 'react';
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
  X,
  Check,
  Copy,
  Loader2,
  Percent,
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { createPromoCode } from '@/app/actions/promo-codes';

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

  // Discount modal state
  const [discountGuest, setDiscountGuest] = useState<Guest | null>(null);
  const [discountValue, setDiscountValue] = useState('10');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [isPending, startTransition] = useTransition();
  const [discountResult, setDiscountResult] = useState<{ code: string } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

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
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />

        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({guests.length})
          </button>
          <button
            onClick={() => setFilterType('repeat')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'repeat'
                ? 'bg-green-600 text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Repeat ({guests.filter((g) => g.totalTrips > 1).length})
          </button>
          <button
            onClick={() => setFilterType('new')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'new'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    <a
                      href={`mailto:${guest.email}?subject=Thank you for choosing us!&body=Hi ${guest.name},%0D%0A%0D%0AThank you for being a valued customer!`}
                      className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
                    >
                      <Mail className="h-4 w-4" />
                      Send Email
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDiscountGuest(guest);
                        setDiscountValue('10');
                        setDiscountType('percentage');
                        setDiscountResult(null);
                        setDiscountError(null);
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

      {/* Offer Discount Modal */}
      {discountGuest && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setDiscountGuest(null)}
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="pointer-events-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Offer Discount
                </h3>
                <button
                  onClick={() => setDiscountGuest(null)}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {discountResult ? (
                /* Success state */
                <div className="space-y-4">
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
                    <Check className="mx-auto h-8 w-8 text-emerald-600" />
                    <p className="mt-2 text-sm font-medium text-emerald-800">
                      Promo code created
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <code className="rounded bg-white px-3 py-1.5 text-lg font-bold text-slate-900 border border-emerald-200">
                        {discountResult.code}
                      </code>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(discountResult.code);
                            setCodeCopied(true);
                            setTimeout(() => setCodeCopied(false), 2000);
                          } catch { /* silent */ }
                        }}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        {codeCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 text-center">
                    Share this code with {discountGuest.name} via email
                  </p>
                  <div className="flex gap-2">
                    <a
                      href={`mailto:${discountGuest.email}?subject=A special discount just for you!&body=Hi ${discountGuest.name},%0D%0A%0D%0AAs a valued guest, here's a special discount code for your next booking:%0D%0A%0D%0ACode: ${discountResult.code}%0D%0A%0D%0AUse it when booking your next trip!`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
                    >
                      <Mail className="h-4 w-4" />
                      Email Code
                    </a>
                    <button
                      onClick={() => setDiscountGuest(null)}
                      className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Form state */
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Create a promo code for <span className="font-medium text-slate-700">{discountGuest.name}</span>
                  </p>

                  {discountError && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
                      {discountError}
                    </div>
                  )}

                  {/* Discount type toggle */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Discount type
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDiscountType('percentage')}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          discountType === 'percentage'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Percent className="mr-1.5 inline h-3.5 w-3.5" />
                        Percentage
                      </button>
                      <button
                        onClick={() => setDiscountType('fixed')}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          discountType === 'fixed'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <DollarSign className="mr-1.5 inline h-3.5 w-3.5" />
                        Fixed Amount
                      </button>
                    </div>
                  </div>

                  {/* Discount value */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {discountType === 'percentage' ? 'Percentage off' : 'Amount off ($)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={discountType === 'percentage' ? 100 : 99999}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        placeholder={discountType === 'percentage' ? '10' : '25'}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        {discountType === 'percentage' ? '%' : 'USD'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        const value = parseInt(discountValue, 10);
                        if (!value || value < 1) {
                          setDiscountError('Please enter a valid discount value');
                          return;
                        }
                        if (discountType === 'percentage' && value > 100) {
                          setDiscountError('Percentage cannot exceed 100%');
                          return;
                        }
                        setDiscountError(null);

                        // Generate a unique code for this guest
                        const guestCode = discountGuest.name
                          .split(' ')[0]
                          .toUpperCase()
                          .replace(/[^A-Z]/g, '')
                          .slice(0, 6);
                        const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                        const code = `${guestCode}-${suffix}`;

                        startTransition(async () => {
                          const discountVal = discountType === 'fixed' ? value * 100 : value;
                          const result = await createPromoCode({
                            code,
                            discount_type: discountType,
                            discount_value: discountVal,
                            max_uses: 1,
                          });
                          if (result.success) {
                            setDiscountResult({ code });
                          } else {
                            setDiscountError(result.error || 'Failed to create promo code');
                          }
                        });
                      }}
                      disabled={isPending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <DollarSign className="h-4 w-4" />
                      )}
                      {isPending ? 'Creating...' : 'Create Code'}
                    </button>
                    <button
                      onClick={() => setDiscountGuest(null)}
                      disabled={isPending}
                      className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {filteredGuests.length === 0 && (
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
      )}
    </div>
  );
}
