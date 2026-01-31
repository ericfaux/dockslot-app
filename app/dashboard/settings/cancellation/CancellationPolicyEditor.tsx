'use client'

import { useState } from 'react'
import { Shield, Save, Check, AlertCircle } from 'lucide-react'

interface TripType {
  id: string
  title: string
  cancellation_policy_hours: number | null
  cancellation_refund_percentage: number | null
  cancellation_policy_text: string | null
}

interface CancellationPolicyEditorProps {
  tripTypes: TripType[]
}

export default function CancellationPolicyEditor({ tripTypes }: CancellationPolicyEditorProps) {
  const [policies, setPolicies] = useState<Record<string, {
    hours: number
    refundPercentage: number
    customText: string
  }>>(
    tripTypes.reduce((acc, tt) => ({
      ...acc,
      [tt.id]: {
        hours: tt.cancellation_policy_hours || 24,
        refundPercentage: tt.cancellation_refund_percentage || 100,
        customText: tt.cancellation_policy_text || '',
      },
    }), {})
  )

  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSave(tripTypeId: string) {
    setSaving(prev => ({ ...prev, [tripTypeId]: true }))
    setErrors(prev => ({ ...prev, [tripTypeId]: '' }))

    try {
      const policy = policies[tripTypeId]

      const res = await fetch(`/api/trip-types/${tripTypeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancellation_policy_hours: policy.hours,
          cancellation_refund_percentage: policy.refundPercentage,
          cancellation_policy_text: policy.customText || null,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save policy')
      }

      setSaved(prev => ({ ...prev, [tripTypeId]: true }))
      setTimeout(() => {
        setSaved(prev => ({ ...prev, [tripTypeId]: false }))
      }, 2000)
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        [tripTypeId]: err instanceof Error ? err.message : 'Failed to save'
      }))
    } finally {
      setSaving(prev => ({ ...prev, [tripTypeId]: false }))
    }
  }

  function updatePolicy(tripTypeId: string, field: 'hours' | 'refundPercentage' | 'customText', value: number | string) {
    setPolicies(prev => ({
      ...prev,
      [tripTypeId]: {
        ...prev[tripTypeId],
        [field]: value,
      },
    }))
  }

  return (
    <div className="space-y-6">
      {tripTypes.map(tripType => {
        const policy = policies[tripType.id]
        const isSaving = saving[tripType.id]
        const isSaved = saved[tripType.id]
        const error = errors[tripType.id]

        return (
          <div
            key={tripType.id}
            className="p-6 bg-slate-800 rounded-xl border border-slate-700"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {tripType.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    Cancellation Policy
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Hours Before Cancellation */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Refund Window (hours before trip)
                </label>
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={policy.hours}
                  onChange={(e) => updatePolicy(tripType.id, 'hours', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Guests who cancel at least {policy.hours} hours before the trip receive a full refund.
                </p>
              </div>

              {/* Refund Percentage (Within Window) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Refund % (if cancelled within window)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={policy.refundPercentage}
                    onChange={(e) => updatePolicy(tripType.id, 'refundPercentage', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-20 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-center">
                    <span className="text-white font-mono">{policy.refundPercentage}%</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  If a guest cancels less than {policy.hours} hours before the trip, they receive {policy.refundPercentage}% refund.
                </p>
              </div>

              {/* Custom Policy Text */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Custom Policy Text (optional)
                </label>
                <textarea
                  value={policy.customText}
                  onChange={(e) => updatePolicy(tripType.id, 'customText', e.target.value)}
                  placeholder="E.g., Weather-related cancellations are always fully refunded..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Additional policy details shown to guests (e.g., weather exceptions, special conditions).
                </p>
              </div>

              {/* Policy Preview */}
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Policy Preview</p>
                <div className="space-y-1 text-sm text-slate-400">
                  <p>✓ Full refund: Cancel {policy.hours}+ hours before trip</p>
                  <p>• Partial refund ({policy.refundPercentage}%): Cancel within {policy.hours} hours</p>
                  {policy.customText && (
                    <p className="mt-2 text-xs text-cyan-400">
                      Note: {policy.customText}
                    </p>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <p className="text-sm text-rose-400">{error}</p>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={() => handleSave(tripType.id)}
                disabled={isSaving || isSaved}
                className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Policy
                  </>
                )}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
