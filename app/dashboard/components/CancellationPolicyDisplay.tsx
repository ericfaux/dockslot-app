'use client'

import { useState, useEffect } from 'react'
import { Shield, Clock, DollarSign, AlertCircle, Loader2 } from 'lucide-react'

interface CancellationPolicy {
  hours_required: number
  hours_until_trip: number
  refund_percentage: number
  refund_amount: number
  description: string
  custom_text?: string | null
}

interface CancellationPolicyDisplayProps {
  bookingId: string
  compact?: boolean
}

export default function CancellationPolicyDisplay({
  bookingId,
  compact = false,
}: CancellationPolicyDisplayProps) {
  const [policy, setPolicy] = useState<CancellationPolicy | null>(null)
  const [eligibleForFullRefund, setEligibleForFullRefund] = useState(false)
  const [canCancel, setCanCancel] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPolicy()
  }, [bookingId])

  async function loadPolicy() {
    try {
      setLoading(true)
      const res = await fetch(`/api/bookings/${bookingId}/cancellation-policy`)
      
      if (!res.ok) {
        throw new Error('Failed to load cancellation policy')
      }

      const data = await res.json()
      setPolicy(data.policy)
      setEligibleForFullRefund(data.eligible_for_full_refund)
      setCanCancel(data.can_cancel)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policy')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    )
  }

  if (error || !policy) {
    return null
  }

  if (compact) {
    return (
      <div className="flex items-start gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
        <Shield className={`w-4 h-4 mt-0.5 ${
          eligibleForFullRefund ? 'text-emerald-400' : 'text-amber-400'
        }`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-300">
            {policy.description}
          </p>
          {policy.custom_text && (
            <p className="mt-1 text-xs text-slate-500">
              {policy.custom_text}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
        <Shield className="w-4 h-4" />
        Cancellation Policy
      </h3>

      {/* Policy Summary */}
      <div className={`p-4 rounded-lg border ${
        eligibleForFullRefund
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-amber-500/10 border-amber-500/20'
      }`}>
        <div className="flex items-start gap-3">
          <Shield className={`w-5 h-5 mt-0.5 ${
            eligibleForFullRefund ? 'text-emerald-400' : 'text-amber-400'
          }`} />
          <div className="flex-1 min-w-0">
            <p className={`font-medium ${
              eligibleForFullRefund ? 'text-emerald-300' : 'text-amber-300'
            }`}>
              {eligibleForFullRefund ? 'Full Refund Available' : 'Partial/No Refund'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {policy.description}
            </p>
          </div>
        </div>

        {/* Policy Details */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Time Until Trip</p>
              <p className="font-mono text-sm text-slate-300">
                {policy.hours_until_trip}h
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Refund Amount</p>
              <p className="font-mono text-sm text-slate-300">
                ${(policy.refund_amount / 100).toFixed(2)} ({policy.refund_percentage}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Policy Text */}
      {policy.custom_text && (
        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-cyan-400 mt-0.5" />
            <p className="text-sm text-slate-400 leading-relaxed">
              {policy.custom_text}
            </p>
          </div>
        </div>
      )}

      {/* Policy Requirements */}
      <div className="text-xs text-slate-500 space-y-1">
        <p>• Full refund if cancelled {policy.hours_required}+ hours before trip</p>
        <p>• {policy.refund_percentage}% refund if cancelled within {policy.hours_required} hours</p>
        {!canCancel && (
          <p className="text-amber-400">• This booking cannot be cancelled (already completed/cancelled)</p>
        )}
      </div>
    </div>
  )
}
