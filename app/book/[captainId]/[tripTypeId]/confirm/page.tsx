// app/book/[captainId]/[tripTypeId]/confirm/page.tsx
// Booking confirmation page - Shows booking details + payment (Stripe)
// Mobile-first checkout completion with calendar & share features

import { createSupabaseServiceClient } from "@/utils/supabase/service";
import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, Users, MapPin, Mail, Phone, CheckCircle, FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { ManagementLinkCard } from "@/components/booking/ManagementLinkCard";
import { StripeCheckoutButton } from "@/components/booking/StripeCheckoutButton";
import { ProgressIndicator } from "@/components/booking/ProgressIndicator";
import { CaptainInfoCard, CancellationPolicy, SecurePaymentBadge } from "@/components/booking/TrustSignals";
import { ConfirmationActions } from "./ConfirmationActions";

interface ConfirmPageProps {
  params: Promise<{
    captainId: string;
    tripTypeId: string;
  }>;
  searchParams: Promise<{
    bookingId?: string;
    token?: string;
    payment_status?: string;
  }>;
}

// Booking steps for progress indicator
const BOOKING_STEPS = [
  { label: 'Select Date', shortLabel: 'Date' },
  { label: 'Guest Info', shortLabel: 'Info' },
  { label: 'Confirm', shortLabel: 'Confirm' },
  { label: 'Pay', shortLabel: 'Pay' },
];

