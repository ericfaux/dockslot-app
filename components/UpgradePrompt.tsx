'use client';

import Link from 'next/link';
import { Zap, Crown } from 'lucide-react';
import type { SubscriptionTier } from '@/lib/db/types';
import { getTierDisplayName } from '@/lib/subscription/gates';

interface UpgradePromptProps {
  /** Human-readable feature name (e.g., "SMS Reminders") */
  feature: string;
  /** Brief description of what the feature does */
  description?: string;
  /** Minimum tier required to unlock this feature */
  requiredTier: 'captain' | 'fleet';
  /** Use compact inline variant vs full card */
  compact?: boolean;
}

export function UpgradePrompt({
  feature,
  description,
  requiredTier,
  compact = false,
}: UpgradePromptProps) {
  const tierName = getTierDisplayName(requiredTier);
  const Icon = requiredTier === 'fleet' ? Crown : Zap;

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm">
        <Icon className="h-4 w-4 flex-shrink-0 text-amber-600" />
        <span className="text-amber-800">
          {feature} requires{' '}
          <Link
            href="/dashboard/billing"
            className="font-semibold underline hover:text-amber-900"
          >
            {tierName}
          </Link>
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-cyan-50 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100">
        <Icon className="h-6 w-6 text-cyan-700" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-slate-800">{feature}</h3>
      {description && (
        <p className="mb-4 text-sm text-slate-500">{description}</p>
      )}
      <p className="mb-4 text-sm text-slate-600">
        Available on the <span className="font-semibold">{tierName}</span> plan
        {requiredTier === 'captain' ? ' and above' : ''}.
      </p>
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
      >
        <Icon className="h-4 w-4" />
        Upgrade to {tierName}
      </Link>
    </div>
  );
}
