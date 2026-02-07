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
} from 'lucide-react';
import type { SubscriptionTier, SubscriptionStatus } from '@/lib/db/types';

interface BillingClientProps {
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  periodEnd: string | null;
  hasStripeCustomer: boolean;
}

const STARTER_FEATURES = [
  'Online booking page',
  'Up to 30 bookings/month',
  'Automated confirmations',
  'NOAA weather alerts',
  'Digital waivers',
  'Dock Mode',
];

const PRO_FEATURES = [
  'Everything in Starter',
  'Unlimited bookings',
  'Deposit collection via Stripe',
  'SMS reminders',
  'Custom branding',
  'Priority support',
];

export function BillingClient({
  subscriptionTier,
  subscriptionStatus,
  periodEnd,
  hasStripeCustomer,
}: BillingClientProps) {
  const [loading, setLoading] = useState<'subscribe' | 'portal' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';
  const isPro = subscriptionTier === 'pro';
  const isPastDue = subscriptionStatus === 'past_due';
  const isCanceledStatus = subscriptionStatus === 'canceled';

  const formattedPeriodEnd = periodEnd
    ? new Date(periodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const handleSubscribe = async () => {
    setLoading('subscribe');
    setError(null);

    try {
      const response = await fetch('/api/stripe/subscribe', {
        method: 'POST',
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

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {isSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 flex-shrink-0 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-800">Welcome to Captain Pro!</p>
              <p className="mt-1 text-sm text-emerald-700">
                Your subscription is active. All Pro features are now unlocked.
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
                Your last payment didn&apos;t go through. Please update your payment method to keep Pro features.
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

      {/* Plan Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Starter */}
        <div
          className={`rounded-xl border-2 bg-white p-6 ${
            !isPro ? 'border-cyan-500' : 'border-slate-200'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Starter</h3>
            {!isPro && (
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
            {STARTER_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 flex-shrink-0 text-cyan-600 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div
          className={`rounded-xl border-2 bg-white p-6 ${
            isPro ? 'border-cyan-500' : 'border-slate-200'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-800">Captain Pro</h3>
              <Crown className="h-4 w-4 text-amber-500" />
            </div>
            {isPro && (
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                CURRENT PLAN
              </span>
            )}
          </div>
          <div className="mb-4 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-900">$29</span>
            <span className="text-slate-500">/month</span>
          </div>
          <p className="mb-6 text-sm text-slate-500">
            For busy captains who need advanced tools and unlimited bookings.
          </p>

          {!isPro && (
            <button
              onClick={handleSubscribe}
              disabled={loading !== null}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
            >
              {loading === 'subscribe' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Upgrade to Pro
                </>
              )}
            </button>
          )}

          <ul className="space-y-2">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 flex-shrink-0 text-cyan-600 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Subscription Details (Pro only) */}
      {isPro && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Subscription Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Plan</span>
              <span className="font-medium text-slate-800">Captain Pro</span>
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
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="font-medium text-slate-800">$29.00/month</span>
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

      {/* Manage Billing (Starter with existing customer) */}
      {!isPro && hasStripeCustomer && (
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
