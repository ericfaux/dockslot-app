'use client'

import { useState } from 'react'
import { X, Copy, Calendar, Users, Mail, Phone } from 'lucide-react'
import { format, parseISO, addDays } from 'date-fns'

interface DuplicateBookingModalProps {
  bookingId: string
  originalBooking: {
    guest_name: string
    guest_email: string
    guest_phone: string | null
    party_size: number
    scheduled_start: string
    scheduled_end: string
  }
  isOpen: boolean
  onClose: () => void
  onSuccess: (newBookingId: string) => void
}

export default function DuplicateBookingModal({
  bookingId,
  originalBooking,
  isOpen,
  onClose,
  onSuccess,
}: DuplicateBookingModalProps) {
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize with next week by default
  const originalStart = parseISO(originalBooking.scheduled_start)
  const originalEnd = parseISO(originalBooking.scheduled_end)
  const defaultNewStart = addDays(originalStart, 7)
  const defaultNewEnd = addDays(originalEnd, 7)

  const [formData, setFormData] = useState({
    guest_name: originalBooking.guest_name,
    guest_email: originalBooking.guest_email,
    guest_phone: originalBooking.guest_phone || '',
    party_size: originalBooking.party_size,
    scheduled_date: format(defaultNewStart, 'yyyy-MM-dd'),
    scheduled_time: format(defaultNewStart, 'HH:mm'),
  })

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    setError(null)

    try {
      // Calculate duration from original booking
      const duration =
        (originalEnd.getTime() - originalStart.getTime()) / (1000 * 60 * 60)

      // Build new start/end times
      const newStart = new Date(`${formData.scheduled_date}T${formData.scheduled_time}:00`)
      const newEnd = new Date(newStart.getTime() + duration * 60 * 60 * 1000)

      const response = await fetch(`/api/bookings/${bookingId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: formData.guest_name,
          guest_email: formData.guest_email,
          guest_phone: formData.guest_phone || null,
          party_size: formData.party_size,
          scheduled_start: newStart.toISOString(),
          scheduled_end: newEnd.toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to duplicate booking')
      }

      const data = await response.json()
      onSuccess(data.booking.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate booking')
      console.error(err)
    } finally {
      setIsDuplicating(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
              <Copy className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Duplicate Booking
              </h2>
              <p className="text-sm text-slate-400">
                Create a new booking from this one
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Guest Name */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Users className="h-4 w-4 text-slate-500" />
              Guest Name
            </label>
            <input
              type="text"
              value={formData.guest_name}
              onChange={(e) =>
                setFormData({ ...formData, guest_name: e.target.value })
              }
              className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Mail className="h-4 w-4 text-slate-500" />
              Email
            </label>
            <input
              type="email"
              value={formData.guest_email}
              onChange={(e) =>
                setFormData({ ...formData, guest_email: e.target.value })
              }
              className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Phone className="h-4 w-4 text-slate-500" />
              Phone (optional)
            </label>
            <input
              type="tel"
              value={formData.guest_phone}
              onChange={(e) =>
                setFormData({ ...formData, guest_phone: e.target.value })
              }
              className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Party Size */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Users className="h-4 w-4 text-slate-500" />
              Party Size
            </label>
            <input
              type="number"
              min="1"
              value={formData.party_size}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  party_size: parseInt(e.target.value, 10),
                })
              }
              className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Calendar className="h-4 w-4 text-slate-500" />
                Date
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_date: e.target.value })
                }
                className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 text-sm font-medium text-slate-300">
                Time
              </label>
              <input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_time: e.target.value })
                }
                className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Info Note */}
          <div className="rounded bg-cyan-500/10 p-3 text-sm text-cyan-300">
            <p className="font-medium">What gets copied:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-cyan-400">
              <li>• Vessel & trip type</li>
              <li>• Pricing & special requests</li>
            </ul>
            <p className="mt-2 font-medium">What doesn&apos;t:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-cyan-400">
              <li>• Payment status (starts fresh)</li>
              <li>• Captain notes & tags</li>
              <li>• Waivers & passengers</li>
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-400">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isDuplicating}
            className="flex-1 rounded border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="flex-1 rounded bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
          >
            {isDuplicating ? 'Duplicating...' : 'Duplicate Booking'}
          </button>
        </div>
      </div>
    </>
  )
}
