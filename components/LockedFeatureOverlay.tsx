'use client'

import { ReactNode } from 'react'

interface LockedFeatureOverlayProps {
  feature?: string
  children: ReactNode
  pattern?: 'widget' | 'section'
}

/**
 * LockedFeatureOverlay - Previously showed a blurred overlay for gated content.
 * Now a simple pass-through since all features are available to all users.
 */
export function LockedFeatureOverlay({ children }: LockedFeatureOverlayProps) {
  return <>{children}</>
}
