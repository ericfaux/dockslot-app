'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ExternalLink,
  CreditCard,
  Banknote,
  Wallet,
  UserCog,
  FileText,
  AlertCircle,
  Check,
  DollarSign,
  Shield,
  TrendingUp,
  Zap,
  Settings,
  ArrowRight,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import type { StripeAccountStatus } from '@/lib/stripe/types';

interface PaymentsDashboardClientProps {
  stripeAccountId: string | null;
  stripeAccountStatus: StripeAccountStatus;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  stripeConnectedAt: string | null;
  businessName: string;
  email: string;
}

const dashboardFeatures = [
  {
    title: 'Payments',
    description: 'View payments, resolve disputes, and issue refunds.',
    icon: CreditCard,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    title: 'Payouts',
    description: 'See a history of your payouts to your bank account.',
    icon: Banknote,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    title: 'Balances',
    description: 'View your payout schedule and pending balances.',
    icon: Wallet,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    title: 'Account Management',
    description: 'Update your bank account, tax info, and personal details.',
    icon: UserCog,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    title: 'Documents',
    description: 'Download tax invoices, 1099 forms, and other documents.',
    icon: FileText,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
  },
];

const RETURN_FEEDBACK: Record<
  string,
  { tone: 'success' | 'warning' | 'error'; title: string; body: string }
> = {
  connected: {
    tone: 'success',
    title: 'Stripe connected.',
    body: 'Your account capability state is in sync with Stripe.',
  },
  'sync-failed': {
    tone: 'error',
    title: 'Could not sync with Stripe.',
    body: 'We saved your progress but could not refresh your account status. Try again, or open the Stripe Dashboard to verify.',
  },
  'missing-account': {
    tone: 'warning',
    title: 'No Stripe account on file.',
    body: 'Click Connect Stripe Account below to start onboarding.',
  },
};

