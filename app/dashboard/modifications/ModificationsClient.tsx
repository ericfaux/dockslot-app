'use client'

import { useState, useEffect } from 'react'
import { Calendar, Users, Check, X, Loader2, Clock, ArrowRight } from 'lucide-react'

interface ModificationRequest {
  id: string
  booking_id: string
  requested_by: string
  modification_type: string
  new_scheduled_start: string | null
  new_scheduled_end: string | null
  new_party_size: number | null
  original_scheduled_start: string
  original_scheduled_end: string
  original_party_size: number
  reason: string | null
  status: string
  created_at: string
  bookings: {
    guest_name: string
    scheduled_start: string
    party_size: number
  }
}

export default function ModificationsClient() {
  const [requests, setRequests] = useState<ModificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState<Record<string, string>>({})

  useEffect(() => {
    loadRequests()
  }, [filter])

  async function loadRequests() {
    try {
      setLoading(true)
      const params = filter === 'pending' ? '?status=pending' : ''
      const res = await fetch(`/api/booking-modifications${params}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests)
      }
    } catch (err) {
      console.error('Failed to load requests:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleResponse(requestId: string, status: 'approved' | 'rejected') {
    if (processingId) return

    setProcessingId(requestId)

    try {
      const res = await fetch(`/api/booking-modifications/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          captainResponse: responseText[requestId] || null,
        }),
      })

      if (res.ok) {
        loadRequests()
        setResponseText(prev => {
          const { [requestId]: _, ...rest } = prev
          return rest
        })
      }
    } catch (err) {
      console.error('Failed to process request:', err)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    )
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            filter === 'pending'
              ? 'text-cyan-600'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          Pending
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded-full text-xs">
              {pendingCount}
            </span>
          )}
          {filter === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
          )}
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            filter === 'all'
              ? 'text-cyan-600'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          All Requests
          {filter === 'all' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
          )}
        </button>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {filter === 'pending' ? 'No Pending Requests' : 'No Modification Requests'}
            </h3>
            <p className="text-slate-400">
              {filter === 'pending' 
                ? 'Guest modification requests will appear here.' 
                : 'No modification requests have been submitted.'}
            </p>
          </div>
        ) : (
          requests.map((request) => {
            const booking = request.bookings
            const isPending = request.status === 'pending'
            const isProcessing = processingId === request.id

            return (
              <div
                key={request.id}
                className={`p-6 bg-white rounded-xl border ${
                  isPending 
                    ? 'border-cyan-500/30' 
                    : request.status === 'approved'
                    ? 'border-emerald-500/30'
                    : 'border-rose-500/30'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {booking.guest_name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Requested {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending'
                          ? 'bg-cyan-50 text-cyan-600'
                          : request.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Changes */}
                <div className="space-y-4 mb-6">
                  {/* Date/Time Change */}
                  {(request.modification_type === 'date_time' || request.modification_type === 'both') && (
                    <div className="flex items-start gap-4 p-4 bg-white rounded-lg">
                      <Calendar className="w-5 h-5 text-cyan-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 mb-2">Date & Time Change</p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-slate-400">
                            {new Date(request.original_scheduled_start).toLocaleString()}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-600" />
                          <span className="text-slate-900 font-medium">
                            {new Date(request.new_scheduled_start!).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Party Size Change */}
                  {(request.modification_type === 'party_size' || request.modification_type === 'both') && (
                    <div className="flex items-start gap-4 p-4 bg-white rounded-lg">
                      <Users className="w-5 h-5 text-cyan-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 mb-2">Party Size Change</p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-slate-400">{request.original_party_size} guests</span>
                          <ArrowRight className="w-4 h-4 text-slate-600" />
                          <span className="text-slate-900 font-medium">{request.new_party_size} guests</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reason */}
                  {request.reason && (
                    <div className="p-4 bg-white rounded-lg">
                      <p className="text-sm font-medium text-slate-600 mb-1">Guest's Reason</p>
                      <p className="text-sm text-slate-400">{request.reason}</p>
                    </div>
                  )}
                </div>

                {/* Actions (if pending) */}
                {isPending && (
                  <div className="space-y-3">
                    <textarea
                      value={responseText[request.id] || ''}
                      onChange={(e) => setResponseText(prev => ({
                        ...prev,
                        [request.id]: e.target.value,
                      }))}
                      placeholder="Optional response to guest..."
                      rows={2}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResponse(request.id, 'approved')}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleResponse(request.id, 'rejected')}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
