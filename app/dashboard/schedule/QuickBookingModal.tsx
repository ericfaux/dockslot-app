'use client'

import { format, setHours, setMinutes } from 'date-fns'
import { X, CalendarPlus, Clock, Calendar } from 'lucide-react'

interface QuickBookingModalProps {
  isOpen: boolean
  slot: { date: Date; hour: number } | null
  onClose: () => void
  onCreateBooking: () => void
}

export function QuickBookingModal({
  isOpen,
  slot,
  onClose,
  onCreateBooking,
}: QuickBookingModalProps) {
  if (!isOpen || !slot) return null

  const startTime = setMinutes(setHours(slot.date, slot.hour), 0)
  const formattedDate = format(slot.date, 'EEEE, MMMM d, yyyy')
  const formattedTime = format(startTime, 'h:mm a')

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="pointer-events-auto w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
                <CalendarPlus className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Create Booking?
                </h2>
                <p className="text-sm text-slate-400">
                  For this time slot
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-200">
                  {formattedDate}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-300">
                  Starting at {formattedTime}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-700 p-4">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={onCreateBooking}
              className="flex items-center gap-2 rounded-lg bg-cyan-500/20 px-6 py-2 font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30"
            >
              <CalendarPlus className="h-4 w-4" />
              Create Booking
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
