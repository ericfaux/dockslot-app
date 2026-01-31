// app/c/[captainId]/page.tsx
// Public Captain Profile Page - Guest Booking Entry Point
// Design: Premium charter booking experience, mobile-first

import { createSupabaseServiceClient } from "@/utils/supabase/service";
import { notFound } from "next/navigation";
import { 
  Anchor, 
  MapPin, 
  Clock, 
  Users, 
  Calendar,
  Info,
  Shield,
  Mail,
  Phone,
} from "lucide-react";
import Image from "next/image";

interface CaptainProfileProps {
  params: Promise<{
    captainId: string;
  }>;
}

export default async function CaptainProfilePage({ params }: CaptainProfileProps) {
  const { captainId } = await params;
  const supabase = createSupabaseServiceClient();

  // Fetch captain profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', captainId)
    .single();

  // Debug logging
  if (profileError) {
    console.error('[Captain Profile] Error fetching profile:', profileError);
  }
  if (!profile) {
    console.log('[Captain Profile] No profile found for ID:', captainId);
  }

  if (profileError || !profile) {
    notFound();
  }

  // Check if captain is hibernating
  if (profile.is_hibernating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
        <div className="max-w-md rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
          <Anchor className="mx-auto mb-4 h-12 w-12 text-slate-600" />
          <h1 className="mb-2 text-2xl font-bold text-slate-100">
            {profile.business_name || "Charter Unavailable"}
          </h1>
          <p className="text-slate-400">
            {profile.hibernation_message || "This charter is not currently accepting bookings."}
          </p>
        </div>
      </div>
    );
  }

  // Fetch vessels
  const { data: vessels } = await supabase
    .from('vessels')
    .select('*')
    .eq('owner_id', captainId);

  // Fetch trip types
  const { data: tripTypes } = await supabase
    .from('trip_types')
    .select('*')
    .eq('owner_id', captainId)
    .order('price_total', { ascending: true });

  const primaryVessel = vessels && vessels.length > 0 ? vessels[0] : null;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="relative">
        {/* Hero Background - Maritime Gradient */}
        <div className="absolute inset-0 h-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950">
          {/* Subtle wave pattern overlay */}
          <svg 
            className="absolute bottom-0 h-32 w-full opacity-10" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,64 C100,32 200,96 300,64 C400,32 500,96 600,64 C700,32 800,96 900,64 C1000,32 1100,96 1200,64 L1200,120 L0,120 Z" 
              fill="currentColor"
              className="text-cyan-400/20"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Captain Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Anchor className="h-6 w-6 text-cyan-400" />
                <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
                  USCG Licensed Charter
                </span>
              </div>
              <h1 className="mb-2 text-4xl font-bold text-slate-100 sm:text-5xl">
                {profile.business_name || profile.full_name || "Charter Service"}
              </h1>
              {profile.full_name && profile.business_name && (
                <p className="text-lg text-slate-400">
                  Captain {profile.full_name}
                </p>
              )}
            </div>
          </div>

          {/* Meeting Spot Info */}
          {profile.meeting_spot_name && (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-4 backdrop-blur-sm">
              <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400" />
              <div>
                <p className="font-semibold text-slate-100">
                  {profile.meeting_spot_name}
                </p>
                {profile.meeting_spot_address && (
                  <p className="mt-1 text-sm text-slate-400">
                    {profile.meeting_spot_address}
                  </p>
                )}
                {profile.meeting_spot_instructions && (
                  <p className="mt-2 text-sm text-slate-300">
                    {profile.meeting_spot_instructions}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Vessel Section */}
        {primaryVessel && (
          <section className="mb-12">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-slate-100">
              <Anchor className="h-6 w-6 text-cyan-400" />
              The Vessel
            </h2>
            <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
              {/* Placeholder for vessel image - will add later */}
              <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800">
                <div className="flex h-full items-center justify-center">
                  <Anchor className="h-24 w-24 text-slate-600" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="mb-2 text-2xl font-bold text-slate-100">
                  {primaryVessel.name}
                </h3>
                <div className="mb-4 flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Up to {primaryVessel.capacity} passengers</span>
                  </div>
                </div>
                {primaryVessel.description && (
                  <p className="text-slate-300">{primaryVessel.description}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Trip Types Section */}
        {tripTypes && tripTypes.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-slate-100">
              <Calendar className="h-6 w-6 text-cyan-400" />
              Available Trips
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {tripTypes.map((trip) => (
                <div
                  key={trip.id}
                  className="group overflow-hidden rounded-lg border border-slate-700 bg-slate-800 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <div className="p-6">
                    <h3 className="mb-2 text-xl font-bold text-slate-100">
                      {trip.title}
                    </h3>
                    <div className="mb-4 flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{trip.duration_hours} hours</span>
                      </div>
                    </div>
                    {trip.description && (
                      <p className="mb-4 text-sm text-slate-300">{trip.description}</p>
                    )}
                    
                    {/* Pricing */}
                    <div className="mb-4 border-t border-slate-700 pt-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-slate-400">Total Price</span>
                        <span className="text-2xl font-bold text-slate-100">
                          ${(trip.price_total / 100).toFixed(0)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between text-sm">
                        <span className="text-slate-500">Deposit to book</span>
                        <span className="text-slate-300">
                          ${(trip.deposit_amount / 100).toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Book Button */}
                    <button
                      className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-900 transition-all hover:bg-cyan-400 active:scale-95"
                    >
                      Book This Trip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* No Trips Available */}
        {(!tripTypes || tripTypes.length === 0) && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-600" />
            <p className="text-slate-400">
              No trips are currently available. Please check back later.
            </p>
          </div>
        )}

        {/* Info Section */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-slate-100">
            <Info className="h-6 w-6 text-cyan-400" />
            Good to Know
          </h2>
          <div className="space-y-4">
            {/* Cancellation Policy */}
            {profile.cancellation_policy && (
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-semibold text-slate-100">Cancellation Policy</h3>
                </div>
                <p className="text-sm text-slate-300">{profile.cancellation_policy}</p>
              </div>
            )}

            {/* Contact Info */}
            {(profile.email || profile.phone) && (
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                <h3 className="mb-3 font-semibold text-slate-100">Contact</h3>
                <div className="space-y-2 text-sm">
                  {profile.email && (
                    <a 
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                    >
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </a>
                  )}
                  {profile.phone && (
                    <a 
                      href={`tel:${profile.phone}`}
                      className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                    >
                      <Phone className="h-4 w-4" />
                      {profile.phone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Footer Branding */}
        <div className="border-t border-slate-800 pt-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Anchor className="h-4 w-4 text-slate-600" />
            <span className="font-mono text-xs uppercase tracking-widest text-slate-600">
              Powered by DockSlot
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Captain-first booking for 6-pack charters
          </p>
        </div>
      </div>
    </div>
  );
}
