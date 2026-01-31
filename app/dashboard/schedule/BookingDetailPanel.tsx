'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  X,
  Users,
  Clock,
  Ship,
  Mail,
  Phone,
  CreditCard,
  CloudRain,
  CheckCircle,
  XCircle,
  Navigation,
  AlertCircle,
  CalendarClock,
  DollarSign,
  RotateCcw,
} from 'lucide-react';
import { CalendarBooking, STATUS_COLORS, STATUS_LABELS, WeatherHoldModal, RescheduleOffers } from '@/components/calendar';
import {
  cancelBooking,
  markNoShow,
  completeBooking,
  setWeatherHold,
  clearWeatherHold,
  createRescheduleOffers,
} from '@/app/actions/bookings';
import BookingNotesEditor from '../components/BookingNotesEditor';
import BookingTimeline from '../components/BookingTimeline';

interface BookingDetailPanelProps {
  booking: CalendarBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

type ActionType = 'complete' | 'cancel' | 'no_show' | 'clear_weather';

interface RescheduleSlot {
  date: string;
  startTime: string;
  endTime: string;
}

/**
 * BookingDetailPanel - Slide-over panel showing booking details and actions
 */

export function BookingDetailPanel({
  booking,
  isOpen,
  onClose,
  onUpdated,
}: BookingDetailPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [isWeatherPending, setIsWeatherPending] = useState(false);
  const [isRequestingBalance, setIsRequestingBalance] = useState(false);
  const [balanceSuccess, setBalanceSuccess] = useState(false);

  if (!booking) return null;

  const colors = STATUS_COLORS[booking.status];
  const statusLabel = STATUS_LABELS[booking.status];

  const formatTime = (isoString: string): string => {
    try {
      return format(parseISO(isoString), 'h:mm a');
    } catch {
      return '';
    }
  };

  const formatDate = (isoString: string): string => {
    try {
      return format(parseISO(isoString), 'EEEE, MMMM d, yyyy');
    } catch {
      return '';
    }
  };

  const handleAction = async (action: ActionType) => {
    setActionError(null);

    startTransition(async () => {
      try {
        let result;

        switch (action) {
          case 'complete':
            result = await completeBooking(booking.id);
            break;
          case 'cancel':
            result = await cancelBooking(booking.id, 'Cancelled by captain');
            break;
          case 'no_show':
            result = await markNoShow(booking.id);
            break;
          case 'clear_weather':
            result = await clearWeatherHold(booking.id);
            break;
        }

        if (result && !result.success) {
          setActionError(result.error || 'Action failed');
        } else {
          onUpdated();
        }
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  const handleWeatherHold = async (reason: string, slots: RescheduleSlot[]) => {
    setActionError(null);
    setIsWeatherPending(true);

    try {
      // First set the weather hold
      const holdResult = await setWeatherHold(booking.id, reason);
      if (!holdResult.success) {
        setActionError(holdResult.error || 'Failed to set weather hold');
        setIsWeatherPending(false);
        return;
      }

      // Then create reschedule offers
      const formattedSlots = slots.map(slot => ({
        start: `${slot.date}T${slot.startTime}:00`,
        end: `${slot.date}T${slot.endTime}:00`,
      }));

      const offersResult = await createRescheduleOffers(booking.id, formattedSlots);
      if (!offersResult.success) {
        setActionError(offersResult.error || 'Weather hold set, but failed to create reschedule offers');
        setIsWeatherPending(false);
        setShowWeatherModal(false);
        onUpdated();
        return;
      }

      setIsWeatherPending(false);
      setShowWeatherModal(false);
      onUpdated();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'An error occurred');
      setIsWeatherPending(false);
    }
  };

  const handleRequestBalancePayment = async () => {
    setIsRequestingBalance(true);
    setActionError(null);
    setBalanceSuccess(false);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/request-balance`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send balance payment request');
      }

      setBalanceSuccess(true);
      setTimeout(() => setBalanceSuccess(false), 3000);
      onUpdated();
    } catch (error) {
      console.error('Balance request error:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to request balance payment');
    } finally {
      setIsRequestingBalance(false);
    }
  };

  // Determine available actions based on status
  const canComplete = ['confirmed', 'rescheduled'].includes(booking.status);
  const canCancel = ['pending_deposit', 'confirmed', 'weather_hold', 'rescheduled'].includes(booking.status);
  const canMarkNoShow = ['confirmed', 'rescheduled'].includes(booking.status);
  const canSetWeatherHold = ['confirmed', 'rescheduled'].includes(booking.status);
  const canClearWeatherHold = booking.status === 'weather_hold';
  const canRequestBalance = (booking.payment_status === 'deposit_paid') && ['confirmed', 'rescheduled'].includes(booking.status);
  const canRefund = ['deposit_paid', 'fully_paid'].includes(booking.payment_status || '') && !['completed', 'cancelled'].includes(booking.status);
  const isTerminal = ['completed', 'cancelled', 'no_show'].includes(booking.status);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed bottom-0 right-0 top-0 z-50 w-full max-w-md transform overflow-y-auto bg-slate-900 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-700/50 bg-slate-900 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-mono text-lg font-bold text-slate-100">
                {booking.guest_name}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
                <span className={`text-sm ${colors.text}`}>{statusLabel}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Date & Time */}
          <div className="rounded-lg bg-slate-800/50 p-4">
            <div className="mb-3 font-mono text-sm font-medium text-slate-400">
              {formatDate(booking.scheduled_start)}
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-cyan-400" />
              <span className="font-mono text-xl font-bold text-slate-100">
                {formatTime(booking.scheduled_start)} - {formatTime(booking.scheduled_end)}
              </span>
            </div>
          </div>

          {/* Trip Details */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500">
              Trip Details
            </h3>

            {booking.trip_type && (
              <div className="flex items-center gap-3 text-slate-300">
                <Navigation className="h-4 w-4 text-slate-500" />
                <span>{booking.trip_type.title}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-slate-300">
              <Users className="h-4 w-4 text-slate-500" />
              <span>{booking.party_size} guests</span>
            </div>

            {booking.vessel && (
              <div className="flex items-center gap-3 text-slate-300">
                <Ship className="h-4 w-4 text-slate-500" />
                <span>{booking.vessel.name}</span>
              </div>
            )}
          </div>

          {/* Payment Status */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500">
              Payment
            </h3>
            <div className="flex items-center gap-3">
              <CreditCard
                className={`h-4 w-4 ${
                  booking.payment_status === 'fully_paid'
                    ? 'text-emerald-400'
                    : booking.payment_status === 'deposit_paid'
                    ? 'text-amber-400'
                    : 'text-slate-500'
                }`}
              />
              <span
                className={
                  booking.payment_status === 'fully_paid'
                    ? 'text-emerald-400'
                    : booking.payment_status === 'deposit_paid'
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }
              >
                {booking.payment_status === 'fully_paid'
                  ? 'Fully Paid'
                  : booking.payment_status === 'deposit_paid'
                  ? 'Deposit Paid'
                  : 'Unpaid'}
              </span>
            </div>
          </div>

          {/* Captain's Notes & Tags */}
          <BookingNotesEditor
            bookingId={booking.id}
            initialNotes={booking.captain_notes || null}
            initialTags={booking.tags || []}
            onUpdate={onUpdated}
          />

          {/* Booking Timeline */}
          <BookingTimeline bookingId={booking.id} />

          {/* Reschedule Offers (for weather hold) */}
          {booking.status === 'weather_hold' && (
            <div className="space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500">
                <CloudRain className="inline h-3.5 w-3.5 mr-1.5" />
                Weather Hold Status
              </h3>
              <RescheduleOffers
                bookingId={booking.id}
                weatherHoldReason={booking.weather_hold_reason}
              />
            </div>
          )}

          {/* Error Message */}
          {actionError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Weather Hold Modal */}
          {showWeatherModal && (
            <WeatherHoldModal
              booking={booking}
              isOpen={showWeatherModal}
              onClose={() => setShowWeatherModal(false)}
              onSubmit={handleWeatherHold}
              isPending={isWeatherPending}
            />
          )}

          {/* Actions */}
          {!isTerminal && (
            <div className="space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500">
                Actions
              </h3>

              {/* Primary Action: Complete/Depart */}
              {canComplete && (
                <button
                  onClick={() => handleAction('complete')}
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500/20 px-6 py-4 font-mono text-lg font-bold uppercase tracking-wide text-emerald-400 transition-all duration-75 ease-out hover:bg-emerald-500/30 active:translate-y-0.5 disabled:opacity-50"
                  style={{
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  <CheckCircle className="h-5 w-5" />
                  {isPending ? 'Processing...' : 'COMPLETE TRIP'}
                </button>
              )}

              {/* Balance Payment Request (if deposit paid but balance due) */}
              {canRequestBalance && (
                <div className="col-span-full">
                  <button
                    onClick={handleRequestBalancePayment}
                    disabled={isRequestingBalance || balanceSuccess}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500/20 px-6 py-4 font-mono text-lg font-bold uppercase tracking-wide text-cyan-400 transition-all duration-75 ease-out hover:bg-cyan-500/30 active:translate-y-0.5 disabled:opacity-50"
                    style={{
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    <DollarSign className="h-5 w-5" />
                    {isRequestingBalance 
                      ? 'Sending...' 
                      : balanceSuccess 
                      ? 'Email Sent! ✓'
                      : 'REQUEST BALANCE PAYMENT'}
                  </button>
                  {balanceSuccess && (
                    <p className="mt-2 text-center text-xs text-emerald-400">
                      Payment request email sent to guest
                    </p>
                  )}
                </div>
              )}

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-2">
                {canSetWeatherHold && (
                  <button
                    onClick={() => setShowWeatherModal(true)}
                    disabled={isPending}
                    className="flex items-center justify-center gap-2 rounded-lg bg-amber-500/10 px-4 py-3 font-mono text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    <CloudRain className="h-4 w-4" />
                    Weather Hold
                  </button>
                )}

                {canClearWeatherHold && (
                  <button
                    onClick={() => handleAction('clear_weather')}
                    disabled={isPending}
                    className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-3 font-mono text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Clear Hold
                  </button>
                )}

                {canRefund && (
                  <Link
                    href={`/dashboard/bookings/${booking.id}/refund`}
                    className="flex items-center justify-center gap-2 rounded-lg bg-purple-500/10 px-4 py-3 font-mono text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/20"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Refund
                  </Link>
                )}

                {canMarkNoShow && (
                  <button
                    onClick={() => handleAction('no_show')}
                    disabled={isPending}
                    className="flex items-center justify-center gap-2 rounded-lg bg-amber-500/10 px-4 py-3 font-mono text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    <AlertCircle className="h-4 w-4" />
                    No Show
                  </button>
                )}

                {canCancel && (
                  <button
                    onClick={() => handleAction('cancel')}
                    disabled={isPending}
                    className="flex items-center justify-center gap-2 rounded-lg bg-rose-500/10 px-4 py-3 font-mono text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Terminal State Message */}
          {isTerminal && (
            <div className="rounded-lg bg-slate-800/50 p-4 text-center">
              <span className="font-mono text-sm text-slate-400">
                This booking is {statusLabel.toLowerCase()} and cannot be modified.
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
