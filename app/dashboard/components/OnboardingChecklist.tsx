'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Ship,
  Calendar,
  Share2,
  Ticket,
  Clock,
  Check,
  ChevronRight,
  X,
  AlertCircle,
} from 'lucide-react';

interface OnboardingChecklistProps {
  hasMeetingSpot: boolean;
  hasVessel: boolean;
  hasTripType: boolean;
  hasBooking: boolean;
  hasAvailability?: boolean;
  bookingPageUrl: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
  href?: string;
  action?: 'copy-link';
}

export function OnboardingChecklist({
  hasMeetingSpot,
  hasVessel,
  hasTripType,
  hasBooking,
  hasAvailability = true,
  bookingPageUrl,
}: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('onboardingChecklistDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const items: ChecklistItem[] = [
    {
      id: 'meeting-spot',
      label: 'Set up your meeting spot',
      description: 'Add a location so guests know where to meet you',
      completed: hasMeetingSpot,
      icon: <MapPin className="h-4 w-4" />,
      href: '/dashboard/settings',
    },
    {
      id: 'vessel',
      label: 'Add a vessel',
      description: 'Add your boat to start accepting bookings',
      completed: hasVessel,
      icon: <Ship className="h-4 w-4" />,
      href: '/dashboard/vessels',
    },
    {
      id: 'trip-type',
      label: 'Create a trip type',
      description: 'Define what kind of trips you offer',
      completed: hasTripType,
      icon: <Calendar className="h-4 w-4" />,
      href: '/dashboard/trips',
    },
    {
      id: 'availability',
      label: 'Set your availability',
      description: 'Configure your weekly schedule',
      completed: hasAvailability,
      icon: <Clock className="h-4 w-4" />,
      href: '/dashboard/schedule',
    },
    {
      id: 'share-link',
      label: 'Share your booking link',
      description: 'Send your link to potential guests',
      completed: false,
      icon: <Share2 className="h-4 w-4" />,
      action: 'copy-link',
    },
    {
      id: 'first-booking',
      label: 'Get your first booking',
      description: 'Once a guest books, you\'re ready to go',
      completed: hasBooking,
      icon: <Ticket className="h-4 w-4" />,
      href: '/dashboard/bookings',
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const allComplete = completedCount === items.length;

  // Don't show if dismissed or all complete
  if (isDismissed || allComplete) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('onboardingChecklistDismissed', 'true');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingPageUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // silent fail
    }
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            Complete your setup
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {completedCount} of {items.length} steps completed
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
          aria-label="Dismiss checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-1.5 rounded-full bg-slate-700">
        <div
          className="h-1.5 rounded-full bg-cyan-500 transition-all"
          style={{ width: `${(completedCount / items.length) * 100}%` }}
        />
      </div>

      {/* Highlight missing critical items */}
      {(!hasVessel || !hasTripType) && (
        <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            {!hasVessel && !hasTripType
              ? 'Add a vessel and create a trip type to start accepting bookings.'
              : !hasVessel
              ? 'Add a vessel to start accepting bookings.'
              : 'Create a trip type to start accepting bookings.'}
          </p>
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item) => {
          if (item.action === 'copy-link') {
            return (
              <button
                key={item.id}
                onClick={handleCopyLink}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-700/50"
              >
                <div
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                    linkCopied
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'border border-slate-600 text-slate-500'
                  }`}
                >
                  {linkCopied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    item.icon
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-300 block">
                    {linkCopied ? 'Link copied!' : item.label}
                  </span>
                  {!linkCopied && (
                    <span className="text-xs text-slate-500 block">{item.description}</span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            );
          }

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-700/50"
              >
                <div
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                    item.completed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'border border-slate-600 text-slate-500'
                  }`}
                >
                  {item.completed ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    item.icon
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm block ${
                      item.completed
                        ? 'text-slate-500 line-through'
                        : 'text-slate-300'
                    }`}
                  >
                    {item.label}
                  </span>
                  {!item.completed && (
                    <span className="text-xs text-slate-500 block">{item.description}</span>
                  )}
                </div>
                {!item.completed && (
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                )}
              </Link>
            );
          }

          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-700/50"
            >
              <div
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                  item.completed
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'border border-slate-600 text-slate-500'
                }`}
              >
                {item.completed ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  item.icon
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm block ${
                    item.completed
                      ? 'text-slate-500 line-through'
                      : 'text-slate-300'
                  }`}
                >
                  {item.label}
                </span>
                {!item.completed && (
                  <span className="text-xs text-slate-500 block">{item.description}</span>
                )}
              </div>
              {!item.completed && (
                <ChevronRight className="h-4 w-4 text-slate-600" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
