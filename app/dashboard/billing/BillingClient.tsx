'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Check,
  AlertCircle,
  ExternalLink,
  Zap,
  Loader2,
} from 'lucide-react';
import type { SubscriptionTier, SubscriptionStatus } from '@/lib/db/types';
import { getTierDisplayName } from '@/lib/subscription/gates';

interface BillingClientProps {
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  periodEnd: string | null;
  hasStripeCustomer: boolean;
}

const CAPTAIN_FEATURES = [
  'Unlimited bookings, trip types & vessels',
  'Stripe deposit & payment collection',
  'DockSlot Helm (tide, wind, sunset from NOAA)',
  'NOAA weather alerts & monitoring',
  'Float Plan daily schedule',
  'Full dashboard stats & analytics',
  'Full email suite (reminders, reviews, weather)',
  'SMS notifications',
  'Custom booking page branding',
  'Guest CRM & passenger manifest',
  'Booking modifications & waitlist',
  "Captain's Logbook & guest portal",
  'Reviews & ratings',
  'Promo codes & CSV export',
  'Day + week calendar, Quick Block',
  'Keyboard shortcuts & quick actions',
  'Hibernation mode',
  'Priority email support',
];

export function BillingClient({
  subscriptionTier,
  subscriptionStatus,
  periodEnd,
  hasStripeCustomer,
}: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';
  const successTier = searchParams.get('tier');
  const isPastDue = subscriptionStatus === 'past_due';
  const isCanceledStatus = subscriptionStatus === 'canceled';

  const formattedPeriodEnd = periodEnd
    ? new Date(periodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const handleManageBilling = async () => {
    setLoading('portal');
    setError(null);

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to open billing portal');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {isSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 flex-shrink-0 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-800">
                Welcome to {successTier === 'fleet' ? 'Fleet' : 'Captain'}!
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                Your subscription is active. All {successTier === 'fleet' ? 'Fleet' : 'Captain'} features are now unlocked.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Canceled Banner */}
      {isCanceled && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-slate-500" />
            <p className="text-sm text-slate-600">
              Checkout was canceled. No charges were made.
            </p>
          </div>
        </div>
      )}

      {/* Past Due Warning */}
      {isPastDue && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Payment failed</p>
              <p className="mt-1 text-sm text-amber-700">
                Your last payment didn&apos;t go through. Please update your payment method to keep your features.
              </p>
              <button
                onClick={handleManageBilling}
                disabled={loading !== null}
                className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Update Payment Method
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Zero Commission Hero */}
      <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 px-8 py-8 text-center">
        <p className="text-3xl font-bold tracking-tight text-emerald-800">
          0% commission. Always.
        </p>
        <p className="mt-2 text-base text-emerald-700">
          Your booking link. Your guests. Your money.
        </p>
        <p className="mt-1 text-xs text-emerald-500">
          Standard Stripe processing fees apply.
        </p>
      </div>

      {/* Subscription Overview + Manage Billing */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100">
              <Zap className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-800">
                  {getTierDisplayName(subscriptionTier)}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    subscriptionStatus === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : subscriptionStatus === 'past_due'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {subscriptionStatus === 'active' && 'Active'}
                  {subscriptionStatus === 'trialing' && 'Trial'}
                  {subscriptionStatus === 'past_due' && 'Past Due'}
                  {subscriptionStatus === 'canceled' && 'Canceled'}
                  {subscriptionStatus === 'unpaid' && 'Unpaid'}
                </span>
              </div>
              {formattedPeriodEnd && (
                <p className="text-sm text-slate-500">
                  {isCanceledStatus ? 'Access until' : 'Renews'}{' '}
                  {formattedPeriodEnd}
                </p>
              )}
            </div>
          </div>

          {hasStripeCustomer && (
            <button
              onClick={handleManageBilling}
              disabled={loading !== null}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {loading === 'portal' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Manage Billing
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* What's Included */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-base font-semibold text-slate-800">
          What&apos;s included in your plan
        </h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {CAPTAIN_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
