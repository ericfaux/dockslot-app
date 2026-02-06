'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Users,
  Ship,
  Edit2,
  CloudRain,
  XCircle,
  DollarSign,
  CheckCircle,
  MoreHorizontal,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { BookingWithDetails } from '@/lib/db/types';
import StatusBadge, { PaymentBadge } from '@/app/dashboard/components/StatusBadge';

interface BookingHeaderProps {
  booking: BookingWithDetails;
  onRefresh: () => void;
}

export function BookingHeader({ booking, onRefresh }: BookingHeaderProps) {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const scheduledDate = parseISO(booking.scheduled_start);
  const scheduledEndDate = parseISO(booking.scheduled_end);
  const isUpcoming = scheduledDate > new Date();
  const canModify = ['pending_deposit', 'confirmed', 'weather_hold', 'rescheduled'].includes(booking.status);

  const handleWeatherHold = async () => {
    if (!confirm('Set this booking to weather hold? The guest will be notified.')) {
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/weather-hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Weather conditions unsafe for departure' }),
      });

      if (!response.ok) {
        throw new Error('Failed to set weather hold');
      }

      onRefresh();
      setShowActions(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to set weather hold');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this booking? This action cannot be undone.')) {
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      onRefresh();
      setShowActions(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm('Mark this trip as completed?')) {
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete booking');
      }

      onRefresh();
      setShowActions(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to complete booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicate = () => {
    router.push(`/dashboard/bookings/${booking.id}/duplicate`);
  };

  return (
    <section
      aria-label="Booking Header"
      className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-6 print:border-slate-300 print:bg-white"
    >
      {/* Error Alert */}
      {actionError && (
        <div className="mb-4 flex items-center gap-2 rounded border border-rose-500/50 bg-rose-50 p-3 text-sm text-rose-600">
          <XCircle className="h-4 w-4" />
          {actionError}
          <button
            onClick={() => setActionError(null)}
            className="ml-auto hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left Side - Trip Info */}
        <div className="space-y-4">
          {/* Status and Payment Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={booking.status} size="lg" />
            <PaymentBadge status={booking.payment_status} size="lg" />
            {booking.weather_hold_reason && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-600">
                <CloudRain className="h-4 w-4" />
                Weather Hold
              </span>
            )}
          </div>

          {/* Trip Type */}
          <div>
            <h1 className="text-2xl font-bold text-slate-800 print:text-black">
              {booking.trip_type?.title || 'Charter Trip'}
            </h1>
            {booking.vessel && (
              <div className="mt-1 flex items-center gap-2 text-slate-400 print:text-slate-600">
                <Ship className="h-4 w-4" />
                <span>{booking.vessel.name}</span>
              </div>
            )}
          </div>

          {/* Date/Time and Party Size */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-600 print:text-slate-700">
              <Calendar className="h-4 w-4 text-cyan-600 print:text-cyan-600" />
              <span className="font-medium">
                {format(scheduledDate, 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 print:text-slate-700">
              <Clock className="h-4 w-4 text-cyan-600 print:text-cyan-600" />
              <span>
                {format(scheduledDate, 'h:mm a')} - {format(scheduledEndDate, 'h:mm a')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 print:text-slate-700">
              <Users className="h-4 w-4 text-cyan-600 print:text-cyan-600" />
              <span>{booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}</span>
            </div>
          </div>

          {/* Original Date (if rescheduled) */}
          {booking.original_date_if_rescheduled && (
            <div className="flex items-center gap-2 rounded bg-blue-500/10 px-3 py-2 text-sm text-blue-300">
              <Calendar className="h-4 w-4" />
              <span>
                Originally scheduled: {format(parseISO(booking.original_date_if_rescheduled), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {/* Weather Hold Reason */}
          {booking.weather_hold_reason && (
            <div className="flex items-center gap-2 rounded bg-amber-50 px-3 py-2 text-sm text-amber-600">
              <CloudRain className="h-4 w-4" />
              <span>{booking.weather_hold_reason}</span>
            </div>
          )}
        </div>

        {/* Right Side - Quick Actions */}
        <div className="relative flex flex-wrap gap-2 print:hidden">
          {/* Primary Actions */}
          {canModify && (
            <>
              <button
                onClick={() => router.push(`/dashboard/schedule?booking=${booking.id}`)}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>

              {booking.status !== 'weather_hold' && ['confirmed', 'rescheduled'].includes(booking.status) && (
                <button
                  onClick={handleWeatherHold}
                  disabled={isProcessing}
                  className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-50"
                >
                  <CloudRain className="h-4 w-4" />
                  Weather Hold
                </button>
              )}

              {['confirmed', 'rescheduled'].includes(booking.status) && (
                <button
                  onClick={handleComplete}
                  disabled={isProcessing}
                  className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Complete
                </button>
              )}
            </>
          )}

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-2 shadow-xl">
                  <button
                    onClick={handleDuplicate}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-600 hover:bg-white"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate Booking
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/bookings/${booking.id}/refund`)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-600 hover:bg-white"
                    disabled={booking.deposit_paid_cents === 0}
                  >
                    <DollarSign className="h-4 w-4" />
                    Issue Refund
                  </button>
                  <a
                    href={`/dashboard/schedule?date=${format(scheduledDate, 'yyyy-MM-dd')}`}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-600 hover:bg-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Calendar
                  </a>
                  {canModify && (
                    <>
                      <div className="my-2 border-t border-slate-200" />
                      <button
                        onClick={handleCancel}
                        disabled={isProcessing}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-rose-600 hover:bg-white disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel Booking
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Price Summary Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 print:border-slate-300">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-slate-500">Total</span>
            <div className="font-mono text-lg font-semibold text-slate-700 print:text-black">
              ${(booking.total_price_cents / 100).toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Deposit Paid</span>
            <div className="font-mono text-lg font-semibold text-emerald-600 print:text-emerald-600">
              ${(booking.deposit_paid_cents / 100).toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Balance Due</span>
            <div className={`font-mono text-lg font-semibold ${
              booking.balance_due_cents > 0
                ? 'text-amber-600 print:text-amber-600'
                : 'text-emerald-600 print:text-emerald-600'
            }`}>
              ${(booking.balance_due_cents / 100).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Balance Status Badge */}
        <div className="print:hidden">
          {booking.payment_status === 'fully_paid' ? (
            <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              Paid in Full
            </span>
          ) : booking.payment_status === 'deposit_paid' ? (
            <span className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-600">
              <DollarSign className="h-4 w-4" />
              ${(booking.balance_due_cents / 100).toFixed(2)} balance due
            </span>
          ) : (
            <span className="flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600">
              <DollarSign className="h-4 w-4" />
              Deposit pending
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