export default async function ConfirmPage({ params, searchParams }: ConfirmPageProps) {
  const { captainId, tripTypeId } = await params;
  const { bookingId, token, payment_status } = await searchParams;

  if (!bookingId) {
    redirect(`/book/${captainId}/${tripTypeId}`);
  }

  const supabase = createSupabaseServiceClient();

  // Fetch booking with related data
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      *,
      trip_type:trip_types(*),
      vessel:vessels(*)
    `)
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

  if (!profile) {
    notFound();
  }

  // Calculate amounts
  const depositPaid = booking.deposit_paid_cents;
  const balanceDue = booking.balance_due_cents;
  const totalPrice = booking.total_price_cents;
  const needsDeposit = depositPaid === 0;
  const depositAmount = booking.trip_type?.deposit_amount || Math.round(totalPrice * 0.5);

  // Determine current step
  const currentStep = needsDeposit ? 3 : 4;

  // Format booking for calendar
  const tripTitle = `${booking.trip_type?.title || 'Charter Trip'} with ${profile.business_name || profile.full_name}`;
  const tripDescription = `Booking #${booking.id.slice(0, 8)}
Party size: ${booking.party_size} ${booking.party_size === 1 ? 'guest' : 'guests'}
${booking.special_requests ? `\nSpecial requests: ${booking.special_requests}` : ''}
${profile.meeting_spot_name ? `\nMeeting location: ${profile.meeting_spot_name}` : ''}
${profile.meeting_spot_address ? `\n${profile.meeting_spot_address}` : ''}`;
  const meetingLocation = profile.meeting_spot_address || profile.meeting_spot_name || '';

  // Format share text
  const shareText = `I just booked a ${booking.trip_type?.duration_hours || 4} hour ${booking.trip_type?.title || 'charter'} trip for ${format(parseISO(booking.scheduled_start), 'MMMM d, yyyy')} at ${format(parseISO(booking.scheduled_start), 'h:mm a')}!`;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
              needsDeposit ? 'bg-cyan-500/20' : 'bg-green-500/20'
            }`}>
              {needsDeposit ? (
                <FileText className="h-6 w-6 text-cyan-400" />
              ) : (
                <CheckCircle className="h-6 w-6 text-green-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                {needsDeposit ? 'Complete Your Booking' : 'Booking Confirmed!'}
              </h1>
              <p className="text-sm text-slate-400">
                Booking #{booking.id.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Progress Indicator */}
        <ProgressIndicator
          steps={BOOKING_STEPS}
          currentStep={currentStep}
          className="mb-8"
        />

        {/* Payment failure notice */}
        {payment_status === 'cancelled' && (
          <div className="mb-6 rounded-xl border border-amber-500/50 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">
                  Payment was cancelled
                </p>
                <p className="text-xs text-amber-400/70 mt-1">
                  Your booking is saved. Complete payment below to confirm your trip.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Captain Info */}
        <CaptainInfoCard
          name={profile.full_name || 'Captain'}
          businessName={profile.business_name}
          avatarUrl={profile.avatar_url}
          meetingSpotName={profile.meeting_spot_name}
          meetingSpotAddress={profile.meeting_spot_address}
          timezone={profile.timezone}
          className="mb-6"
        />

        {/* Booking Details Card */}
        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            Trip Details
          </h2>

          <div className="space-y-4">
            {/* Trip Type */}
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
              <div>
                <div className="font-medium text-slate-100">
                  {booking.trip_type?.title || 'Charter Trip'}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {format(parseISO(booking.scheduled_start), 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
              <div>
                <div className="font-medium text-slate-100">
                  {format(parseISO(booking.scheduled_start), 'h:mm a')} - {format(parseISO(booking.scheduled_end), 'h:mm a')}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {booking.trip_type?.duration_hours} hours
                  {profile.timezone && (
                    <span className="text-slate-500"> ({profile.timezone.replace(/_/g, ' ')})</span>
                  )}
                </div>
              </div>
            </div>

            {/* Party Size */}
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
              <div>
                <div className="font-medium text-slate-100">
                  {booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}
                </div>
                {booking.vessel && (
                  <div className="mt-1 text-sm text-slate-400">
                    Aboard {booking.vessel.name}
                  </div>
                )}
              </div>
            </div>

            {/* Meeting Spot */}
            {profile.meeting_spot_name && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
                <div>
                  <div className="font-medium text-slate-100">
                    {profile.meeting_spot_name}
                  </div>
                  {profile.meeting_spot_address && (
                    <div className="mt-1 text-sm text-slate-400">
                      {profile.meeting_spot_address}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Guest Information Card */}
        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            Guest Information
          </h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-slate-400" />
              <div>
                <div className="text-sm text-slate-400">Primary Contact</div>
                <div className="font-medium text-slate-100">{booking.guest_name}</div>
                <div className="text-sm text-slate-300">{booking.guest_email}</div>
              </div>
            </div>

            {booking.guest_phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-400">Phone</div>
                  <div className="font-medium text-slate-100">{booking.guest_phone}</div>
                </div>
              </div>
            )}

            {booking.special_requests && (
              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Special Requests
                </div>
                <div className="text-sm text-slate-300">{booking.special_requests}</div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary Card */}
        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            Payment Summary
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between text-slate-300">
              <span>Trip Total</span>
              <span className="font-medium">${(totalPrice / 100).toFixed(2)}</span>
            </div>

            {depositPaid > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Deposit Paid</span>
                <span className="font-medium">-${(depositPaid / 100).toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-slate-700 pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-slate-100">
                  {needsDeposit ? 'Deposit Due Today' : 'Balance Due at Trip'}
                </span>
                <span className="text-cyan-400">
                  ${((needsDeposit ? depositAmount : balanceDue) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Policy */}
        {needsDeposit && (
          <CancellationPolicy
            policy={profile.cancellation_policy}
            className="mb-6"
          />
        )}

        {/* Payment Section */}
        {needsDeposit ? (
          <div className="mb-6 rounded-xl border border-cyan-500/50 bg-cyan-500/10 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">
              Secure Payment
            </h2>

            <p className="mb-4 text-sm text-slate-300">
              Complete your booking by paying the deposit. You'll receive a confirmation email
              with all trip details and your booking management link.
            </p>

            <StripeCheckoutButton
              bookingId={bookingId}
              depositAmount={depositAmount}
            />

            <div className="mt-4 flex justify-center">
              <SecurePaymentBadge />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-xl border border-green-500/50 bg-green-500/10 p-6 text-center">
              <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-400" />
              <h3 className="mb-2 text-lg font-semibold text-slate-100">
                Deposit Received!
              </h3>
              <p className="text-sm text-slate-300">
                Your booking is confirmed. We've sent a confirmation email to {booking.guest_email}
              </p>
            </div>

            {/* Calendar & Share Actions */}
            <ConfirmationActions
              title={tripTitle}
              description={tripDescription}
              location={meetingLocation}
              startTime={booking.scheduled_start}
              endTime={booking.scheduled_end}
              shareText={shareText}
              className="mb-6"
            />
          </>
        )}

        {/* Booking Management Link */}
        {token && (
          <ManagementLinkCard token={token} guestEmail={booking.guest_email} />
        )}

        {/* What's Next */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 mt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            What's Next?
          </h2>

          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
              <span>
                {needsDeposit
                  ? 'Complete payment above to confirm your booking'
                  : "You'll receive a confirmation email with your booking details and a management link"
                }
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
              <span>
                The remaining balance of ${(balanceDue / 100).toFixed(2)} is due at the time of your trip
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
              <span>
                You&apos;ll receive waiver links via email before your trip
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
              <span>
                The captain will contact you if there are any weather concerns
              </span>
            </li>
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 text-center">
          <Link
            href={`/c/${captainId}`}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            ← Back to captain profile
          </Link>
        </div>
      </div>
    </div>
  );
}
