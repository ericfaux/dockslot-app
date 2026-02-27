'use client';

interface UpgradePromptProps {
  feature?: string;
  description?: string;
  requiredTier?: string;
  compact?: boolean;
}

/**
 * UpgradePrompt - Previously showed upgrade cards for gated features.
 * Now a no-op since all features are available to all users.
 */
export function UpgradePrompt(_props: UpgradePromptProps) {
  return null;
}
