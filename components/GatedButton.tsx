'use client'

import { ReactNode } from 'react'

interface GatedButtonProps {
  feature?: string
  children: ReactNode
  className?: string
}

/**
 * GatedButton - Previously gated features behind subscription tiers.
 * Now a simple pass-through since all features are available to all users.
 */
export function GatedButton({ children }: GatedButtonProps) {
  return <>{children}</>
}
