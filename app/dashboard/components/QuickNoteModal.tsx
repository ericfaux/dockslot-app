'use client'

import { useState, useEffect } from 'react'
import { X, StickyNote, Loader2, Check } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface TodayTrip {
  id: string
  guestName: string
  scheduledStart: string
  tripType: string
}

interface QuickNoteModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickNoteModal({ isOpen, onClose }: QuickNoteModalProps) {
  const [todayTrips, setTodayTrips] = useState<TodayTrip[]>([])
  const [isLoadingTrips, setIsLoadingTrips] = useState(true)
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch today's trips when modal opens
  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setSelectedTrip(null)
      setNote('')
      setSuccess(false)
      setError(null)
      return
    }

    const fetchTodayTrips = async () => {
      setIsLoadingTrips(true)
      try {
        const today = format(new Date(), 'yyyy-MM-dd')
        const response = await fetch(
          `/api/bookings?startDate=${today}&endDate=${today}&limit=20`
        )
        if (response.ok) {
          const data = await response.json()
          setTodayTrips(
            (data.bookings || []).map(
              (b: {
                id: string
                guest_name: string
                scheduled_start: string
                trip_type?: { title?: string }
              }) => ({
                id: b.id,
                guestName: b.guest_name,
                scheduledStart: b.scheduled_start,
                tripType: b.trip_type?.title || 'Trip',
              })
            )
          )
        }
      } catch (err) {
        console.error('Error fetching today trips:', err)
      } finally {
        setIsLoadingTrips(false)
      }
    }

    fetchTodayTrips()
  }, [isOpen])

  const handleSave = async () => {
    if (!selectedTrip || !note.trim()) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${selectedTrip}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: note.trim(),
          append: true, // Append to existing notes
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
        }, 1000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save note')
      }
    } catch (err) {
      setError('Failed to save note')
    } finally {
      setIsSaving(false)
    }
  }

  const formatTime = (dateStr: string): string => {
    try {
      return format(parseISO(dateStr), 'h:mm a')
    } catch {
      return ''
    }
  }

  if (!isOpen) return null

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
          className="pointer-events-auto w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                <StickyNote className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Quick Note</h2>
                <p className="text-sm text-slate-400">
                  Add a note to today&apos;s trip
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
          <div className="space-y-4 p-4">
            {/* Trip Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Select Trip
              </label>
              {isLoadingTrips ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                </div>
              ) : todayTrips.length === 0 ? (
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-8 text-center">
                  <p className="text-slate-400">No trips scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayTrips.map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => setSelectedTrip(trip.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        selectedTrip === trip.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-200">
                          {trip.guestName}
                        </span>
                        <span className="text-sm text-slate-400">
                          {formatTime(trip.scheduledStart)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{trip.tripType}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Note Input */}
            {selectedTrip && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., Caught 3 snook, weather was perfect..."
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  rows={3}
                  maxLength={1000}
                  autoFocus
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                <Check className="h-4 w-4" />
                Note saved successfully!
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-700 p-4">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !selectedTrip || !note.trim() || success}
              className="flex items-center gap-2 rounded-lg bg-cyan-500/20 px-6 py-2 font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <StickyNote className="h-4 w-4" />
                  Save Note
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
