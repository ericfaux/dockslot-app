'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Anchor,
  Ship,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BookingWithPassengers, BookingStatus, PaymentStatus } from '@/lib/db/types';
import { PassengerList } from './PassengerList';
import { format } from 'date-fns';

interface BookingCardProps {
  booking: BookingWithPassengers;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  pending_deposit: {
    label: 'Pending Deposit',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  weather_hold: {
    label: 'Weather Hold',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  rescheduled: {
    label: 'Rescheduled',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  completed: {
    label: 'Completed',
    className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  },
  no_show: {
    label: 'No Show',
    className: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  },
};

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  unpaid: {
    label: 'Unpaid',
    className: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  },
  deposit_paid: {
    label: 'Deposit Paid',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  fully_paid: {
    label: 'Paid',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  partially_refunded: {
    label: 'Partially Refunded',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  fully_refunded: {
    label: 'Refunded',
    className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  },
};

export function BookingCard({ booking }: BookingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = STATUS_CONFIG[booking.status];
  const paymentConfig = PAYMENT_CONFIG[booking.payment_status];

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'EEE, MMM d, yyyy');
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'h:mm a');
  };

  const hasPassengers = booking.passengers && booking.passengers.length > 0;

  return (
    <div
      className="group relative flex flex-col rounded-lg border border-slate-700 bg-slate-900 transition-all hover:border-cyan-500/50"
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between border-b border-slate-800 p-4">
        <div className="flex-1 pr-2">
          <h3 className="font-medium text-white">{booking.guest_name}</h3>
          <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-400">
            {booking.guest_email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {booking.guest_email}
              </span>
            )}
            {booking.guest_phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {booking.guest_phone}
              </span>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-col gap-1.5">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
          >
            {statusConfig.label}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${paymentConfig.className}`}
          >
            {paymentConfig.label}
          </span>
        </div>
      </div>

      {/* Card Body - Stats */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Date & Time */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
            <Calendar className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Scheduled</div>
            <div className="font-mono text-white">
              {formatDate(booking.scheduled_start)}
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Time</div>
            <div className="font-mono text-white">
              {formatTime(booking.scheduled_start)} - {formatTime(booking.scheduled_end)}
            </div>
          </div>
        </div>

        {/* Trip Type */}
        {booking.trip_type && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
              <Anchor className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Trip Type</div>
              <div className="font-medium text-white">{booking.trip_type.title}</div>
            </div>
          </div>
        )}

        {/* Vessel */}
        {booking.vessel && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
              <Ship className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Vessel</div>
              <div className="font-medium text-white">{booking.vessel.name}</div>
            </div>
          </div>
        )}

        {/* Party Size */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Party Size</div>
            <div className="font-mono text-lg text-emerald-400">
              {booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}
            </div>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Button for Passengers */}
      {hasPassengers && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-2 border-t border-slate-800 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-cyan-400"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide Passengers
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              View {booking.passengers.length} Passenger
              {booking.passengers.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      )}

      {/* Passenger List */}
      <PassengerList passengers={booking.passengers || []} isExpanded={isExpanded} />
    </div>
  );
}
