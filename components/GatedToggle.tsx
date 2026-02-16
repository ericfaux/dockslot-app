'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useSubscription } from '@/lib/subscription/context'
import { canUseFeature, GatedFeature } from '@/lib/subscription/gates'
import { UpgradeModal } from '@/components/UpgradeModal'

interface GatedToggleProps {
  feature: GatedFeature
  enabled: boolean
  onToggle: (enabled: boolean) => void
  label: string
  description?: string
}

/**
 * GatedToggle - Toggle switch that shows a "Captain" badge and opens
 * an upgrade modal when clicked by a Deckhand user.
 */
export function GatedToggle({
  feature,
  enabled,
  onToggle,
  label,
  description,
}: GatedToggleProps) {
  const { tier } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)

  const hasAccess = canUseFeature(tier, feature)

  if (hasAccess) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
            enabled ? 'bg-cyan-600' : 'bg-slate-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    )
  }

  return (
    <>
      <div
        className="flex cursor-pointer items-center justify-between gap-4"
        onClick={() => setShowUpgrade(true)}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-400">{label}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Lock className="h-2.5 w-2.5" />
              Captain
            </span>
          </div>
          {description && (
            <p className="text-xs text-slate-400">{description}</p>
          )}
        </div>
        <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-slate-100">
          <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0" />
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={feature}
      />
    </>
  )
}
