'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Lightbulb, Ship, FileSignature, Moon, Anchor, type LucideIcon } from 'lucide-react';

const STORAGE_KEY = 'dockslot_nudge_dismissed';
const CREATED_AT_KEY = 'dockslot_account_created';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface FeatureNudge {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
}

interface FeatureNudgesProps {
  hasVessel: boolean;
  hasTripType: boolean;
  hasBooking: boolean;
  dockModeEnabled: boolean;
}

export function FeatureNudges({ hasVessel, hasTripType, hasBooking, dockModeEnabled }: FeatureNudgesProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Track account creation time
    if (!localStorage.getItem(CREATED_AT_KEY)) {
      localStorage.setItem(CREATED_AT_KEY, Date.now().toString());
    }

    const createdAt = parseInt(localStorage.getItem(CREATED_AT_KEY) || '0');
    const daysSinceCreation = Date.now() - createdAt;

    // Only show nudges after 7 days
    if (daysSinceCreation < SEVEN_DAYS_MS) {
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setDismissed(new Set(JSON.parse(stored)));
      } catch {
        // ignore
      }
    }
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  const allNudges: FeatureNudge[] = [];

  if (!hasVessel) {
    allNudges.push({
      id: 'vessel',
      icon: Ship,
      title: 'Add your vessel',
      description: 'Set up your boat details so guests know what to expect.',
      href: '/dashboard/settings?tab=vessels',
      ctaLabel: 'Add Vessel',
    });
  }

  if (!hasTripType && hasVessel) {
    allNudges.push({
      id: 'trip-type',
      icon: Anchor,
      title: 'Create a trip type',
      description: 'Define what kinds of trips you offer to start accepting bookings.',
      href: '/dashboard/settings?tab=trip-types',
      ctaLabel: 'Create Trip',
    });
  }

  if (!dockModeEnabled && hasBooking) {
    allNudges.push({
      id: 'dock-mode',
      icon: Anchor,
      title: 'Try Dock Mode',
      description: 'A simplified view designed for use on the water with large text and big buttons.',
      href: '/dashboard/settings',
      ctaLabel: 'Enable',
    });
  }

  // Filter out dismissed nudges
  const visibleNudges = allNudges.filter((n) => !dismissed.has(n.id));

  if (visibleNudges.length === 0) return null;

  // Only show one nudge at a time
  const nudge = visibleNudges[0];
  const Icon = nudge.icon;

  const handleDismiss = () => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(nudge.id);
    setDismissed(newDismissed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...newDismissed]));
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15">
          <Lightbulb className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200">{nudge.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{nudge.description}</p>
          <Link
            href={nudge.href}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600 transition-colors"
          >
            <Icon className="h-3.5 w-3.5" />
            {nudge.ctaLabel}
          </Link>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded p-1 text-slate-600 hover:text-slate-400 transition-colors"
          aria-label="Dismiss suggestion"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
