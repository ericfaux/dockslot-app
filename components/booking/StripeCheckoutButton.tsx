'use client';

import { useState } from 'react';
import { CreditCard } from 'lucide-react';

interface StripeCheckoutButtonProps {
  bookingId: string;
  depositAmount: number;
}

export function StripeCheckoutButton({ bookingId, depositAmount }: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create Stripe Checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to start checkout. Please try again.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full rounded-lg bg-cyan-500 px-6 py-4 font-semibold text-slate-900 transition-all hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-slate-900"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading checkout...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            <span>Pay ${(depositAmount / 100).toFixed(2)} Deposit</span>
          </>
        )}
      </button>

      <div className="mt-3 text-center text-xs text-slate-500">
        Powered by Stripe • Secure payment processing
      </div>
    </div>
  );
}
