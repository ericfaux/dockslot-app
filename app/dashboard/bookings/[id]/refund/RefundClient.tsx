'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  AlertCircle,
  Info,
  ArrowLeft,
  Check,
  Calendar,
  User,
  Mail,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface RefundClientProps {
  bookingId: string;
  guestName: string;
  guestEmail: string;
  tripTitle: string;
  scheduledDate: string;
  totalPriceCents: number;
  depositPaidCents: number;
  balanceDueCents: number;
  status: string;
}

type RefundType = 'full' | 'partial' | 'deposit_only';

export function RefundClient({
  bookingId,
  guestName,
  guestEmail,
  tripTitle,
  scheduledDate,
  totalPriceCents,
  depositPaidCents,
  balanceDueCents,
  status,
}: RefundClientProps) {
  const router = useRouter();
  const [refundType, setRefundType] = useState<RefundType>('full');
  const [customAmountCents, setCustomAmountCents] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate refundable amounts
  const paidSoFar = totalPriceCents - balanceDueCents;
  const maxRefundCents = paidSoFar;

  // Calculate refund amount based on type
  const getRefundAmountCents = (): number => {
    switch (refundType) {
      case 'full':
        return maxRefundCents;
      case 'deposit_only':
        return depositPaidCents;
      case 'partial':
        return Math.min(customAmountCents, maxRefundCents);
      default:
        return 0;
    }
  };

  const refundAmountCents = getRefundAmountCents();
  const refundAmountDollars = refundAmountCents / 100;

  const handleSubmitRefund = async () => {
    if (refundAmountCents <= 0) {
      setError('Refund amount must be greater than $0');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the refund');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refund_amount_cents: refundAmountCents,
          reason: reason.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process refund');
      }

      // Success - redirect back to schedule
      router.push('/dashboard/schedule?refund=success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Schedule
      </button>

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

      {/* Booking Details Card */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          Booking Details
        </h3>
        <div className="grid gap-4 text-sm">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 flex-shrink-0 text-cyan-400" />
            <div>
              <p className="text-slate-400">Guest</p>
              <p className="font-medium text-slate-100">{guestName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 flex-shrink-0 text-cyan-400" />
            <div>
              <p className="text-slate-400">Email</p>
              <p className="font-medium text-slate-100">{guestEmail}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 flex-shrink-0 text-cyan-400" />
            <div>
              <p className="text-slate-400">Trip</p>
              <p className="font-medium text-slate-100">{tripTitle}</p>
              <p className="text-sm text-slate-400">
                {format(parseISO(scheduledDate), 'EEEE, MMMM d, yyyy • h:mm a')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          Payment Summary
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Price</span>
            <span className="font-medium text-slate-100">
              ${(totalPriceCents / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Deposit Paid</span>
            <span className="font-medium text-green-400">
              ${(depositPaidCents / 100).toFixed(2)}
            </span>
          </div>
          {balanceDueCents < totalPriceCents - depositPaidCents && (
            <div className="flex justify-between">
              <span className="text-slate-400">Balance Paid</span>
              <span className="font-medium text-green-400">
                ${((totalPriceCents - depositPaidCents - balanceDueCents) / 100).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-700 pt-3">
            <span className="font-medium text-slate-300">Total Paid</span>
            <span className="font-bold text-slate-100">
              ${(paidSoFar / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Balance Due</span>
            <span className="font-medium text-slate-300">
              ${(balanceDueCents / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Refund Options */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          Refund Amount
        </h3>

        <div className="space-y-3">
          {/* Full Refund */}
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-600 bg-slate-900/50 p-4 transition hover:bg-slate-900">
            <input
              type="radio"
              name="refundType"
              value="full"
              checked={refundType === 'full'}
              onChange={(e) => setRefundType(e.target.value as RefundType)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-100">Full Refund</span>
                <span className="font-bold text-slate-100">
                  ${(maxRefundCents / 100).toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Refund entire amount paid
              </p>
            </div>
          </label>

          {/* Deposit Only */}
          {depositPaidCents > 0 && (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-600 bg-slate-900/50 p-4 transition hover:bg-slate-900">
              <input
                type="radio"
                name="refundType"
                value="deposit_only"
                checked={refundType === 'deposit_only'}
                onChange={(e) => setRefundType(e.target.value as RefundType)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-100">
                    Deposit Only
                  </span>
                  <span className="font-bold text-slate-100">
                    ${(depositPaidCents / 100).toFixed(2)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  Refund deposit, keep balance payment
                </p>
              </div>
            </label>
          )}

          {/* Partial Refund */}
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-600 bg-slate-900/50 p-4 transition hover:bg-slate-900">
            <input
              type="radio"
              name="refundType"
              value="partial"
              checked={refundType === 'partial'}
              onChange={(e) => setRefundType(e.target.value as RefundType)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-slate-100">
                  Partial Refund
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">$</span>
                <input
                  type="number"
                  min="0"
                  max={maxRefundCents / 100}
                  step="0.01"
                  value={customAmountCents / 100}
                  onChange={(e) =>
                    setCustomAmountCents(Math.round(parseFloat(e.target.value || '0') * 100))
                  }
                  disabled={refundType !== 'partial'}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 disabled:opacity-50"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Max: ${(maxRefundCents / 100).toFixed(2)}
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Refund Reason */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          Refund Reason
        </h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Weather cancellation, customer request, equipment failure..."
          rows={4}
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          required
        />
        <p className="mt-2 text-xs text-slate-400">
          This will be recorded in the audit log and included in the refund notification email
        </p>
      </div>

      {/* Warning Box */}
      <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 flex-shrink-0 text-yellow-400" />
          <div className="text-sm">
            <p className="font-medium text-yellow-400">Important</p>
            <ul className="mt-2 space-y-1 text-yellow-300/90">
              <li>• Refunds are processed immediately via Stripe</li>
              <li>• Guest will receive an email notification</li>
              <li>• This action cannot be undone</li>
              <li>• Stripe fees (2.9% + $0.30) are not refunded</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => router.back()}
          disabled={loading}
          className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-6 py-4 font-semibold text-slate-100 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmitRefund}
          disabled={loading || refundAmountCents <= 0 || !reason.trim()}
          className="flex-1 rounded-lg bg-red-500 px-6 py-4 font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
        >
          {loading ? (
            'Processing...'
          ) : (
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="h-5 w-5" />
              Issue Refund (${refundAmountDollars.toFixed(2)})
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
