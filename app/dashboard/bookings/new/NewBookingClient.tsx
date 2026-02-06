'use client'

import { useState, useTransition, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  CalendarPlus,
  User,
  Ship,
  Clock,
  DollarSign,
  AlertCircle,
} from 'lucide-react'
import { format, addHours, parse, isValid } from 'date-fns'
import { createBooking } from '@/app/actions/bookings'
import { TripType, Vessel, MAX_PARTY_SIZE } from '@/lib/db/types'

interface NewBookingClientProps {
  captainId: string
  tripTypes: TripType[]
  vessels: Vessel[]
}

export function NewBookingClient({
  captainId,
  tripTypes,
  vessels,
}: NewBookingClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Trip details
  const [tripTypeId, setTripTypeId] = useState('')
  const [vesselId, setVesselId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  // Guest info
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [partySize, setPartySize] = useState(2)

  // Additional details
  const [specialRequests, setSpecialRequests] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  const selectedTripType = useMemo(
    () => tripTypes.find((t) => t.id === tripTypeId) ?? null,
    [tripTypes, tripTypeId]
  )

  // Pre-fill date/time from query params (coming from schedule view)
  useEffect(() => {
    const dateParam = searchParams.get('date')
    const timeParam = searchParams.get('time')
    if (dateParam) setDate(dateParam)
    if (timeParam) setStartTime(timeParam)
  }, [searchParams])

  // Auto-calculate end time when trip type or start time changes
  useEffect(() => {
    if (selectedTripType && startTime && date) {
      try {
        const start = parse(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date())
        if (isValid(start)) {
          const end = addHours(start, selectedTripType.duration_hours)
          setEndTime(format(end, 'HH:mm'))
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [selectedTripType, startTime, date])

  // Auto-select vessel if only one exists
  useEffect(() => {
    if (vessels.length === 1 && !vesselId) {
      setVesselId(vessels[0].id)
    }
  }, [vessels, vesselId])

  function buildScheduledTimestamps(): { start: string; end: string } | null {
    if (!date || !startTime || !endTime) return null
    try {
      const start = parse(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date())
      const end = parse(`${date} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date())
      if (!isValid(start) || !isValid(end)) return null
      return { start: start.toISOString(), end: end.toISOString() }
    } catch {
      return null
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Client-side validation
    if (!guestName.trim()) {
      setError('Guest name is required')
      return
    }
    if (!guestEmail.trim()) {
      setError('Guest email is required')
      return
    }
    if (!date || !startTime || !endTime) {
      setError('Date, start time, and end time are required')
      return
    }

    const timestamps = buildScheduledTimestamps()
    if (!timestamps) {
      setError('Invalid date or time values')
      return
    }

    startTransition(async () => {
      const result = await createBooking({
        captain_id: captainId,
        trip_type_id: tripTypeId || undefined,
        vessel_id: vesselId || undefined,
        scheduled_start: timestamps.start,
        scheduled_end: timestamps.end,
        party_size: partySize,
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        guest_phone: guestPhone.trim() || undefined,
        special_requests: specialRequests.trim() || undefined,
        internal_notes: internalNotes.trim() || undefined,
      })

      if (result.success && result.data) {
        router.push(`/dashboard/bookings/${result.data.id}`)
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to create booking')
      }
    })
  }

  const inputClass =
    'w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500'
  const selectClass =
    'w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500'
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Trip Details Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-200">
          <Ship className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold">Trip Details</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tripType" className={labelClass}>
              Trip Type
            </label>
            <select
              id="tripType"
              value={tripTypeId}
              onChange={(e) => setTripTypeId(e.target.value)}
              className={selectClass}
            >
              <option value="">No trip type</option>
              {tripTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.duration_hours}h &mdash; ${t.price_total})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="vessel" className={labelClass}>
              Vessel
            </label>
            <select
              id="vessel"
              value={vesselId}
              onChange={(e) => setVesselId(e.target.value)}
              className={selectClass}
            >
              <option value="">No vessel</option>
              {vessels.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} (up to {v.capacity})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="date" className={labelClass}>
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="startTime" className={labelClass}>
              Start Time
            </label>
            <input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="endTime" className={labelClass}>
              End Time
            </label>
            <input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>
      </section>

      {/* Guest Information Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-200">
          <User className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold">Guest Information</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="guestName" className={labelClass}>
              Guest Name
            </label>
            <input
              id="guestName"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Full name"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="guestEmail" className={labelClass}>
              Guest Email
            </label>
            <input
              id="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="email@example.com"
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="guestPhone" className={labelClass}>
              Phone Number
              <span className="ml-1 text-xs text-slate-500">(optional)</span>
            </label>
            <input
              id="guestPhone"
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="+1 555-123-4567"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="partySize" className={labelClass}>
              Party Size
            </label>
            <select
              id="partySize"
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              className={selectClass}
            >
              {Array.from({ length: MAX_PARTY_SIZE }, (_, i) => i + 1).map(
                (n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'guest' : 'guests'}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </section>

      {/* Additional Details Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-200">
          <Clock className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold">Additional Details</h2>
        </div>

        <div>
          <label htmlFor="specialRequests" className={labelClass}>
            Special Requests
            <span className="ml-1 text-xs text-slate-500">
              (visible to guest)
            </span>
          </label>
          <textarea
            id="specialRequests"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Any special requests from the guest..."
            rows={3}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="internalNotes" className={labelClass}>
            Internal Notes
            <span className="ml-1 text-xs text-slate-500">
              (captain-only)
            </span>
          </label>
          <textarea
            id="internalNotes"
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Private notes about this booking..."
            rows={3}
            className={inputClass}
          />
        </div>
      </section>

      {/* Pricing Summary */}
      {selectedTripType && (
        <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-2 text-slate-200 mb-3">
            <DollarSign className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold">Pricing Summary</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Trip Total</span>
              <span className="font-medium text-white">
                ${selectedTripType.price_total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Deposit Amount</span>
              <span className="font-medium text-white">
                ${selectedTripType.deposit_amount.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex justify-between text-slate-300">
              <span>Balance Due (Day of Trip)</span>
              <span className="font-medium text-cyan-400">
                $
                {(
                  selectedTripType.price_total -
                  selectedTripType.deposit_amount
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-slate-800 pt-6">
        <button
          type="button"
          onClick={() => router.push('/dashboard/bookings')}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-2 text-sm font-medium text-slate-900 hover:bg-cyan-400 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CalendarPlus className="h-4 w-4" />
          )}
          {isPending ? 'Creating...' : 'Create Booking'}
        </button>
      </div>
    </form>
  )
}
