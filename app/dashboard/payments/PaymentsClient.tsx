'use client';

import { useState } from 'react';
import {
  CreditCard,
  Check,
  AlertCircle,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Shield,
  Zap,
} from 'lucide-react';

interface PaymentsClientProps {
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
  businessName: string;
  email: string;
}

export function PaymentsClient({
  stripeAccountId,
  stripeOnboardingComplete,
  businessName,
  email,
}: PaymentsClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = stripeAccountId && stripeOnboardingComplete;

  const handleStripeConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start Stripe onboarding');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Connect onboarding
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const handleReturnToDashboard = async () => {
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

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
            <div>
              <p className="font-medium text-red-400">Error</p>
              <p className="mt-1 text-sm text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              Stripe Account Status
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {isConnected
                ? 'Your Stripe account is connected and ready to accept payments'
                : 'Connect your Stripe account to start accepting payments'}
            </p>
          </div>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isConnected
                ? 'bg-green-500/20 text-green-400'
                : 'bg-slate-700 text-slate-500'
            }`}
          >
            {isConnected ? (
              <Check className="h-5 w-5" />
            ) : (
              <CreditCard className="h-5 w-5" />
            )}
          </div>
        </div>

        {isConnected ? (
          <div className="space-y-4">
            {/* Account Details */}
            <div className="rounded-lg bg-slate-900/50 p-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Account ID</span>
                  <span className="font-mono text-slate-200">
                    {stripeAccountId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="flex items-center gap-2 text-green-400">
                    <Check className="h-4 w-4" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReturnToDashboard}
                disabled={loading}
                className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-sm font-medium text-slate-100 transition-all hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open Stripe Dashboard
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Benefits List */}
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3 text-slate-300">
                <DollarSign className="h-5 w-5 flex-shrink-0 text-cyan-400" />
                <div>
                  <p className="font-medium">Accept deposits & full payments</p>
                  <p className="text-slate-500">
                    Collect deposits when guests book, request balance later
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-slate-300">
                <Shield className="h-5 w-5 flex-shrink-0 text-cyan-400" />
                <div>
                  <p className="font-medium">Secure & PCI compliant</p>
                  <p className="text-slate-500">
                    Stripe handles all payment security and compliance
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-slate-300">
                <TrendingUp className="h-5 w-5 flex-shrink-0 text-cyan-400" />
                <div>
                  <p className="font-medium">Fast payouts</p>
                  <p className="text-slate-500">
                    Get paid quickly with 2-day rolling payouts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-slate-300">
                <Zap className="h-5 w-5 flex-shrink-0 text-cyan-400" />
                <div>
                  <p className="font-medium">Automatic tax handling</p>
                  <p className="text-slate-500">
                    Stripe calculates and reports taxes automatically
                  </p>
                </div>
              </div>
            </div>

            {/* Connect Button */}
            <button
              onClick={handleStripeConnect}
              disabled={loading}
              className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-900 transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Connecting...' : 'Connect Stripe Account'}
            </button>

            <p className="text-center text-xs text-slate-500">
              You'll be redirected to Stripe to complete onboarding
            </p>
          </div>
        )}
      </div>

      {/* Pricing Info */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          Stripe Pricing
        </h3>
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Per transaction</span>
            <span className="font-medium">2.9% + $0.30</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Refunds</span>
            <span className="font-medium">$0.30 fee returned</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Payout schedule</span>
            <span className="font-medium">2-day rolling</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Setup fee</span>
            <span className="font-medium text-green-400">$0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Monthly fee</span>
            <span className="font-medium text-green-400">$0</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Standard Stripe pricing. No additional DockSlot fees on payments.
        </p>
      </div>

      {/* Help Card */}
      {!isConnected && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h3 className="mb-2 text-lg font-semibold text-slate-100">
            Need Help?
          </h3>
          <p className="mb-4 text-sm text-slate-400">
            The onboarding process takes about 5 minutes. You'll need:
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 text-cyan-400" />
              Business or personal information (name, address)
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 text-cyan-400" />
              Tax ID (SSN or EIN)
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 text-cyan-400" />
              Bank account details for payouts
            </li>
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            All information is securely handled by Stripe. DockSlot never sees
            your sensitive banking details.
          </p>
        </div>
      )}
    </div>
  );
}
