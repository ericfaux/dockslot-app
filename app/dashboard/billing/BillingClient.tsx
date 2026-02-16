'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Check,
  AlertCircle,
  CreditCard,
  ExternalLink,
  Zap,
  Crown,
  Loader2,
  Anchor,
  Ship,
} from 'lucide-react';
import type { SubscriptionTier, SubscriptionStatus, BillingInterval } from '@/lib/db/types';
import { getTierDisplayName, isUpgrade } from '@/lib/subscription/gates';
import { PRICING } from '@/lib/stripe/config';

interface BillingClientProps {
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  periodEnd: string | null;
  hasStripeCustomer: boolean;
}

const DECKHAND_FEATURES = [
  'Online booking page',
  'Up to 30 bookings/month',
  '1 trip type',
  '1 vessel',
  'Cash/Venmo/Zelle payments',
  'NOAA weather alerts',
  'Digital waivers',
  'Dock Mode',
  'Basic calendar view',
];

const CAPTAIN_FEATURES = [
  'Everything in Deckhand',
  'Unlimited bookings',
  'Unlimited trip types & vessels',
  'Stripe deposit collection',
  'SMS reminders',
  'Custom branding',
  'Full analytics & reports',
  'Promo codes',
  'Waitlist',
  'Booking modifications',
  'CSV export',
  'Priority email support',
];

const FLEET_FEATURES = [
  'Everything in Captain',
  'Multi-vessel management',
  'Staff accounts (up to 5)',
  'Advanced analytics',
  'API access / Calendar embed',
  'White-label booking page',
  'Priority phone support',
  'Early access to new features',
];

