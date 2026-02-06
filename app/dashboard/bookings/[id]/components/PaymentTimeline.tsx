'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  CreditCard,
  Check,
  Clock,
  DollarSign,
  RotateCcw,
  Send,
  Banknote,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { BookingWithDetails, Payment } from '@/lib/db/types';

interface PaymentTimelineProps {
  booking: BookingWithDetails;
  payments: Payment[];
  isLoading: boolean;
  onRefresh: () => void;
}

interface TimelineEvent {
  id: string;
  type: 'deposit_requested' | 'deposit_paid' | 'balance_requested' | 'balance_paid' | 'refund';
  label: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  stripeId?: string;
}

export function PaymentTimeline({ booking, payments, isLoading, onRefresh }: PaymentTimelineProps) {
  const [isRequestingBalance, setIsRequestingBalance] = useState(false);
  const [isRecordingCash, setIsRecordingCash] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Build timeline events from payments and booking state
  const buildTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Deposit requested (always first event - when booking was created)
    events.push({
      id: 'deposit_requested',
      type: 'deposit_requested',
      label: 'Deposit requested',
      amount: booking.trip_type?.deposit_amount || Math.round(booking.total_price_cents / 2),
      date: booking.created_at,
      status: 'completed',
    });

    // Process actual payment records
    payments.forEach((payment) => {
      if (payment.payment_type === 'deposit' && payment.status === 'succeeded') {
        events.push({
          id: `deposit_paid_${payment.id}`,
          type: 'deposit_paid',
          label: 'Deposit paid',
          amount: payment.amount_cents,
          date: payment.created_at,
          status: 'completed',
          stripeId: payment.stripe_payment_intent_id || undefined,
        });
      } else if (payment.payment_type === 'balance' && payment.status === 'succeeded') {
        events.push({
          id: `balance_paid_${payment.id}`,
          type: 'balance_paid',
          label: 'Balance paid',
          amount: payment.amount_cents,
          date: payment.created_at,
          status: 'completed',
          stripeId: payment.stripe_payment_intent_id || undefined,
        });
      } else if (payment.payment_type === 'refund' && payment.status === 'succeeded') {
        events.push({
          id: `refund_${payment.id}`,
          type: 'refund',
          label: 'Refund issued',
          amount: payment.amount_cents,
          date: payment.created_at,
          status: 'completed',
          stripeId: payment.stripe_refund_id || undefined,
        });
      }
    });

    // Add pending states if applicable
    if (booking.payment_status === 'unpaid') {
      events.push({
        id: 'deposit_pending',
        type: 'deposit_paid',
        label: 'Awaiting deposit',
        amount: booking.trip_type?.deposit_amount || Math.round(booking.total_price_cents / 2),
        date: '',
        status: 'pending',
      });
    }

    // Sort by date (pending items at the end)
    return events.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  };

  const handleRequestBalance = async () => {
    setIsRequestingBalance(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/request-balance`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send balance request');
      }

      setSuccess('Balance payment request sent to guest');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request balance');
    } finally {
      setIsRequestingBalance(false);
    }
  };

  const handleRecordCash = async () => {
    const amount = parseFloat(cashAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: Math.round(amount * 100),
          payment_type: 'balance',
          notes: 'Cash payment recorded by captain',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to record payment');
      }

      setSuccess('Cash payment recorded');
      setCashAmount('');
      setIsRecordingCash(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    }
  };

  const timelineEvents = buildTimelineEvents();

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'deposit_requested':
        return <Clock className="h-4 w-4" />;
      case 'deposit_paid':
        return event.status === 'completed' ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
      case 'balance_requested':
        return <Send className="h-4 w-4" />;
      case 'balance_paid':
        return <Check className="h-4 w-4" />;
      case 'refund':
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getEventColors = (event: TimelineEvent) => {
    if (event.status === 'pending') {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-500/50',
        text: 'text-amber-600',
        icon: 'text-amber-600',
      };
    }
    if (event.type === 'refund') {
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-500/50',
        text: 'text-purple-600',
        icon: 'text-purple-600',
      };
    }
    return {
      bg: 'bg-emerald-50',
      border: 'border-emerald-500/50',
      text: 'text-emerald-600',
      icon: 'text-emerald-600',
    };
  };

  return (
    <section
      aria-label="Payment Timeline"
      className="rounded-lg border border-slate-200 bg-white p-6 print:border-slate-300 print:bg-white"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-600 print:text-cyan-600">
          <CreditCard className="h-5 w-5" />
          Payment Timeline
        </h2>

        {/* Balance Status Badge */}
        {booking.payment_status === 'fully_paid' ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">
            <CheckCircle className="h-4 w-4" />
            Paid in Full
          </span>
        ) : booking.payment_status === 'deposit_paid' && booking.balance_due_cents > 0 ? (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-600">
            <DollarSign className="h-4 w-4" />
            ${(booking.balance_due_cents / 100).toFixed(2)} due
          </span>
        ) : booking.payment_status === 'unpaid' ? (
          <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-600">
            <XCircle className="h-4 w-4" />
            Deposit pending
          </span>
        ) : null}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded border border-rose-500/50 bg-rose-50 p-3 text-sm text-rose-600">
          <AlertCircle className="h-4 w-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto hover:underline">
            Dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded border border-emerald-500/50 bg-emerald-50 p-3 text-sm text-emerald-600">
          <CheckCircle className="h-4 w-4" />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Timeline */}
          <div className="space-y-4">
            {timelineEvents.map((event, index) => {
              const colors = getEventColors(event);
              return (
                <div key={event.id} className="flex gap-4">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${colors.bg} ${colors.icon}`}
                    >
                      {getEventIcon(event)}
                    </div>
                    {index < timelineEvents.length - 1 && (
                      <div className="h-full w-px bg-slate-100" />
                    )}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={`font-medium ${colors.text}`}>{event.label}</h4>
                        {event.date && (
                          <p className="text-sm text-slate-500">
                            {format(parseISO(event.date), 'MMM d, yyyy • h:mm a')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono text-lg font-semibold ${
                            event.type === 'refund' ? 'text-purple-600' : colors.text
                          }`}
                        >
                          {event.type === 'refund' ? '-' : ''}${(event.amount / 100).toFixed(2)}
                        </span>
                        {event.status === 'completed' && (
                          <span className="ml-2 text-emerald-600">
                            <Check className="inline h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          {booking.payment_status !== 'fully_paid' &&
            booking.payment_status !== 'fully_refunded' &&
            booking.status !== 'cancelled' && (
              <div className="mt-6 border-t border-slate-200 pt-4 print:hidden">
                <div className="flex flex-wrap gap-3">
                  {booking.payment_status === 'deposit_paid' && booking.balance_due_cents > 0 && (
                    <button
                      onClick={handleRequestBalance}
                      disabled={isRequestingBalance}
                      className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {isRequestingBalance ? 'Sending...' : 'Request Balance'}
                    </button>
                  )}

                  <button
                    onClick={() => setIsRecordingCash(!isRecordingCash)}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <Banknote className="h-4 w-4" />
                    Record Cash Payment
                  </button>
                </div>

                {/* Cash Payment Form */}
                {isRecordingCash && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                    <h4 className="mb-3 text-sm font-medium text-slate-600">
                      Record Cash Payment
                    </h4>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                          $
                        </span>
                        <input
                          type="number"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-7 pr-3 text-slate-700 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={handleRecordCash}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        Record
                      </button>
                      <button
                        onClick={() => {
                          setIsRecordingCash(false);
                          setCashAmount('');
                        }}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Refund Link */}
          {booking.deposit_paid_cents > 0 && booking.payment_status !== 'fully_refunded' && (
            <div className="mt-4 text-center print:hidden">
              <a
                href={`/dashboard/bookings/${booking.id}/refund`}
                className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
              >
                Issue Refund
              </a>
            </div>
          )}
        </>
      )}
    </section>
  );
}
