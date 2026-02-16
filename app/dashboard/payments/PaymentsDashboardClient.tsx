'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';

interface PaymentsDashboardClientProps {
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
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

export function PaymentsDashboardClient({
  stripeAccountId,
  stripeOnboardingComplete,
  businessName,
  email,
}: PaymentsDashboardClientProps) {
  const [loading, setLoading] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = stripeAccountId && stripeOnboardingComplete;

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

  if (!isConnected) {
    return (
      <div className="space-y-6">
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
            onClick={handleStripeConnect}
            disabled={onboardingLoading}
            className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-white transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
          >
            {onboardingLoading ? 'Connecting...' : 'Connect Stripe Account'}
          </button>

          <p className="mt-3 text-center text-xs text-slate-500">
            You&apos;ll be redirected to Stripe to complete onboarding. Takes
            about 5 minutes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Connection Status + Open Dashboard */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Stripe Connected</h3>
              <p className="text-sm text-slate-500">
                Account {stripeAccountId}
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
          Manage your payments, payouts, balances, and account details through
          your Stripe Dashboard.
        </p>
      </div>

      {/* Feature Cards Grid */}
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
                <h4 className="font-medium text-slate-800">{feature.title}</h4>
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

      {/* Link to Payment Settings */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <Settings className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h4 className="font-medium text-slate-800">Payment Settings</h4>
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
    </div>
  );
}
