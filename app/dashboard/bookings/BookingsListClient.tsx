'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Calendar,
  Users,
  Ship,
  CreditCard,
  Clock,
  Tag as TagIcon,
  ChevronRight,
} from 'lucide-react'
import BookingFilters, { BookingFilterState } from '../schedule/BookingFilters'
import { BookingWithDetails } from '@/lib/db/types'
import { STATUS_COLORS, STATUS_LABELS } from '@/components/calendar/types'
import Link from 'next/link'

interface BookingsListClientProps {
  captainId: string
}

export function BookingsListClient({ captainId }: BookingsListClientProps) {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<BookingFilterState>({
    search: '',
    tags: [],
    statuses: [],
    paymentStatus: [],
    dateRange: { start: null, end: null },
  })

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/bookings/tags')
        if (response.ok) {
          const data = await response.json()
          setAvailableTags(data.tags || [])
        }
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    }
    fetchTags()
  }, [])

  // Fetch bookings with filters
  const fetchBookings = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        captainId: captainId,
        limit: '100',
      })

      if (filters.search) params.append('search', filters.search)
      if (filters.tags.length > 0)
        params.append('tags', filters.tags.join(','))
      if (filters.statuses.length > 0)
        params.append('status', filters.statuses.join(','))
      if (filters.paymentStatus.length > 0)
        params.append('paymentStatus', filters.paymentStatus.join(','))
      if (filters.dateRange.start)
        params.append('startDate', filters.dateRange.start)
      if (filters.dateRange.end)
        params.append('endDate', filters.dateRange.end)

      const response = await fetch(`/api/bookings?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [captainId, filters])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const formatTime = (isoString: string): string => {
    try {
      return format(parseISO(isoString), 'MMM d, yyyy • h:mm a')
    } catch {
      return ''
    }
  }

  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <BookingFilters
        onFilterChange={setFilters}
        availableTags={availableTags}
      />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {isLoading ? (
            'Loading...'
          ) : (
            <>
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''}{' '}
              found
            </>
          )}
        </p>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-12 text-center">
          <p className="text-slate-400">No bookings found</p>
          <p className="mt-2 text-sm text-slate-500">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const colors = STATUS_COLORS[booking.status]
            const statusLabel = STATUS_LABELS[booking.status]

            return (
              <Link
                key={booking.id}
                href={`/dashboard/schedule?booking=${booking.id}`}
                className="block rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition-all hover:border-cyan-500/50 hover:bg-slate-800/70"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Booking Info */}
                  <div className="flex-1 space-y-3">
                    {/* Guest Name & Status */}
                    <div className="flex items-center gap-3">
                      <h3 className="font-mono text-lg font-semibold text-slate-100">
                        {booking.guest_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
                        <span className={`text-sm ${colors.text}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Date/Time */}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span>{formatTime(booking.scheduled_start)}</span>
                      </div>

                      {/* Party Size */}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-500" />
                        <span>{booking.party_size} guests</span>
                      </div>

                      {/* Vessel */}
                      {booking.vessel && (
                        <div className="flex items-center gap-2">
                          <Ship className="h-4 w-4 text-slate-500" />
                          <span>{booking.vessel.name}</span>
                        </div>
                      )}

                      {/* Trip Type */}
                      {booking.trip_type && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span>{booking.trip_type.title}</span>
                        </div>
                      )}

                      {/* Payment */}
                      <div className="flex items-center gap-2">
                        <CreditCard
                          className={`h-4 w-4 ${
                            booking.payment_status === 'fully_paid'
                              ? 'text-emerald-400'
                              : booking.payment_status === 'deposit_paid'
                              ? 'text-amber-400'
                              : 'text-slate-500'
                          }`}
                        />
                        <span>
                          {booking.payment_status === 'fully_paid'
                            ? 'Fully Paid'
                            : booking.payment_status === 'deposit_paid'
                            ? `Deposit: ${formatPrice(booking.deposit_paid_cents)}`
                            : 'Unpaid'}
                        </span>
                      </div>

                      {/* Total */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Total:</span>
                        <span className="font-medium">
                          {formatPrice(booking.total_price_cents)}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    {booking.tags && booking.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {booking.tags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-medium text-cyan-300"
                          >
                            <TagIcon className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Captain Notes Preview */}
                    {booking.captain_notes && (
                      <div className="rounded bg-slate-900/50 p-2 text-sm text-slate-400">
                        <span className="font-medium text-slate-300">
                          Note:{' '}
                        </span>
                        {booking.captain_notes.length > 100
                          ? `${booking.captain_notes.slice(0, 100)}...`
                          : booking.captain_notes}
                      </div>
                    )}
                  </div>

                  {/* Right: Chevron */}
                  <div className="flex items-center">
                    <ChevronRight className="h-5 w-5 text-slate-500" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
