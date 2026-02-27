'use client'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature?: string
}

/**
 * UpgradeModal - Previously showed upgrade prompts for gated features.
 * Now a no-op since all features are available to all users.
 */
export function UpgradeModal({ isOpen }: UpgradeModalProps) {
  if (!isOpen) return null
  return null
}
