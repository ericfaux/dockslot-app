'use client';

import {
  Anchor,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Mail,
  Phone,
  User,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatDollars } from '@/lib/utils/format';
import type { GuestFormData } from './GuestForm';

interface BookingSummaryProps {
  tripTitle: string;
  tripDescription?: string | null;
  durationHours: number;
  priceTotal: number;
  depositAmount: number;
  scheduledDate: string;
  scheduledTime: string;
  guestData: GuestFormData;
  meetingSpotName?: string | null;
  meetingSpotAddress?: string | null;
  cancellationPolicy?: string | null;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
}

export function BookingSummary({
  tripTitle,
  tripDescription,
  durationHours,
  priceTotal,
  depositAmount,
  scheduledDate,
  scheduledTime,
  guestData,
  meetingSpotName,
  meetingSpotAddress,
  cancellationPolicy,
  onConfirm,
  onBack,
  isSubmitting,
  submitError,
}: BookingSummaryProps) {
  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    if (hours === 1) {
      return '1 hour';
    }
    return `${hours} hours`;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const formattedDate = format(parseISO(scheduledDate), 'EEEE, MMMM d, yyyy');
  const balanceDue = priceTotal - depositAmount;

  return (
    <div className="space-y-6">
      {/* Trip Details */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Anchor className="h-5 w-5 text-cyan-400" />
          Trip Details
        </h3>

        <div className="space-y-4">
          <div>
            <h4 className="text-xl font-semibold text-white">{tripTitle}</h4>
            {tripDescription && (
              <p className="text-sm text-slate-400 mt-1">{tripDescription}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            {/* Date */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                <Calendar className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Date</div>
                <div className="text-white font-medium">{formattedDate}</div>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                <Clock className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Time</div>
                <div className="text-white font-medium">
                  {formatTime(scheduledTime)} ({formatDuration(durationHours)})
                </div>
              </div>
            </div>

            {/* Party Size */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                <Users className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Party Size</div>
                <div className="text-white font-medium">
                  {guestData.party_size} {guestData.party_size === 1 ? 'guest' : 'guests'}
                </div>
              </div>
            </div>

            {/* Meeting Location */}
            {(meetingSpotName || meetingSpotAddress) && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                  <MapPin className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Meeting Location</div>
                  <div className="text-white font-medium">
                    {meetingSpotName || meetingSpotAddress}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-cyan-400" />
          Contact Information
        </h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-slate-500" />
            <span className="text-white">{guestData.guest_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-slate-500" />
            <span className="text-white">{guestData.guest_email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-slate-500" />
            <span className="text-white">{guestData.guest_phone}</span>
          </div>
        </div>

        {/* Additional Passengers */}
        {guestData.passengers.length > 0 &&
          guestData.passengers.some((p) => p.full_name) && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Additional Passengers
              </h4>
              <ul className="space-y-1">
                {guestData.passengers
                  .filter((p) => p.full_name)
                  .map((passenger, index) => (
                    <li key={index} className="text-sm text-slate-400">
                      {passenger.full_name}
                    </li>
                  ))}
              </ul>
            </div>
          )}

        {/* Special Requests */}
        {guestData.special_requests && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <h4 className="text-sm font-medium text-slate-300 mb-2">
              Special Requests
            </h4>
            <p className="text-sm text-slate-400">{guestData.special_requests}</p>
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-cyan-400" />
          Price Breakdown
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Trip Total</span>
            <span className="text-white font-medium">{formatDollars(priceTotal)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Deposit Due Now</span>
            <span className="text-amber-400 font-medium">{formatDollars(depositAmount)}</span>
          </div>

          {balanceDue > 0 && (
            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <span className="text-slate-400">Balance Due (Day of Trip)</span>
              <span className="text-white font-medium">{formatDollars(balanceDue)}</span>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-md bg-amber-500/10 border border-amber-500/20 px-4 py-3">
          <p className="text-sm text-amber-400">
            A deposit of {formatDollars(depositAmount)} is required to confirm your booking.
          </p>
        </div>
      </div>

      {/* Cancellation Policy */}
      {cancellationPolicy && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-cyan-400" />
            Cancellation Policy
          </h3>
          <p className="text-sm text-slate-400 whitespace-pre-wrap">
            {cancellationPolicy}
          </p>
        </div>
      )}

      {/* Submit Error */}
      {submitError && (
        <div className="rounded-md bg-rose-500/10 border border-rose-500/20 px-4 py-3">
          <p className="text-sm text-rose-400">{submitError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-4 rounded-lg font-semibold text-lg border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className={`
            flex-1 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2
            ${isSubmitting
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
            }
          `}
        >
          {isSubmitting ? (
            'Processing...'
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              Request Booking
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-center text-slate-500">
        By clicking &quot;Request Booking&quot;, you agree to the captain&apos;s cancellation policy.
        Your booking will be pending until the deposit is paid.
      </p>
    </div>
  );
}
