'use client'

import { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { GatedFeature, getMinimumTier, getTierDisplayName } from '@/lib/subscription/gates'

interface LockedFeatureOverlayProps {
  feature: GatedFeature | string
  children: ReactNode
  /** Visual pattern: 'widget' for dashboard widgets, 'section' for inline sections */
  pattern?: 'widget' | 'section'
}

/**
 * LockedFeatureOverlay - Blurred overlay for gated content sections.
 * Renders children behind a blur filter with a lock badge and upgrade prompt.
 */
export function LockedFeatureOverlay({
  feature,
  children,
  pattern = 'section',
}: LockedFeatureOverlayProps) {
  const minTier = getMinimumTier(feature as GatedFeature)
  const tierName = getTierDisplayName(minTier)

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Blurred content */}
      <div className="pointer-events-none select-none" style={{ filter: 'blur(3px)' }}>
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px]">
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white/90 px-6 py-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <Lock className="h-5 w-5 text-slate-500" />
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">
            {tierName} Feature
          </span>
          <a
            href="/dashboard/billing"
            className="rounded-md bg-cyan-600 px-4 py-1.5 font-mono text-xs font-medium text-white transition-colors hover:bg-cyan-700"
          >
            Upgrade
          </a>
        </div>
      </div>
    </div>
  )
}
