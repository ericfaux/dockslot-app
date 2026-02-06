'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Navigation,
  Users,
  FileCheck,
  CreditCard,
  CheckCircle,
} from 'lucide-react';
import { BookingStatus } from '@/lib/db/types';
import { completeBooking } from '@/app/actions/bookings';

interface FloatPlanBooking {
  id: string;
  time: string;
  tripType: string;
  guestName: string;
  partySize: number;
  status: BookingStatus;
  paymentStatus: string;
  waiversSigned: number;
  waiversTotal: number;
}

interface FloatPlanCardProps {
  booking: FloatPlanBooking | null;
}

type TripStatus = 'confirmed' | 'pending_deposit' | 'weather_hold' | 'cancelled' | 'rescheduled';

function StatusBadge({ status }: { status: TripStatus }) {
  const statusConfig = {
    confirmed: {
      label: 'Confirmed',
      dotColor: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    pending_deposit: {
      label: 'Awaiting Deposit',
      dotColor: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    weather_hold: {
      label: 'Weather Hold',
      dotColor: 'bg-cyan-500',
      textColor: 'text-cyan-700',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
    },
    cancelled: {
      label: 'Cancelled',
      dotColor: 'bg-rose-500',
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
    },
    rescheduled: {
      label: 'Rescheduled',
      dotColor: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
  };

  const config = statusConfig[status] || statusConfig.confirmed;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${config.bgColor} ${config.borderColor}`}
    >
      <div className={`h-2 w-2 rounded-full ${config.dotColor}`} />
      <span className={`text-xs font-semibold ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
}

export function FloatPlanCard({ booking }: FloatPlanCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const borderColorMap: Record<string, string> = {
    confirmed: 'border-l-emerald-500',
    pending_deposit: 'border-l-amber-500',
    weather_hold: 'border-l-cyan-500',
    cancelled: 'border-l-rose-500',
    rescheduled: 'border-l-blue-500',
  };

  const handleDepart = () => {
    if (!booking) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await completeBooking(booking.id);

        if (result.success) {
          setIsCompleted(true);
          // Refresh the page to show updated data
          router.refresh();
        } else {
          setError(result.error || 'Failed to complete trip');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  // No upcoming trip
  if (!booking) {
    return (
      <div
        className="overflow-hidden rounded-lg border-l-8 border-l-slate-500 bg-white"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
      >
        <div className="p-8 text-center">
          <Navigation className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-4 font-mono text-lg text-slate-500">No upcoming trips today</p>
          <p className="mt-1 text-sm text-slate-400">
            Your next booking will appear here
          </p>
        </div>
      </div>
    );
  }

  const depositPaid = booking.paymentStatus === 'deposit_paid' || booking.paymentStatus === 'fully_paid';
  const canDepart = ['confirmed', 'rescheduled'].includes(booking.status);

  return (
    <div
      className={`overflow-hidden rounded-lg border-l-8 bg-white ${borderColorMap[booking.status] || borderColorMap.confirmed}`}
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
    >
      <div className="p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-2xl font-bold text-slate-900">
              {booking.time}
            </div>
            <div className="font-mono text-lg font-semibold text-slate-700">
              {booking.tripType}
            </div>
          </div>
          <StatusBadge status={booking.status as TripStatus} />
        </div>

        {/* Guest Info Panel */}
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Guest Details */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <div className="font-mono text-base font-semibold text-slate-900">
                  {booking.guestName}
                </div>
                <div className="text-sm text-slate-500">
                  {booking.partySize} guests
                </div>
              </div>
            </div>

            {/* Right: Status Indicators */}
            <div className="flex flex-wrap gap-4">
              {/* Waivers */}
              <div className="flex items-center gap-2">
                <FileCheck
                  className={`h-4 w-4 ${
                    booking.waiversSigned === booking.waiversTotal
                      ? 'text-emerald-500'
                      : 'text-amber-500'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    booking.waiversSigned === booking.waiversTotal
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                >
                  {booking.waiversSigned}/{booking.waiversTotal} waivers
                </span>
              </div>
              {/* Payment */}
              <div className="flex items-center gap-2">
                <CreditCard
                  className={`h-4 w-4 ${depositPaid ? 'text-emerald-500' : 'text-amber-500'}`}
                />
                <span
                  className={`text-sm font-medium ${
                    depositPaid ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {depositPaid ? 'Deposit Paid' : 'Deposit Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Success Message */}
        {isCompleted && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="h-4 w-4" />
            Trip completed successfully!
          </div>
        )}

        {/* Depart Button */}
        {canDepart && !isCompleted && (
          <button
            onClick={handleDepart}
            disabled={isPending}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 font-mono text-lg font-bold uppercase tracking-wide text-slate-900 transition-all duration-75 ease-out hover:bg-white active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderBottom: '4px solid #0f172a',
              boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.03)',
            }}
          >
            <Navigation className="h-5 w-5" />
            {isPending ? 'PROCESSING...' : 'DEPART'}
          </button>
        )}
      </div>
    </div>
  );
}
