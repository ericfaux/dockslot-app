import { Anchor } from 'lucide-react';
import { getPublicCaptainProfile, getPublicTripTypes } from '@/app/actions/public-booking';
import { TripCard } from '../../components/TripCard';
import { BrandedLayout } from '../../components/BrandedLayout';

interface Props {
  params: Promise<{
    captainId: string;
  }>;
}

export default async function EmbedBookingPage({ params }: Props) {
  const { captainId } = await params;

  const [profileResult, tripTypesResult] = await Promise.all([
    getPublicCaptainProfile(captainId),
    getPublicTripTypes(captainId),
  ]);

  if (!profileResult.success) {
    return (
      <div className="p-4 text-center text-sm text-slate-500">
        Booking unavailable.
      </div>
    );
  }

  const profile = profileResult.data!;
  const tripTypes = tripTypesResult.success ? tripTypesResult.data! : [];

  return (
    <BrandedLayout accentColor={profile.brand_accent_color || '#0891b2'}>
      <div className="p-2 sm:p-4">
        {/* Minimal header */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            {profile.business_name || profile.full_name || 'Book a Trip'}
          </h2>
          {profile.booking_tagline && (
            <p className="text-sm text-slate-500 mt-1">{profile.booking_tagline}</p>
          )}
        </div>

        {/* Trip Cards */}
        {tripTypes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <Anchor className="h-5 w-5 text-slate-400" />
              </div>
            </div>
            <p className="text-sm text-slate-400">No trips available at this time.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
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
                image_url={tripType.image_url}
                target="_top"
              />
            ))}
          </div>
        )}

        {/* Powered by DockSlot */}
        <p className="mt-4 text-center text-xs text-slate-300">
          Powered by DockSlot
        </p>
      </div>
    </BrandedLayout>
  );
}
