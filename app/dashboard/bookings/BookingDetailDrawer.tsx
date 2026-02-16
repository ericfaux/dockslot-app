'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { useRouter } from 'next/navigation'
import {
  X,
  Calendar,
  Clock,
  Users,
  Ship,
  Mail,
  Phone,
  CreditCard,
  DollarSign,
  CheckCircle,
  XCircle,
  CloudRain,
  RefreshCw,
  MessageSquare,
  Tag as TagIcon,
  ExternalLink,
  AlertTriangle,
  Smartphone,
  Building2,
  Send,
  Ban,
} from 'lucide-react'
import { BookingWithDetails, BookingStatus } from '@/lib/db/types'
import StatusBadge, { PaymentBadge } from '@/app/dashboard/components/StatusBadge'
import { formatCents } from '@/lib/utils/format'
import { useSubscription } from '@/lib/subscription/context'
import { canUseFeature } from '@/lib/subscription/gates'
import { GatedButton } from '@/components/GatedButton'
import { LockedFeatureOverlay } from '@/components/LockedFeatureOverlay'

interface BookingDetailDrawerProps {
  booking: BookingWithDetails | null
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
}

export function BookingDetailDrawer({
  booking,
  isOpen,
  onClose,
  onRefresh,
}: BookingDetailDrawerProps) {
  const router = useRouter()
  const { tier } = useSubscription()
  const hasBookingModifications = canUseFeature(tier, 'booking_modifications')
  const hasCaptainsLogbook = canUseFeature(tier, 'captains_logbook')
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const canModify = booking
    ? ['pending_deposit', 'confirmed', 'weather_hold', 'rescheduled'].includes(booking.status)
    : false

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleStatusChange = useCallback(async (newStatus: BookingStatus, confirmMsg: string) => {
    if (!booking || !confirm(confirmMsg)) return

    setIsProcessing(true)
    setActionError(null)

    try {
      if (newStatus === 'weather_hold') {
        const response = await fetch(`/api/bookings/${booking.id}/weather-hold`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Weather conditions unsafe for departure' }),
        })
        if (!response.ok) throw new Error('Failed to set weather hold')
      } else {
        const response = await fetch(`/api/bookings/${booking.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        if (!response.ok) throw new Error(`Failed to update booking status`)
      }
      onRefresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setIsProcessing(false)
    }
  }, [booking, onRefresh])

  const handleSendReminder = useCallback(async () => {
    if (!booking) return

    setIsProcessing(true)
    setActionError(null)

    try {
      const response = await fetch(`/api/bookings/${booking.id}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reminder',
          subject: `Reminder: Your upcoming trip`,
          message: `This is a reminder about your upcoming trip on ${format(parseISO(booking.scheduled_start), 'EEEE, MMMM d, yyyy')} at ${format(parseISO(booking.scheduled_start), 'h:mm a')}.`,
        }),
      })
      if (!response.ok) throw new Error('Failed to send reminder')
      setActionError(null)
      alert('Reminder sent successfully')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to send reminder')
    } finally {
      setIsProcessing(false)
    }
  }, [booking])

  const handleRecordPayment = useCallback(() => {
    if (!booking) return
    router.push(`/dashboard/bookings/${booking.id}?tab=payments`)
    onClose()
  }, [booking, router, onClose])

  const [showRejectModal, setShowRejectModal] = useState(false)

  const handleVerifyPayment = useCallback(async (action: 'confirm' | 'remind' | 'cancel') => {
    if (!booking) return

    if (action === 'confirm' && !confirm('Confirm that you received this payment?')) return
    if (action === 'cancel' && !confirm('Cancel this booking due to non-payment? This cannot be undone.')) return

    setIsProcessing(true)
    setActionError(null)

    try {
      const response = await fetch('/api/bookings/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, action }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Action failed')
      }

      if (action === 'remind') {
        alert('Payment reminder sent to guest')
      }

      setShowRejectModal(false)
      onRefresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setIsProcessing(false)
    }
  }, [booking, onRefresh])

  if (!isOpen || !booking) return null

  const scheduledDate = parseISO(booking.scheduled_start)
  const scheduledEndDate = parseISO(booking.scheduled_end)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl transition-transform sm:max-w-md md:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-mono text-lg font-semibold text-slate-800">
              {booking.guest_name}
            </h2>
            <p className="text-sm text-slate-400">
              Booking #{booking.id.slice(0, 8)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            {/* Error */}
            {actionError && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/50 bg-rose-50 p-3 text-sm text-rose-600">
                <XCircle className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{actionError}</span>
                <button
                  onClick={() => setActionError(null)}
                  className="hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Status & Payment Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={booking.status} size="md" />
              <PaymentBadge status={booking.payment_status} size="md" />
            </div>

            {/* Payment Verification Banner */}
            {booking.payment_status === 'pending_verification' && (
              <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Payment Verification Needed</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Guest indicated they sent a{' '}
                      <span className="font-semibold">
                        {(booking as any).payment_method === 'venmo' ? 'Venmo' : (booking as any).payment_method === 'zelle' ? 'Zelle' : 'manual'}{' '}
                      </span>
                      payment of <span className="font-semibold">{formatCents(booking.total_price_cents)}</span>
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Reference: DK-{booking.id.slice(0, 4).toUpperCase()} &middot; Booked {format(parseISO(booking.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleVerifyPayment('confirm')}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Confirm Payment Received
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Payment Not Received
                  </button>
                </div>

                {/* Reject Modal */}
                {showRejectModal && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                    <p className="text-sm font-medium text-slate-700">What would you like to do?</p>
                    <button
                      onClick={() => handleVerifyPayment('remind')}
                      disabled={isProcessing}
                      className="w-full flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4 text-amber-600" />
                      Send Payment Reminder
                    </button>
                    <button
                      onClick={() => handleVerifyPayment('cancel')}
                      disabled={isProcessing}
                      className="w-full flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Ban className="h-4 w-4" />
                      Cancel Booking
                    </button>
                    <button
                      onClick={() => setShowRejectModal(false)}
                      className="w-full text-center text-sm text-slate-500 hover:text-slate-700 py-1"
                    >
                      Never mind
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Trip Info */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
                Trip Details
              </h3>
              <div className="space-y-3">
                {/* Trip Type */}
                {booking.trip_type && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-cyan-600" />
                    <span className="font-medium text-slate-700">{booking.trip_type.title}</span>
                  </div>
                )}

                {/* Date & Time */}
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-cyan-600" />
                  <div>
                    <div className="font-medium text-slate-700">
                      {format(scheduledDate, 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="text-slate-500">
                      {format(scheduledDate, 'h:mm a')} - {format(scheduledEndDate, 'h:mm a')}
                    </div>
                  </div>
                </div>

                {/* Party Size */}
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-cyan-600" />
                  <span className="text-slate-700">
                    {booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}
                  </span>
                </div>

                {/* Vessel */}
                {booking.vessel && (
                  <div className="flex items-center gap-3 text-sm">
                    <Ship className="h-4 w-4 text-cyan-600" />
                    <span className="text-slate-700">{booking.vessel.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
                Contact Info
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <a
                      href={`mailto:${booking.guest_email}`}
                      className="text-slate-700 hover:text-cyan-600 hover:underline"
                    >
                      {booking.guest_email}
                    </a>
                  </div>
                </div>
                {booking.guest_phone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <a
                        href={`tel:${booking.guest_phone}`}
                        className="text-slate-700 hover:text-cyan-600 hover:underline"
                      >
                        {booking.guest_phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
                Payment
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total Price</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {formatCents(booking.total_price_cents)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Deposit Paid</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {formatCents(booking.deposit_paid_cents)}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Balance Due</span>
                    <span className={`font-mono font-semibold ${
                      booking.balance_due_cents > 0
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}>
                      {formatCents(booking.balance_due_cents)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags & Notes (Captain's Logbook) */}
            {hasCaptainsLogbook ? (
              <>
                {booking.tags && booking.tags.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
                      Tags
                    </h3>
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
                  </div>
                )}

                {(booking.internal_notes || booking.special_requests) && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
                      Notes
                    </h3>
                    <div className="space-y-3">
                      {booking.special_requests && (
                        <div>
                          <div className="mb-1 text-xs font-medium text-slate-400">Special Requests</div>
                          <p className="whitespace-pre-wrap text-sm text-slate-600">
                            {booking.special_requests}
                          </p>
                        </div>
                      )}
                      {booking.internal_notes && (
                        <div>
                          <div className="mb-1 text-xs font-medium text-slate-400">Internal Notes</div>
                          <p className="whitespace-pre-wrap text-sm text-slate-600">
                            {booking.internal_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <LockedFeatureOverlay feature="captains_logbook">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
                    Captain&apos;s Logbook
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 text-xs font-medium text-slate-400">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-600">VIP</span>
                        <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-600">Repeat</span>
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium text-slate-400">Internal Notes</div>
                      <p className="whitespace-pre-wrap text-sm text-slate-600">
                        Captain&apos;s notes and tags for this booking...
                      </p>
                    </div>
                  </div>
                </div>
              </LockedFeatureOverlay>
            )}

            {/* View Full Details Link */}
            <a
              href={`/dashboard/bookings/${booking.id}`}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-cyan-600 transition-colors hover:bg-cyan-50"
            >
              <ExternalLink className="h-4 w-4" />
              View Full Details
            </a>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-2 gap-2">
            {/* Confirm - only for pending_deposit */}
            {booking.status === 'pending_deposit' && (
              <button
                onClick={() => handleStatusChange('confirmed', 'Confirm this booking?')}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Confirm
              </button>
            )}

            {/* Mark as Completed - for confirmed/rescheduled */}
            {['confirmed', 'rescheduled'].includes(booking.status) && (
              <button
                onClick={() => handleStatusChange('completed', 'Mark this trip as completed?')}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Complete
              </button>
            )}

            {/* Cancel */}
            {canModify && (
              <button
                onClick={() => handleStatusChange('cancelled', 'Cancel this booking? This action cannot be undone.')}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </button>
            )}

            {/* Reschedule - navigates to schedule (gated as booking modification) */}
            {canModify && (
              <GatedButton feature="booking_modifications">
                <button
                  onClick={() => {
                    router.push(`/dashboard/schedule?booking=${booking.id}`)
                    onClose()
                  }}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reschedule
                </button>
              </GatedButton>
            )}

            {/* Send Reminder */}
            {['confirmed', 'rescheduled', 'pending_deposit'].includes(booking.status) && (
              <button
                onClick={handleSendReminder}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
              >
                <MessageSquare className="h-4 w-4" />
                Send Reminder
              </button>
            )}

            {/* Record Payment */}
            {booking.balance_due_cents > 0 && (
              <button
                onClick={handleRecordPayment}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
              >
                <DollarSign className="h-4 w-4" />
                Record Payment
              </button>
            )}

            {/* Weather Hold (gated as booking modification) */}
            {['confirmed', 'rescheduled'].includes(booking.status) && booking.status !== 'weather_hold' && (
              <GatedButton feature="booking_modifications">
                <button
                  onClick={() => handleStatusChange('weather_hold', 'Set this booking to weather hold? The guest will be notified.')}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-50"
                >
                  <CloudRain className="h-4 w-4" />
                  Weather Hold
                </button>
              </GatedButton>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
