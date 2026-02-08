'use client';

import { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  Building2,
  ExternalLink,
  CheckCircle,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { StripeCheckoutButton } from '@/components/booking/StripeCheckoutButton';
import { formatCents, formatDollars } from '@/lib/utils/format';

type PaymentMethodType = 'stripe' | 'venmo' | 'zelle';

interface PaymentMethodSelectorProps {
  bookingId: string;
  depositAmount: number; // dollars
  totalPriceCents: number;
  shortId: string; // e.g., "DK-A3F2"
  stripeConnected: boolean;
  venmoEnabled: boolean;
  venmoUsername: string | null;
  zelleEnabled: boolean;
  zelleContact: string | null;
  captainId: string;
  tripTypeId: string;
}

export function PaymentMethodSelector({
  bookingId,
  depositAmount,
  totalPriceCents,
  shortId,
  stripeConnected,
  venmoEnabled,
  venmoUsername,
  zelleEnabled,
  zelleContact,
  captainId,
  tripTypeId,
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
  const [paymentSent, setPaymentSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const paymentNote = `DockSlot Booking #${shortId}`;
  const amountToSend = depositAmount > 0 ? formatDollars(depositAmount) : formatCents(totalPriceCents);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCompleteBooking = async () => {
    if (!selectedMethod || selectedMethod === 'stripe') return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/bookings/complete-alt-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          paymentMethod: selectedMethod,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete booking');
      }

      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completed) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-600" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Booking Submitted!</h3>
        <p className="text-sm text-slate-600">
          Your booking is confirmed pending payment verification. The captain will verify your{' '}
          {selectedMethod === 'venmo' ? 'Venmo' : 'Zelle'} payment and you&apos;ll receive a confirmation email.
        </p>
      </div>
    );
  }

  const availableMethods: { type: PaymentMethodType; available: boolean }[] = [
    { type: 'stripe', available: stripeConnected },
    { type: 'venmo', available: venmoEnabled && !!venmoUsername },
    { type: 'zelle', available: zelleEnabled && !!zelleContact },
  ];

  const hasMultipleMethods = availableMethods.filter(m => m.available).length > 1;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
        Choose Payment Method
      </h3>

      {/* Payment Method Cards */}
      <div className="space-y-3">
        {/* Stripe Card */}
        {stripeConnected && (
          <button
            onClick={() => { setSelectedMethod('stripe'); setPaymentSent(false); }}
            className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
              selectedMethod === 'stripe'
                ? 'border-cyan-500 bg-cyan-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                selectedMethod === 'stripe' ? 'bg-cyan-100' : 'bg-slate-100'
              }`}>
                <CreditCard className={`h-5 w-5 ${selectedMethod === 'stripe' ? 'text-cyan-600' : 'text-slate-500'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Pay with Card</p>
                <p className="text-xs text-slate-500">Secure payment via Stripe — auto-confirms</p>
              </div>
              {selectedMethod === 'stripe' && (
                <CheckCircle className="h-5 w-5 text-cyan-600" />
              )}
            </div>
          </button>
        )}

        {/* Venmo Card */}
        {venmoEnabled && venmoUsername && (
          <button
            onClick={() => { setSelectedMethod('venmo'); setPaymentSent(false); }}
            className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
              selectedMethod === 'venmo'
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                selectedMethod === 'venmo' ? 'bg-blue-100' : 'bg-slate-100'
              }`}>
                <Smartphone className={`h-5 w-5 ${selectedMethod === 'venmo' ? 'text-blue-600' : 'text-slate-500'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Pay with Venmo</p>
                <p className="text-xs text-slate-500">Send via Venmo — captain verifies</p>
              </div>
              {selectedMethod === 'venmo' && (
                <CheckCircle className="h-5 w-5 text-blue-600" />
              )}
            </div>
          </button>
        )}

        {/* Zelle Card */}
        {zelleEnabled && zelleContact && (
          <button
            onClick={() => { setSelectedMethod('zelle'); setPaymentSent(false); }}
            className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
              selectedMethod === 'zelle'
                ? 'border-purple-500 bg-purple-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                selectedMethod === 'zelle' ? 'bg-purple-100' : 'bg-slate-100'
              }`}>
                <Building2 className={`h-5 w-5 ${selectedMethod === 'zelle' ? 'text-purple-600' : 'text-slate-500'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Pay with Zelle</p>
                <p className="text-xs text-slate-500">Send via your banking app — captain verifies</p>
              </div>
              {selectedMethod === 'zelle' && (
                <CheckCircle className="h-5 w-5 text-purple-600" />
              )}
            </div>
          </button>
        )}
      </div>

      {/* Stripe Payment - Show existing checkout button */}
      {selectedMethod === 'stripe' && (
        <div className="mt-4">
          <StripeCheckoutButton
            bookingId={bookingId}
            depositAmount={depositAmount}
          />
        </div>
      )}

      {/* Venmo Instructions */}
      {selectedMethod === 'venmo' && venmoUsername && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-5 space-y-4">
          <h4 className="text-sm font-semibold text-blue-900">Venmo Payment Instructions</h4>

          {/* Username */}
          <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-blue-100">
            <div>
              <p className="text-xs text-slate-500">Send to</p>
              <p className="text-lg font-bold text-blue-700">@{venmoUsername.replace(/^@/, '')}</p>
            </div>
            <button
              onClick={() => handleCopy(`@${venmoUsername.replace(/^@/, '')}`, 'username')}
              className="rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200 transition-colors"
            >
              {copied === 'username' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-blue-100">
            <div>
              <p className="text-xs text-slate-500">Amount</p>
              <p className="text-lg font-bold text-slate-900">{amountToSend}</p>
            </div>
          </div>

          {/* Payment Note */}
          <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-blue-100">
            <div>
              <p className="text-xs text-slate-500">Required payment note</p>
              <p className="text-sm font-medium text-slate-900">{paymentNote}</p>
            </div>
            <button
              onClick={() => handleCopy(paymentNote, 'note')}
              className="rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200 transition-colors"
            >
              {copied === 'note' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {/* Open Venmo */}
          <a
            href={`https://venmo.com/u/${venmoUsername.replace(/^@/, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Open Venmo
          </a>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer rounded-lg bg-white p-3 border border-blue-100">
            <input
              type="checkbox"
              checked={paymentSent}
              onChange={(e) => setPaymentSent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">
              I have sent the payment of {amountToSend} via Venmo
            </span>
          </label>

          {error && (
            <p className="text-sm text-rose-600">{error}</p>
          )}

          {/* Complete Booking Button */}
          <button
            onClick={handleCompleteBooking}
            disabled={!paymentSent || isSubmitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Complete Booking
          </button>
        </div>
      )}

      {/* Zelle Instructions */}
      {selectedMethod === 'zelle' && zelleContact && (
        <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-5 space-y-4">
          <h4 className="text-sm font-semibold text-purple-900">Zelle Payment Instructions</h4>

          {/* Contact */}
          <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-purple-100">
            <div>
              <p className="text-xs text-slate-500">Send Zelle to</p>
              <p className="text-lg font-bold text-purple-700">{zelleContact}</p>
            </div>
            <button
              onClick={() => handleCopy(zelleContact, 'contact')}
              className="rounded-lg bg-purple-100 p-2 text-purple-600 hover:bg-purple-200 transition-colors"
            >
              {copied === 'contact' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-purple-100">
            <div>
              <p className="text-xs text-slate-500">Amount</p>
              <p className="text-lg font-bold text-slate-900">{amountToSend}</p>
            </div>
          </div>

          {/* Memo */}
          <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-purple-100">
            <div>
              <p className="text-xs text-slate-500">Required memo</p>
              <p className="text-sm font-medium text-slate-900">{paymentNote}</p>
            </div>
            <button
              onClick={() => handleCopy(paymentNote, 'memo')}
              className="rounded-lg bg-purple-100 p-2 text-purple-600 hover:bg-purple-200 transition-colors"
            >
              {copied === 'memo' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {/* Instructions */}
          <div className="rounded-lg bg-white p-3 border border-purple-100">
            <p className="text-sm text-slate-600">
              Open your banking app and send {amountToSend} via Zelle to{' '}
              <strong>{zelleContact}</strong>. Include the booking reference in the memo.
            </p>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer rounded-lg bg-white p-3 border border-purple-100">
            <input
              type="checkbox"
              checked={paymentSent}
              onChange={(e) => setPaymentSent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-slate-700">
              I have sent the payment of {amountToSend} via Zelle
            </span>
          </label>

          {error && (
            <p className="text-sm text-rose-600">{error}</p>
          )}

          {/* Complete Booking Button */}
          <button
            onClick={handleCompleteBooking}
            disabled={!paymentSent || isSubmitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Complete Booking
          </button>
        </div>
      )}
    </div>
  );
}