const FLEET_COMING_SOON = [
  'Multi-vessel management',
  'Staff accounts (up to 5)',
  'Advanced analytics',
  'API access / Calendar embed',
  'White-label booking page',
];

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function BillingClient({
  subscriptionTier,
  subscriptionStatus,
  periodEnd,
  hasStripeCustomer,
}: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const searchParams = useSearchParams();

  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';
  const successTier = searchParams.get('tier');
  const isPastDue = subscriptionStatus === 'past_due';
  const isCanceledStatus = subscriptionStatus === 'canceled';
  const isOnPaidPlan = subscriptionTier === 'captain' || subscriptionTier === 'fleet';

  const formattedPeriodEnd = periodEnd
    ? new Date(periodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const handleSubscribe = async (tier: 'captain' | 'fleet') => {
    setLoading(`subscribe-${tier}`);
    setError(null);

    try {
      const response = await fetch('/api/stripe/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval: billingInterval }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start checkout');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

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

  const getPrice = (tier: 'captain' | 'fleet') => {
    const prices = PRICING[tier];
    if (billingInterval === 'annual') {
      return {
        display: formatCents(prices.annualMonthly),
        suffix: '/mo',
        billed: `Billed ${formatCents(prices.annual)}/year`,
        savings: formatCents(prices.annualSavings),
      };
    }
    return {
      display: formatCents(prices.monthly),
      suffix: '/mo',
      billed: null,
      savings: null,
    };
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

      {/* Billing Interval Toggle */}
      <div className="flex items-center justify-center gap-1">
        <div className="inline-flex items-center rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              billingInterval === 'annual'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Annual
          </button>
        </div>
        {billingInterval === 'annual' && (
          <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            Save up to {formatCents(PRICING.fleet.annualSavings)}
          </span>
        )}
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Deckhand (Free) */}
        <div
          className={`rounded-xl border-2 bg-white p-6 ${
            subscriptionTier === 'deckhand' ? 'border-cyan-500' : 'border-slate-200'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-800">Deckhand</h3>
              <Anchor className="h-4 w-4 text-slate-400" />
            </div>
            {subscriptionTier === 'deckhand' && (
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                CURRENT PLAN
              </span>
            )}
          </div>
          <div className="mb-4 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-900">$0</span>
            <span className="text-slate-500">/month</span>
          </div>
          <p className="mb-6 text-sm text-slate-500">
            Everything you need to get started with online bookings.
          </p>
          <ul className="space-y-2">
            {DECKHAND_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 flex-shrink-0 text-cyan-600 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Captain */}
        <div
          className={`relative rounded-xl border-2 bg-white p-6 ${
            subscriptionTier === 'captain' ? 'border-cyan-500' : 'border-cyan-300'
          }`}
        >
          {/* Most Popular Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-cyan-600 px-3 py-1 text-xs font-bold text-white">
              MOST POPULAR
            </span>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-800">Captain</h3>
              <Zap className="h-4 w-4 text-cyan-500" />
            </div>
            {subscriptionTier === 'captain' && (
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                CURRENT PLAN
              </span>
            )}
          </div>
          <div className="mb-1 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-900">
              {getPrice('captain').display}
            </span>
            <span className="text-slate-500">{getPrice('captain').suffix}</span>
          </div>
          {getPrice('captain').billed && (
            <p className="mb-4 text-xs text-slate-400">{getPrice('captain').billed}</p>
          )}
          {!getPrice('captain').billed && <div className="mb-4" />}
          <p className="mb-6 text-sm text-slate-500">
            For working captains who need advanced tools and unlimited bookings.
          </p>

          {/* Upgrade button for non-captain users */}
          {subscriptionTier !== 'captain' && subscriptionTier !== 'fleet' && (
            <button
              onClick={() => handleSubscribe('captain')}
              disabled={loading !== null}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
            >
              {loading === 'subscribe-captain' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Upgrade to Captain
                </>
              )}
            </button>
          )}

          <ul className="space-y-2">
            {CAPTAIN_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 flex-shrink-0 text-cyan-600 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Fleet */}
        <div
          className={`rounded-xl border-2 bg-white p-6 ${
            subscriptionTier === 'fleet' ? 'border-cyan-500' : 'border-slate-200'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-800">Fleet</h3>
              <Ship className="h-4 w-4 text-amber-500" />
            </div>
            {subscriptionTier === 'fleet' && (
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                CURRENT PLAN
              </span>
            )}
          </div>
          <div className="mb-1 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-900">
              {getPrice('fleet').display}
            </span>
            <span className="text-slate-500">{getPrice('fleet').suffix}</span>
          </div>
          {getPrice('fleet').billed && (
            <p className="mb-4 text-xs text-slate-400">{getPrice('fleet').billed}</p>
          )}
          {!getPrice('fleet').billed && <div className="mb-4" />}
          <p className="mb-6 text-sm text-slate-500">
            For captains with multiple boats or a growing team.
          </p>

          {/* Upgrade button for non-fleet users */}
          {subscriptionTier !== 'fleet' && (
            <button
              onClick={() => handleSubscribe('fleet')}
              disabled={loading !== null}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {loading === 'subscribe-fleet' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4" />
                  {isUpgrade(subscriptionTier, 'fleet') ? 'Upgrade to Fleet' : 'Switch to Fleet'}
                </>
              )}
            </button>
          )}

          <ul className="space-y-2">
            {FLEET_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 flex-shrink-0 text-cyan-600 mt-0.5" />
                <span>
                  {feature}
                  {FLEET_COMING_SOON.includes(feature) && (
                    <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      COMING SOON
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Zero Commission Callout */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-4 text-center">
        <p className="text-sm font-semibold text-emerald-800">
          0% commission on every plan. Always.
        </p>
        <p className="mt-1 text-xs text-emerald-600">
          Your booking link. Your guests. Your money. Standard Stripe processing fees apply on Captain and Fleet plans.
        </p>
      </div>

      {/* Subscription Details (Paid plans) */}
      {isOnPaidPlan && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Subscription Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Plan</span>
              <span className="font-medium text-slate-800">
                {getTierDisplayName(subscriptionTier)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span
                className={`font-medium ${
                  subscriptionStatus === 'active'
                    ? 'text-emerald-600'
                    : subscriptionStatus === 'past_due'
                      ? 'text-amber-600'
                      : 'text-slate-600'
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
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {isCanceledStatus ? 'Access until' : 'Next billing date'}
                </span>
                <span className="font-medium text-slate-800">{formattedPeriodEnd}</span>
              </div>
            )}
          </div>

          {hasStripeCustomer && (
            <button
              onClick={handleManageBilling}
              disabled={loading !== null}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              {loading === 'portal' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening billing portal...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Manage Billing & Payment Method
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Manage Billing (Deckhand with existing customer history) */}
      {!isOnPaidPlan && hasStripeCustomer && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-2 text-lg font-semibold text-slate-800">
            Billing History
          </h3>
          <p className="mb-4 text-sm text-slate-500">
            View past invoices and update your payment method.
          </p>
          <button
            onClick={handleManageBilling}
            disabled={loading !== null}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {loading === 'portal' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Billing Portal
          </button>
        </div>
      )}
    </div>
  );
}
