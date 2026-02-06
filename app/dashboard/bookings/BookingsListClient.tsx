'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { List } from 'lucide-react'
import BookingFilters, { BookingFilterState } from '../schedule/BookingFilters'
import { BookingWithDetails } from '@/lib/db/types'
import { ExportButton } from './ExportButton'
import FilterPresetsMenu from '../components/FilterPresetsMenu'
import BulkActionsBar from '../components/BulkActionsBar'
import { SwipeableBookingRow } from './SwipeableBookingRow'
import { BookingDetailDrawer } from './BookingDetailDrawer'
import { EmptyState } from '@/components/EmptyState'

interface BookingsListClientProps {
  captainId: string
}

export function BookingsListClient({ captainId }: BookingsListClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set())
  const [drawerBooking, setDrawerBooking] = useState<BookingWithDetails | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [filters, setFilters] = useState<BookingFilterState>({
    search: '',
    tags: [],
    statuses: [],
    paymentStatus: [],
    dateRange: { start: null, end: null },
  })

  const handleSelectAll = () => {
    if (selectedBookings.size === bookings.length) {
      setSelectedBookings(new Set())
    } else {
      setSelectedBookings(new Set(bookings.map((b) => b.id)))
    }
  }

  const handleSelectBooking = (id: string) => {
    const newSelected = new Set(selectedBookings)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedBookings(newSelected)
  }

  const handleClearSelection = () => {
    setSelectedBookings(new Set())
  }

  const handleViewDetail = useCallback((booking: BookingWithDetails) => {
    setDrawerBooking(booking)
    setIsDrawerOpen(true)
    const params = new URLSearchParams(searchParams.toString())
    params.set('detail', booking.id)
    router.replace(`/dashboard/bookings?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    setDrawerBooking(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('detail')
    const paramStr = params.toString()
    router.replace(`/dashboard/bookings${paramStr ? `?${paramStr}` : ''}`, { scroll: false })
  }, [searchParams, router])

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

  // Auto-open drawer if ?detail={id} is in URL
  useEffect(() => {
    const detailId = searchParams.get('detail')
    if (detailId && bookings.length > 0 && !isDrawerOpen) {
      const booking = bookings.find((b) => b.id === detailId)
      if (booking) {
        setDrawerBooking(booking)
        setIsDrawerOpen(true)
      }
    }
  }, [searchParams, bookings, isDrawerOpen])

  // Handle weather hold action (defined after fetchBookings)
  const handleWeatherHold = useCallback(async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/weather-hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Quick weather hold' }),
      })
      if (response.ok) {
        // Refresh the bookings list
        fetchBookings()
      }
    } catch (error) {
      console.error('Error setting weather hold:', error)
    }
  }, [fetchBookings])

  return (
    <div className={`space-y-6 ${selectedBookings.size > 0 ? 'pb-24' : ''}`}>
      {/* Filters & Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-end">
          <FilterPresetsMenu
            currentFilters={filters}
            onApplyPreset={setFilters}
          />
        </div>
        <BookingFilters
          onFilterChange={setFilters}
          availableTags={availableTags}
        />
      </div>

      {/* Results Count & Export */}
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
        <ExportButton
          captainId={captainId}
          filters={filters}
          totalCount={bookings.length}
        />
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : bookings.length === 0 ? (
        filters.search || filters.tags.length > 0 || filters.statuses.length > 0 || filters.paymentStatus.length > 0 || filters.dateRange.start ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center">
            <p className="text-slate-400">No bookings found</p>
            <p className="mt-2 text-sm text-slate-500">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <EmptyState
            icon={List}
            title="No bookings yet"
            description="Your first booking is a big deal — let's make it happen! Share your booking link with potential guests or create a booking manually."
            actions={[
              { label: 'Share Booking Link', href: '/dashboard/settings?tab=booking-page' },
              { label: 'Create Booking', href: '/dashboard/schedule', variant: 'secondary' },
            ]}
          />
        )
      ) : (
        <div className="space-y-3">
          {/* Select All */}
          {bookings.length > 0 && (
            <div className="flex items-center gap-3 rounded border border-slate-200 bg-slate-50 px-4 py-2">
              <input
                type="checkbox"
                checked={selectedBookings.size === bookings.length && bookings.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-slate-300 bg-slate-100 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0"
              />
              <span className="text-sm text-slate-400">
                Select all ({bookings.length})
              </span>
            </div>
          )}

          {bookings.map((booking) => (
            <SwipeableBookingRow
              key={booking.id}
              booking={booking}
              isSelected={selectedBookings.has(booking.id)}
              onSelect={handleSelectBooking}
              onWeatherHold={handleWeatherHold}
              onViewDetail={handleViewDetail}
            />
          ))}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedBookings.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedBookings.size}
          onCancel={() => {}}
          onClearSelection={handleClearSelection}
          availableTags={availableTags}
        />
      )}

      {/* Booking Detail Drawer */}
      <BookingDetailDrawer
        booking={drawerBooking}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onRefresh={() => {
          fetchBookings()
          // Re-fetch the specific booking for the drawer
          if (drawerBooking) {
            const updated = bookings.find((b) => b.id === drawerBooking.id)
            if (updated) setDrawerBooking(updated)
          }
        }}
      />
    </div>
  )
}
