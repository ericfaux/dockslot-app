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
  UserCircle,
  FileText,
  CreditCard,
  Eye,
} from 'lucide-react';

interface OnboardingChecklistProps {
  hasProfile: boolean;
  hasMeetingSpot: boolean;
  hasVessel: boolean;
  hasTripType: boolean;
  hasBooking: boolean;
  hasAvailability?: boolean;
  hasWaiver?: boolean;
  hasStripe?: boolean;
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
  optional?: boolean;
}

export function OnboardingChecklist({
  hasProfile,
  hasMeetingSpot,
  hasVessel,
  hasTripType,
  hasBooking,
  hasAvailability = true,
  hasWaiver = false,
  hasStripe = false,
  bookingPageUrl,
}: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showAgain, setShowAgain] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('onboardingChecklistDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const items: ChecklistItem[] = [
    {
      id: 'profile',
      label: 'Complete your profile',
      description: 'Add your name and business name',
      completed: hasProfile,
      icon: <UserCircle className="h-4 w-4" />,
      href: '/dashboard/settings?tab=profile',
    },
    {
      id: 'meeting-spot',
      label: 'Set up your meeting spot',
      description: 'Add a location so guests know where to meet you',
      completed: hasMeetingSpot,
      icon: <MapPin className="h-4 w-4" />,
      href: '/dashboard/settings?tab=meeting-spot',
    },
    {
      id: 'trip-type',
      label: 'Create a trip type',
      description: 'Define what kind of trips you offer',
      completed: hasTripType,
      icon: <Calendar className="h-4 w-4" />,
      href: '/dashboard/settings?tab=trip-types',
    },
    {
      id: 'vessel',
      label: 'Add a vessel',
      description: 'Add your boat to start accepting bookings',
      completed: hasVessel,
      icon: <Ship className="h-4 w-4" />,
      href: '/dashboard/settings?tab=vessels',
    },
    {
      id: 'availability',
      label: 'Set your availability',
      description: 'Configure your weekly schedule',
      completed: hasAvailability,
      icon: <Clock className="h-4 w-4" />,
      href: '/dashboard/settings?tab=availability',
    },
    {
      id: 'waiver',
      label: 'Create a waiver template',
      description: 'Require guests to sign a liability waiver',
      completed: hasWaiver,
      icon: <FileText className="h-4 w-4" />,
      href: '/dashboard/settings?tab=waivers',
      optional: true,
    },
    {
      id: 'stripe',
      label: 'Connect Stripe',
      description: 'Accept online payments and deposits',
      completed: hasStripe,
      icon: <CreditCard className="h-4 w-4" />,
      href: '/dashboard/settings?tab=payments',
      optional: true,
    },
  ];

  const requiredItems = items.filter((i) => !i.optional);
  const requiredComplete = requiredItems.filter((i) => i.completed).length;
  const allRequiredComplete = requiredComplete === requiredItems.length;
  const totalCompleted = items.filter((i) => i.completed).length;

  // Auto-dismiss when all required items are done
  const shouldHide = isDismissed && !showAgain;

  // Don't render if dismissed (unless "show again"), or if all required items done and no "show again"
  if (shouldHide || (allRequiredComplete && !showAgain)) {
    // If all required complete but component is hidden, show a small "show again" link
    if (allRequiredComplete && !showAgain) {
      return null;
    }
    return (
      <button
        onClick={() => {
          setShowAgain(true);
          setIsDismissed(false);
          localStorage.removeItem('onboardingChecklistDismissed');
        }}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
      >
        <Eye className="h-4 w-4" />
        Show setup checklist
      </button>
    );
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowAgain(false);
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
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Complete your setup
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {totalCompleted} of {items.length} steps completed
            {items.some((i) => i.optional) && (
              <span className="text-slate-400"> (includes optional)</span>
            )}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Dismiss checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-1.5 rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-cyan-500 transition-all"
          style={{ width: `${(totalCompleted / items.length) * 100}%` }}
        />
      </div>

      {/* Highlight missing critical items */}
      {(!hasVessel || !hasTripType) && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            {!hasVessel && !hasTripType
              ? 'Add a vessel and create a trip type to start accepting bookings.'
              : !hasVessel
              ? 'Add a vessel to start accepting bookings.'
              : 'Create a trip type to start accepting bookings.'}
          </p>
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-1">
        {items.map((item) => {
          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50"
              >
                <div
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                    item.completed
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'border border-slate-300 text-slate-400'
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
                        ? 'text-slate-400 line-through'
                        : 'text-slate-600'
                    }`}
                  >
                    {item.label}
                    {item.optional && !item.completed && (
                      <span className="ml-1.5 text-xs text-slate-400 font-normal">(optional)</span>
                    )}
                  </span>
                  {!item.completed && (
                    <span className="text-xs text-slate-400 block">{item.description}</span>
                  )}
                </div>
                {!item.completed && (
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                )}
              </Link>
            );
          }

          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50"
            >
              <div
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                  item.completed
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'border border-slate-300 text-slate-400'
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
                      ? 'text-slate-400 line-through'
                      : 'text-slate-600'
                  }`}
                >
                  {item.label}
                  {item.optional && !item.completed && (
                    <span className="ml-1.5 text-xs text-slate-400 font-normal">(optional)</span>
                  )}
                </span>
                {!item.completed && (
                  <span className="text-xs text-slate-400 block">{item.description}</span>
                )}
              </div>
              {!item.completed && (
                <ChevronRight className="h-4 w-4 text-slate-300" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
