'use client'

import { useState } from 'react'
import { format, setHours, setMinutes } from 'date-fns'
import { X, CalendarPlus, Clock, Calendar, User, Phone, Users, Anchor } from 'lucide-react'

type BookingSource = 'walk_up' | 'phone' | 'other'

interface QuickBookingModalProps {
  isOpen: boolean
  slot: { date: Date; hour: number } | null
  onClose: () => void
  onCreateBooking: () => void
  onQuickCreate?: (data: {
    guestName: string
    guestPhone: string
    partySize: number
    source: BookingSource
    date: Date
    hour: number
  }) => void
}

export function QuickBookingModal({
  isOpen,
  slot,
  onClose,
  onCreateBooking,
  onQuickCreate,
}: QuickBookingModalProps) {
  const [mode, setMode] = useState<'choose' | 'quick'>('choose')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [partySize, setPartySize] = useState(2)
  const [source, setSource] = useState<BookingSource>('walk_up')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !slot) return null

  const startTime = setMinutes(setHours(slot.date, slot.hour), 0)
  const formattedDate = format(slot.date, 'EEEE, MMMM d, yyyy')
  const formattedTime = format(startTime, 'h:mm a')

  const handleClose = () => {
    setMode('choose')
    setGuestName('')
    setGuestPhone('')
    setPartySize(2)
    setSource('walk_up')
    setIsSubmitting(false)
    onClose()
  }

  const handleQuickCreate = async () => {
    if (!guestName.trim() || !onQuickCreate) return
    setIsSubmitting(true)
    try {
      await onQuickCreate({
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        partySize,
        source,
        date: slot.date,
        hour: slot.hour,
      })
      handleClose()
    } catch {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="pointer-events-auto w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50">
                <CalendarPlus className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {mode === 'choose' ? 'Book This Slot' : 'Quick Booking'}
                </h2>
                <p className="text-sm text-slate-400">
                  {mode === 'choose' ? 'Walk-up, phone, or full form' : 'For walk-ups & phone bookings'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Slot Info */}
          <div className="px-4 pt-4">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-3 mb-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">
                  {formattedDate}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  Starting at {formattedTime}
                </span>
              </div>
            </div>
          </div>

          {mode === 'choose' ? (
            <>
              {/* Quick Booking Options */}
              <div className="p-4 space-y-3">
                {onQuickCreate && (
                  <button
                    onClick={() => setMode('quick')}
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-cyan-300 hover:bg-white"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                      <Anchor className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">Quick Book</div>
                      <div className="text-xs text-slate-400">
                        Walk-up or phone — just name and party size
                      </div>
                    </div>
                  </button>
                )}

                <button
                  onClick={onCreateBooking}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-cyan-300 hover:bg-white"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50">
                    <CalendarPlus className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Full Booking Form</div>
                    <div className="text-xs text-slate-400">
                      Complete details, email, payment, and confirmation
                    </div>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end border-t border-slate-200 p-4">
                <button
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Quick Booking Form */}
              <div className="p-4 space-y-4">
                {/* Booking Source */}
                <div className="flex gap-2">
                  {([
                    { value: 'walk_up' as BookingSource, label: 'Walk-up' },
                    { value: 'phone' as BookingSource, label: 'Phone' },
                    { value: 'other' as BookingSource, label: 'Other' },
                  ]).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setSource(value)}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        source === value
                          ? 'bg-cyan-50 text-cyan-600 border border-cyan-500/50'
                          : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Guest Name */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <User className="h-3.5 w-3.5" />
                    Guest Name
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                    autoFocus
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <Phone className="h-3.5 w-3.5" />
                    Phone <span className="text-slate-600">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  />
                </div>

                {/* Party Size */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <Users className="h-3.5 w-3.5" />
                    Party Size
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map((size) => (
                      <button
                        key={size}
                        onClick={() => setPartySize(size)}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                          partySize === size
                            ? 'bg-cyan-50 text-cyan-600 border border-cyan-500/50'
                            : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 p-4">
                <button
                  onClick={() => setMode('choose')}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white hover:text-slate-900"
                >
                  Back
                </button>
                <button
                  onClick={handleQuickCreate}
                  disabled={!guestName.trim() || isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-cyan-50 px-6 py-2 font-medium text-cyan-600 transition-colors hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CalendarPlus className="h-4 w-4" />
                  {isSubmitting ? 'Creating...' : 'Create Booking'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
