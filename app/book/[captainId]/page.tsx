import { Anchor, AlertTriangle } from 'lucide-react';
import { getPublicCaptainProfile, getPublicTripTypes } from '@/app/actions/public-booking';
import { TripCard } from '../components/TripCard';
import { CaptainInfoCard } from '@/components/booking/TrustSignals';

interface Props {
  params: Promise<{
    captainId: string;
  }>;
}

// Booking steps for progress indicator
const BOOKING_STEPS = [
  { label: 'Select Trip', shortLabel: 'Trip' },
  { label: 'Date & Time', shortLabel: 'Date' },
  { label: 'Guest Info', shortLabel: 'Info' },
  { label: 'Payment', shortLabel: 'Pay' },
];

export default async function SelectTripPage({ params }: Props) {
  const { captainId } = await params;

  // Fetch captain profile and trip types in parallel
  const [profileResult, tripTypesResult] = await Promise.all([
    getPublicCaptainProfile(captainId),
    getPublicTripTypes(captainId),
  ]);

  // Handle errors
  if (!profileResult.success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
                <AlertTriangle className="h-8 w-8 text-rose-400" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">
              {profileResult.code === 'HIBERNATING' ? 'Not Accepting Bookings' : 'Captain Not Found'}
            </h1>
            <p className="text-slate-400">
              {profileResult.error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const profile = profileResult.data!;
  const tripTypes = tripTypesResult.success ? tripTypesResult.data! : [];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                <Anchor className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {profile.business_name || profile.full_name || 'Charter Captain'}
                </h1>
                <p className="text-sm text-slate-400">Book Your Trip</p>
              </div>
            </div>

            {/* Desktop Step Indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white text-sm font-medium">
                1
              </span>
              <span className="text-sm text-slate-400">of 4</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Mobile Progress Indicator */}
        <div className="sm:hidden mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-100">Step 1 of 4</span>
            <span className="text-sm text-cyan-400">Select Trip</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 w-1/4 transition-all duration-300" />
          </div>
        </div>

        {/* Captain Info Card */}
        <CaptainInfoCard
          name={profile.full_name || 'Captain'}
          businessName={profile.business_name}
          avatarUrl={profile.avatar_url}
          meetingSpotName={profile.meeting_spot_name}
          meetingSpotAddress={profile.meeting_spot_address}
          timezone={profile.timezone}
          className="mb-6"
        />

        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Select Your Trip</h2>
          <p className="text-slate-400">
            Choose from the available charter experiences below.
          </p>
        </div>

        {/* Trip Cards */}
        {tripTypes.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
                <Anchor className="h-6 w-6 text-slate-500" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Trips Available</h3>
            <p className="text-slate-400">
              This captain hasn&apos;t set up any trip types yet. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tripTypes.map((tripType) => (
              <TripCard
                key={tripType.id}
                id={tripType.id}
                title={tripType.title}
                description={tripType.description}
                duration_hours={tripType.duration_hours}
                price_total={tripType.price_total}
                deposit_amount={tripType.deposit_amount}
                captainId={captainId}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-slate-500">
            Powered by DockSlot
          </p>
        </div>
      </footer>
    </div>
  );
}