export function PaymentsDashboardClient({
  stripeAccountId,
  stripeAccountStatus,
  stripeChargesEnabled,
  stripePayoutsEnabled,
  stripeConnectedAt,
  businessName,
  email,
}: PaymentsDashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stripeFeedbackKey = searchParams?.get('stripe') ?? null;
  // Suppress the missing-account banner when the page itself has an
  // account on file — the banner copy contradicts the Resume onboarding
  // card the page would otherwise render.
  const suppressFeedback =
    stripeFeedbackKey === 'missing-account' && stripeAccountId !== null;
  const stripeFeedback =
    stripeFeedbackKey && !suppressFeedback
      ? RETURN_FEEDBACK[stripeFeedbackKey] ?? null
      : null;

  const [loading, setLoading] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = stripeAccountStatus === 'active';
  const isPending = stripeAccountStatus === 'pending';
  const isRestricted = stripeAccountStatus === 'restricted';

  const handleOpenDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/connect/dashboard', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to access Stripe dashboard');
      }

      const { url } = await response.json();
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleStripeConnect = async () => {
    setOnboardingLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start Stripe onboarding');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setOnboardingLoading(false);
    }
  };

  const handleResumeOnboarding = () => {
    window.location.href = '/api/stripe/connect/refresh';
  };

  const handleDisconnect = async () => {
    setDisconnectLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/connect/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disconnect Stripe account');
      }

      // Re-render the server component so it reads the freshly cleared
      // status fields and renders the Connect CTA again.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDisconnectLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {stripeFeedback && (
        <div
          className={`rounded-lg border p-4 ${
            stripeFeedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50'
              : stripeFeedback.tone === 'warning'
                ? 'border-amber-200 bg-amber-50'
                : 'border-rose-200 bg-rose-50'
          }`}
        >
          <p
            className={`font-medium ${
              stripeFeedback.tone === 'success'
                ? 'text-emerald-700'
                : stripeFeedback.tone === 'warning'
                  ? 'text-amber-700'
                  : 'text-rose-700'
            }`}
          >
            {stripeFeedback.title}
          </p>
          <p
            className={`mt-1 text-sm ${
              stripeFeedback.tone === 'success'
                ? 'text-emerald-600'
                : stripeFeedback.tone === 'warning'
                  ? 'text-amber-600'
                  : 'text-rose-600'
            }`}
          >
            {stripeFeedback.body}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <p className="font-medium text-red-600">Error</p>
              <p className="mt-1 text-sm text-red-500">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isPending && (
        <PendingCard
          accountId={stripeAccountId}
          loading={onboardingLoading}
          disconnectLoading={disconnectLoading}
          onResume={handleResumeOnboarding}
          onDisconnect={handleDisconnect}
        />
      )}

      {isRestricted && (
        <RestrictedCard
          accountId={stripeAccountId}
          chargesEnabled={stripeChargesEnabled}
          payoutsEnabled={stripePayoutsEnabled}
          onUpdate={handleResumeOnboarding}
        />
      )}

      {!isActive && !isPending && !isRestricted && (
        <ConnectCta
          loading={onboardingLoading}
          onConnect={handleStripeConnect}
        />
      )}

      {isActive && (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    Stripe Connected
                  </h3>
                  <p className="text-sm text-slate-500">
                    Account {stripeAccountId}
                    {stripeConnectedAt && (
                      <>
                        {' '}
                        · since{' '}
                        {new Date(stripeConnectedAt).toLocaleDateString()}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenDashboard}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
              >
                <ExternalLink className="h-4 w-4" />
                {loading ? 'Opening...' : 'Open Stripe Dashboard'}
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Manage your payments, payouts, balances, and account details
              through your Stripe Dashboard.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboardFeatures.map((feature) => (
              <button
                key={feature.title}
                onClick={handleOpenDashboard}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white p-5 text-left transition-all hover:border-cyan-200 hover:shadow-sm disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${feature.bg} flex-shrink-0`}
                  >
                    <feature.icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-800">
                      {feature.title}
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-cyan-600">
                  Open in Stripe Dashboard
                  <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Settings className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">
                    Payment Settings
                  </h4>
                  <p className="text-sm text-slate-500">
                    Configure Venmo, Zelle, and other payment preferences.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/settings?tab=payments"
                className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700"
              >
                Settings
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ConnectCta({
  loading,
  onConnect,
}: {
  loading: boolean;
  onConnect: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Connect Stripe to Get Started
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Connect your Stripe account to accept card payments and manage
            payouts.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <CreditCard className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-2 text-sm mb-6">
        <div className="flex items-start gap-3 text-slate-600">
          <DollarSign className="h-5 w-5 flex-shrink-0 text-cyan-600" />
          <div>
            <p className="font-medium">Accept deposits & full payments</p>
            <p className="text-slate-500">
              Collect deposits when guests book, request balance later
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-slate-600">
          <Shield className="h-5 w-5 flex-shrink-0 text-cyan-600" />
          <div>
            <p className="font-medium">Secure & PCI compliant</p>
            <p className="text-slate-500">
              Stripe handles all payment security and compliance
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-slate-600">
          <TrendingUp className="h-5 w-5 flex-shrink-0 text-cyan-600" />
          <div>
            <p className="font-medium">Fast payouts</p>
            <p className="text-slate-500">
              Get paid quickly with 2-day rolling payouts
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-slate-600">
          <Zap className="h-5 w-5 flex-shrink-0 text-cyan-600" />
          <div>
            <p className="font-medium">Automatic tax handling</p>
            <p className="text-slate-500">
              Stripe calculates and reports taxes automatically
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onConnect}
        disabled={loading}
        className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-white transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
      >
        {loading ? 'Connecting...' : 'Connect Stripe Account'}
      </button>

      <p className="mt-3 text-center text-xs text-slate-500">
        You&apos;ll be redirected to Stripe to complete onboarding. Takes about
        5 minutes.
      </p>
    </div>
  );
}

function PendingCard({
  accountId,
  loading,
  disconnectLoading,
  onResume,
  onDisconnect,
}: {
  accountId: string | null;
  loading: boolean;
  disconnectLoading: boolean;
  onResume: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-amber-900">
            Stripe onboarding in progress
          </h3>
          <p className="mt-1 text-sm text-amber-700">
            Stripe still needs more information from you to enable charges and
            payouts.
            {accountId && (
              <>
                {' '}
                Account <span className="font-mono">{accountId}</span>.
              </>
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onResume}
          disabled={loading || disconnectLoading}
          className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          Resume onboarding
        </button>
        <button
          onClick={onDisconnect}
          disabled={loading || disconnectLoading}
          className="rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
        >
          {disconnectLoading ? 'Disconnecting…' : 'Disconnect and start over'}
        </button>
      </div>
    </div>
  );
}

function RestrictedCard({
  accountId,
  chargesEnabled,
  payoutsEnabled,
  onUpdate,
}: {
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onUpdate: () => void;
}) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-rose-900">
            Account restricted
          </h3>
          <p className="mt-1 text-sm text-rose-700">
            Stripe has temporarily limited what your account can do. Update the
            requested information to restore full access.
            {accountId && (
              <>
                {' '}
                Account <span className="font-mono">{accountId}</span>.
              </>
            )}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-rose-700">
            <li>
              Charges:{' '}
              <span className="font-medium">
                {chargesEnabled ? 'enabled' : 'disabled'}
              </span>
            </li>
            <li>
              Payouts:{' '}
              <span className="font-medium">
                {payoutsEnabled ? 'enabled' : 'disabled'}
              </span>
            </li>
          </ul>
        </div>
      </div>
      <button
        onClick={onUpdate}
        className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
      >
        Update account info
      </button>
    </div>
  );
}
