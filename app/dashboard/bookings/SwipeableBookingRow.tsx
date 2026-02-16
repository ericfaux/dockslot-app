'use client'

import { useState, useRef, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Calendar,
  Users,
  Ship,
  CreditCard,
  Clock,
  Tag as TagIcon,
  ChevronRight,
  Eye,
  CloudRain,
} from 'lucide-react'
import { BookingWithDetails, BookingStatus } from '@/lib/db/types'
import { STATUS_COLORS, STATUS_LABELS } from '@/components/calendar/types'
import { formatCents } from '@/lib/utils/format'

// Light-background text colors (calendar STATUS_COLORS.text is for dark backgrounds)
const STATUS_TEXT_ON_LIGHT: Record<BookingStatus, string> = {
  pending_deposit: 'text-amber-600',
  confirmed: 'text-emerald-600',
  weather_hold: 'text-blue-600',
  rescheduled: 'text-purple-600',
  completed: 'text-slate-600',
  cancelled: 'text-rose-600',
  no_show: 'text-rose-600',
  expired: 'text-slate-600',
}

interface SwipeableBookingRowProps {
  booking: BookingWithDetails
  isSelected: boolean
  onSelect?: (id: string) => void
  onWeatherHold: (id: string) => void
  onViewDetail: (booking: BookingWithDetails) => void
}

export function SwipeableBookingRow({
  booking,
  isSelected,
  onSelect,
  onWeatherHold,
  onViewDetail,
}: SwipeableBookingRowProps) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const touchStartX = useRef(0)
  const isDragging = useRef(false)

  const SWIPE_THRESHOLD = 80

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    isDragging.current = false
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - touchStartX.current
    // Only allow swipe if it's significant and horizontal
    if (Math.abs(diff) > 10) {
      isDragging.current = true
      // Limit swipe range
      const clampedDiff = Math.max(-SWIPE_THRESHOLD - 20, Math.min(SWIPE_THRESHOLD + 20, diff))
      setSwipeOffset(clampedDiff)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (swipeOffset > SWIPE_THRESHOLD) {
      // Swiped right - View detail
      onViewDetail(booking)
    } else if (swipeOffset < -SWIPE_THRESHOLD) {
      // Swiped left - Weather hold action
      onWeatherHold(booking.id)
    }
    // Reset position with animation
    setSwipeOffset(0)
    isDragging.current = false
  }, [swipeOffset, booking, onWeatherHold, onViewDetail])

  const formatTime = (isoString: string): string => {
    try {
      return format(parseISO(isoString), 'MMM d, yyyy \u2022 h:mm a')
    } catch {
      return ''
    }
  }

  const colors = STATUS_COLORS[booking.status]
  const statusLabel = STATUS_LABELS[booking.status]
  const canWeatherHold = ['confirmed', 'rescheduled'].includes(booking.status)

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Swipe backgrounds (mobile only) */}
      <div className="absolute inset-y-0 left-0 flex w-24 items-center justify-center bg-cyan-600 md:hidden">
        <Eye className="h-6 w-6 text-slate-900" />
      </div>
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-amber-600 md:hidden">
        <CloudRain className="h-6 w-6 text-slate-900" />
      </div>

      {/* Main row content */}
      <div
        className={`relative flex items-start gap-3 border p-4 transition-all bg-white ${
          isSelected
            ? 'border-cyan-500 bg-cyan-50'
            : 'border-slate-200 bg-white'
        }`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Checkbox - only shown when bulk select is available */}
        {onSelect && (
          <input
            type="checkbox"
            name="booking-select"
            value={booking.id}
            checked={isSelected}
            onChange={() => onSelect(booking.id)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 h-4 w-4 rounded border-slate-300 bg-slate-100 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0"
          />
        )}

        <div
          role="button"
          tabIndex={0}
          className="flex flex-1 cursor-pointer items-start justify-between gap-4"
          onClick={() => {
            if (!isDragging.current) {
              onViewDetail(booking)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onViewDetail(booking)
            }
          }}
        >
          {/* Left: Booking Info */}
          <div className="flex-1 space-y-3">
            {/* Guest Name & Status */}
            <div className="flex items-center gap-3">
              <h3 className="font-mono text-lg font-semibold text-slate-800">
                {booking.guest_name}
              </h3>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
                <span className={`text-sm ${STATUS_TEXT_ON_LIGHT[booking.status]}`}>{statusLabel}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
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
                      ? 'text-emerald-600'
                      : booking.payment_status === 'deposit_paid'
                      ? 'text-amber-600'
                      : booking.payment_status === 'pending_verification'
                      ? 'text-yellow-600'
                      : 'text-slate-500'
                  }`}
                />
                <span>
                  {booking.payment_status === 'fully_paid'
                    ? 'Fully Paid'
                    : booking.payment_status === 'deposit_paid'
                    ? `Deposit: ${formatCents(booking.deposit_paid_cents)}`
                    : booking.payment_status === 'pending_verification'
                    ? 'Pending Verification'
                    : 'Unpaid'}
                </span>
              </div>

              {/* Total */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Total:</span>
                <span className="font-medium">
                  {formatCents(booking.total_price_cents)}
                </span>
              </div>
            </div>

            {/* Tags */}
            {booking.tags && booking.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {booking.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-600"
                  >
                    <TagIcon className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Captain Notes Preview */}
            {booking.internal_notes && (
              <div className="rounded bg-white p-2 text-sm text-slate-400">
                <span className="font-medium text-slate-600">Note: </span>
                {booking.internal_notes.length > 100
                  ? `${booking.internal_notes.slice(0, 100)}...`
                  : booking.internal_notes}
              </div>
            )}
          </div>

          {/* Right: Actions (desktop only) */}
          <div className="flex items-center gap-2">
            {/* Hover action buttons - desktop only */}
            <div
              className={`hidden gap-2 transition-all duration-150 md:flex ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetail(booking)
                }}
                className="rounded-lg bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-600 transition-colors hover:bg-cyan-500/30"
              >
                View
              </button>
              {canWeatherHold && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onWeatherHold(booking.id)
                  }}
                  className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/30"
                >
                  Weather Hold
                </button>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Mobile swipe hints - shown on first few rows */}
      <div className="pointer-events-none absolute inset-0 hidden">
        <div className="absolute inset-y-0 left-2 flex items-center">
          <span className="text-xs text-cyan-600">← View</span>
        </div>
        <div className="absolute inset-y-0 right-2 flex items-center">
          <span className="text-xs text-amber-600">Hold →</span>
        </div>
      </div>
    </div>
  )
}
