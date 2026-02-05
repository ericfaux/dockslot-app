// app/book/[captainId]/[tripTypeId]/confirm/page.tsx
// Booking confirmation page - Shows booking details + payment (Stripe) (light theme)
// Mobile-first checkout completion with calendar & share features

import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { redirect, notFound } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import {
  CheckCircle,
  Clock,
  Users,
  MapPin,
  Calendar,
  Mail,
  Phone,
  CreditCard,
  ChevronLeft,
  Anchor,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { ProgressIndicator } from '@/components/booking/ProgressIndicator';
import { StripeCheckoutButton } from '@/components/booking/StripeCheckoutButton';
import { ManagementLinkCard } from '@/components/booking/ManagementLinkCard';
import { ConfirmationActions } from './ConfirmationActions';

const BOOKING_STEPS = [
  { label: 'Select Trip', shortLabel: 'Trip' },
  { label: 'Date & Time', shortLabel: 'Date' },
  { label: 'Guest Info', shortLabel: 'Info' },
  { label: 'Payment', shortLabel: 'Pay' },
];

interface ConfirmPageProps {
  params: Promise<{
    captainId: string;
    tripTypeId: string;
  }>;
  searchParams: Promise<{
    bookingId?: string;
    token?: string;
    payment?: string;
  }>;
}

export default async function ConfirmPage({ params, searchParams }: ConfirmPageProps) {
  const { captainId, tripTypeId } = await params;
  const { bookingId, token, payment } = await searchParams;

  if (!bookingId) {
    redirect(`/book/${captainId}`);
  }

  const supabase = createSupabaseServiceClient();

  // Fetch booking with related data
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    notFound();
  }

  // Fetch captain profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', captainId)
    .single();

  // Fetch trip type
  const { data: tripType } = await supabase
    .from('trip_types')
    .select('*')
    .eq('id', tripTypeId)
    .single();

  // Determine if deposit needs to be paid
  const needsDeposit =
    booking.payment_status === 'unpaid' &&
    booking.status === 'pending_deposit' &&
    tripType &&
    tripType.deposit_amount > 0;

  const depositPaid = booking.payment_status === 'deposit_paid' || booking.payment_status === 'fully_paid';

  const currentStep = needsDeposit ? 3 : 4;

  // Format dates
  const startDate = parseISO(booking.scheduled_start);
  const endDate = parseISO(booking.scheduled_end);
  const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(startDate, 'h:mm a');
  const formattedEndTime = format(endDate, 'h:mm a');

  // Meeting spot
  const meetingSpot = profile?.meeting_spot_name || 'To be confirmed';
  const meetingAddress = profile?.meeting_spot_address || '';
  const meetingInstructions = profile?.meeting_spot_instructions || '';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-lg shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link
            href={`/book/${captainId}`}
            className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
          <div className="text-right">
            <div className="text-sm font-medium text-slate-900">
              {profile?.business_name || 'Charter Booking'}
            </div>
            <div className="text-xs text-slate-500">
              Booking #{bookingId.slice(0, 8).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Progress Indicator */}
        <ProgressIndicator
          steps={BOOKING_STEPS}
          currentStep={currentStep}
          className="mb-8"
        />

        {/* Success Banner (if deposit paid) */}
        {depositPaid && (
          <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 flex-shrink-0">
                <CheckCircle className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  Booking Confirmed!
                </h1>
                <p className="text-slate-600">
                  Your deposit has been received. A confirmation email has been sent to {booking.guest_email}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Cancelled Warning */}
        {payment === 'cancelled' && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              Payment was cancelled. Your booking is held for a limited time. Complete payment below to confirm your trip.
            </p>
          </div>
        )}

        {/* Needs Deposit Banner */}
        {needsDeposit && !payment && (
          <div className="mb-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 flex-shrink-0">
                <CreditCard className="h-6 w-6 text-cyan-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  Almost There!
                </h1>
                <p className="text-slate-600">
                  Review your booking details and pay the deposit to confirm.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Details Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Anchor className="h-5 w-5 text-cyan-600" />
                Trip Details
              </h2>

              <div className="space-y-4">
                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{formattedDate}</p>
                    <p className="text-sm text-slate-500">
                      {formattedStartTime} - {formattedEndTime}
                    </p>
                  </div>
                </div>

                {/* Trip Type */}
                {tripType && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{tripType.title}</p>
                      <p className="text-sm text-slate-500">{tripType.duration_hours} hours</p>
                    </div>
                  </div>
                )}

                {/* Party Size */}
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>
                </div>

                {/* Meeting Spot */}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{meetingSpot}</p>
                    {meetingAddress && (
                      <p className="text-sm text-slate-500">{meetingAddress}</p>
                    )}
                    {meetingInstructions && (
                      <p className="mt-1 text-sm text-slate-500 italic">{meetingInstructions}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Info Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-600" />
                Guest Information
              </h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-900">{booking.guest_email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-900">{booking.guest_name}</span>
                </div>
                {booking.guest_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-900">{booking.guest_phone}</span>
                  </div>
                )}
                {booking.special_requests && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-1">Special Requests</p>
                    <p className="text-sm text-slate-600">{booking.special_requests}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions (calendar + share) - only show when confirmed */}
            {depositPaid && (
              <>
                <ConfirmationActions
                  title={`${tripType?.title || 'Charter'} with ${profile?.business_name || 'Captain'}`}
                  description={`Party of ${booking.party_size}. Meet at ${meetingSpot}.`}
                  location={meetingAddress || meetingSpot}
                  startTime={booking.scheduled_start}
                  endTime={booking.scheduled_end}
                  shareText={`I booked a fishing charter with ${profile?.business_name || 'Captain'}! ${formattedDate} from ${formattedStartTime}.`}
                />

                {/* What's Next */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">What&apos;s Next?</h2>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700 flex-shrink-0">
                        1
                      </span>
                      <span className="text-slate-600">
                        Check your email for confirmation details and waiver links.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700 flex-shrink-0">
                        2
                      </span>
                      <span className="text-slate-600">
                        All passengers must sign the liability waiver before the trip.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700 flex-shrink-0">
                        3
                      </span>
                      <span className="text-slate-600">
                        Arrive at the meeting spot 15 minutes before departure.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700 flex-shrink-0">
                        4
                      </span>
                      <span className="text-slate-600">
                        Balance of ${((booking.balance_due_cents - (tripType?.deposit_amount || 0)) / 100).toFixed(2)} is due at the dock on the day of your trip.
                      </span>
                    </li>
                  </ol>
                </div>
              </>
            )}
          </div>

          {/* Sidebar - Payment Summary */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-cyan-600" />
                Payment Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Trip Total</span>
                  <span className="font-medium text-slate-900">
                    ${(booking.total_price_cents / 100).toFixed(2)}
                  </span>
                </div>
                {booking.promo_discount_cents > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Promo Discount</span>
                    <span className="font-medium">
                      -${(booking.promo_discount_cents / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                {tripType && tripType.deposit_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Deposit {depositPaid ? '(Paid)' : '(Due Now)'}</span>
                    <span className={`font-medium ${depositPaid ? 'text-emerald-600' : 'text-cyan-700'}`}>
                      ${(tripType.deposit_amount / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 flex justify-between text-base">
                  <span className="font-semibold text-slate-900">Balance Due at Trip</span>
                  <span className="font-bold text-slate-900">
                    ${(booking.balance_due_cents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Stripe Checkout Button */}
              {needsDeposit && (
                <div className="mt-6">
                  <StripeCheckoutButton
                    bookingId={booking.id}
                    depositAmount={tripType!.deposit_amount}
                  />
                </div>
              )}

              {/* Deposit Paid Confirmation */}
              {depositPaid && (
                <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
                    <CheckCircle className="h-4 w-4" />
                    <span>Deposit paid - You&apos;re all set!</span>
                  </div>
                </div>
              )}
            </div>

            {/* Management Link */}
            {token && (
              <ManagementLinkCard
                token={token}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-slate-400">
            Powered by DockSlot
          </p>
        </div>
      </footer>
    </div>
  );
}
