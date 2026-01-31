'use client'

import { useState } from 'react'
import { Calendar, Users, Send, Check, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ModificationRequestFormProps {
  bookingId: string
  token: string
  currentPartySize: number
  currentScheduledStart: string
  currentScheduledEnd: string
  maxPassengers: number
  durationHours: number
}

export default function ModificationRequestForm({
  bookingId,
  token,
  currentPartySize,
  currentScheduledStart,
  currentScheduledEnd,
  maxPassengers,
  durationHours,
}: ModificationRequestFormProps) {
  const router = useRouter()
  
  const [modificationType, setModificationType] = useState<'date_time' | 'party_size' | 'both'>('date_time')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newPartySize, setNewPartySize] = useState(currentPartySize)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validation
    if ((modificationType === 'date_time' || modificationType === 'both') && (!newDate || !newTime)) {
      setError('Please select a new date and time')
      return
    }

    if ((modificationType === 'party_size' || modificationType === 'both') && newPartySize === currentPartySize) {
      setError('New party size must be different from current')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Calculate new start/end times
      let newScheduledStart = null
      let newScheduledEnd = null
      
      if (modificationType === 'date_time' || modificationType === 'both') {
        const start = new Date(`${newDate}T${newTime}`)
        const end = new Date(start.getTime() + (durationHours * 60 * 60 * 1000))
        newScheduledStart = start.toISOString()
        newScheduledEnd = end.toISOString()
      }

      const res = await fetch('/api/booking-modifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          token,
          modificationType,
          newScheduledStart,
          newScheduledEnd,
          newPartySize: (modificationType === 'party_size' || modificationType === 'both') ? newPartySize : null,
          reason: reason || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit request')
      }

      setIsSubmitted(true)
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="p-8 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-center">
        <Check className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Request Submitted!
        </h2>
        <p className="text-slate-400">
          Your modification request has been sent to the captain for review. You'll receive an email once it's been processed.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Modification Type */}
      <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
        <label className="block text-lg font-semibold text-white mb-4">
          What would you like to change? <span className="text-rose-400">*</span>
        </label>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
            <input
              type="radio"
              name="modificationType"
              value="date_time"
              checked={modificationType === 'date_time'}
              onChange={(e) => setModificationType(e.target.value as any)}
              className="w-4 h-4 text-cyan-600"
            />
            <div>
              <span className="text-white font-medium">Date & Time</span>
              <p className="text-sm text-slate-400">Change when your trip takes place</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
            <input
              type="radio"
              name="modificationType"
              value="party_size"
              checked={modificationType === 'party_size'}
              onChange={(e) => setModificationType(e.target.value as any)}
              className="w-4 h-4 text-cyan-600"
            />
            <div>
              <span className="text-white font-medium">Party Size</span>
              <p className="text-sm text-slate-400">Change number of guests</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
            <input
              type="radio"
              name="modificationType"
              value="both"
              checked={modificationType === 'both'}
              onChange={(e) => setModificationType(e.target.value as any)}
              className="w-4 h-4 text-cyan-600"
            />
            <div>
              <span className="text-white font-medium">Both</span>
              <p className="text-sm text-slate-400">Change date/time and party size</p>
            </div>
          </label>
        </div>
      </div>

      {/* Date & Time (if applicable) */}
      {(modificationType === 'date_time' || modificationType === 'both') && (
        <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">
              New Date & Time
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Time <span className="text-rose-400">*</span>
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
        </div>
      )}

      {/* Party Size (if applicable) */}
      {(modificationType === 'party_size' || modificationType === 'both') && (
        <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">
              New Party Size
            </h3>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setNewPartySize(Math.max(1, newPartySize - 1))}
              className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold transition-colors"
            >
              −
            </button>
            <div className="flex-1 text-center">
              <div className="text-3xl font-bold text-white">{newPartySize}</div>
              <div className="text-sm text-slate-400">guests (max {maxPassengers})</div>
            </div>
            <button
              type="button"
              onClick={() => setNewPartySize(Math.min(maxPassengers, newPartySize + 1))}
              className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold transition-colors"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Reason for Change (Optional)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Let the captain know why you need to make this change..."
          rows={4}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
        />
      </div>

      {/* Info Box */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200">
          <p className="font-medium mb-1">Pending Captain Approval</p>
          <p className="text-amber-300/80">
            Your request will be sent to the captain for review. Changes will only take effect once approved. You'll receive an email notification with the decision.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-semibold"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting Request...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Submit Modification Request
          </>
        )}
      </button>
    </form>
  )
}
