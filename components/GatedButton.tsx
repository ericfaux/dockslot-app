'use client'

import { useState, ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useSubscription } from '@/lib/subscription/context'
import { canUseFeature, GatedFeature } from '@/lib/subscription/gates'
import { UpgradeModal } from '@/components/UpgradeModal'

interface GatedButtonProps {
  feature: GatedFeature
  children: ReactNode
  /** Optional: override the wrapper element's className */
  className?: string
}

/**
 * GatedButton - Wraps a button element and shows a lock icon + upgrade modal
 * when the user is on the deckhand (free) tier.
 *
 * If the user has access to the feature, renders children normally.
 * If the user does NOT have access, renders a locked version that
 * opens an UpgradeModal on click.
 */
export function GatedButton({ feature, children, className }: GatedButtonProps) {
  const { tier } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)

  const hasAccess = canUseFeature(tier, feature)

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <>
      <div
        className={`relative cursor-pointer ${className || ''}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowUpgrade(true)
        }}
      >
        {/* Render children but disable interactions */}
        <div className="pointer-events-none opacity-50">
          {children}
        </div>
        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-1 rounded-full bg-slate-800/80 px-2.5 py-1">
            <Lock className="h-3 w-3 text-amber-400" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Captain
            </span>
          </div>
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
