// app/book/[captainId]/[tripTypeId]/page.tsx
// Booking flow page - Date selection + guest details (light theme)
// Mobile-first checkout experience

import { createSupabaseServiceClient } from "@/utils/supabase/service";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { BookingForm } from "./BookingForm";
import { formatDollars } from "@/lib/utils/format";

interface BookingPageProps {
  params: Promise<{
    captainId: string;
    tripTypeId: string;
  }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { captainId, tripTypeId } = await params;
  const supabase = createSupabaseServiceClient();

  // Fetch captain profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', captainId)
    .single();

  if (!profile) {
    notFound();
  }

  // Check if hibernating
  if (profile.is_hibernating) {
    redirect(`/book/${captainId}`);
  }

  // Fetch trip type
  const { data: tripType } = await supabase
    .from('trip_types')
    .select('*')
    .eq('id', tripTypeId)
    .eq('owner_id', captainId)
    .single();

  if (!tripType) {
    notFound();
  }

  // Fetch vessel (optional for display)
  const { data: vessels } = await supabase
    .from('vessels')
    .select('*')
    .eq('owner_id', captainId)
    .limit(1);

  const vessel = vessels?.[0];

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
            <span>Back to trips</span>
          </Link>
          <div className="text-right">
            <div className="text-sm font-medium text-slate-900">
              {profile.business_name || "Charter Booking"}
            </div>
            <div className="text-xs text-slate-500">{tripType.title}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">
            Book Your Trip
          </h1>
          <p className="text-slate-500">
            Select your preferred date and time, then provide guest details
          </p>
        </div>

        {/* Trip Summary Card */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Trip Summary
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Trip Type</span>
              <span className="font-medium text-slate-900">{tripType.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Duration</span>
              <span className="font-medium text-slate-900">
                {tripType.duration_hours} hours
              </span>
            </div>
            {vessel && (
              <div className="flex justify-between">
                <span className="text-slate-500">Vessel</span>
                <span className="font-medium text-slate-900">
                  {vessel.name} (up to {vessel.capacity} guests)
                </span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-3">
              <div className="flex justify-between text-base">
                <span className="font-semibold text-slate-900">Total Price</span>
                <span className="font-bold text-slate-900">
                  {formatDollars(tripType.price_total)}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-slate-500">Deposit to book</span>
                <span className="font-medium text-cyan-700">
                  {formatDollars(tripType.deposit_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <BookingForm
          captainId={captainId}
          tripTypeId={tripTypeId}
          tripDuration={tripType.duration_hours}
          depositAmount={tripType.deposit_amount}
          totalPrice={tripType.price_total}
          maxCapacity={vessel?.capacity || 6}
          captainTimezone={profile.timezone || undefined}
          cancellationPolicy={profile.cancellation_policy || undefined}
          meetingSpotLatitude={profile.meeting_spot_latitude || undefined}
          meetingSpotLongitude={profile.meeting_spot_longitude || undefined}
        />
      </div>
    </div>
  );
}
