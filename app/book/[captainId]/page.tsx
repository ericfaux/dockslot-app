import { Anchor, AlertTriangle, MapPin, CheckCircle } from 'lucide-react';
import { getPublicCaptainProfile, getPublicTripTypes, getHibernationInfo, getCaptainSocialProof } from '@/app/actions/public-booking';
import { TripCard } from '../components/TripCard';
import { CaptainInfoCard, CancellationPolicy, StarRating } from '@/components/booking/TrustSignals';
import { HibernationPage } from '../components/HibernationPage';

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

  // Fetch captain profile, trip types, and social proof in parallel
  const [profileResult, tripTypesResult, socialProofResult] = await Promise.all([
    getPublicCaptainProfile(captainId),
    getPublicTripTypes(captainId),
    getCaptainSocialProof(captainId),
  ]);

  // Handle hibernating captain with enhanced page
  if (!profileResult.success && profileResult.code === 'HIBERNATING') {
    const hibernationResult = await getHibernationInfo(captainId);
    if (hibernationResult.success && hibernationResult.data) {
      return <HibernationPage info={hibernationResult.data} />;
    }
  }

  // Handle other errors
  if (!profileResult.success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Captain Not Found
            </h1>
            <p className="text-slate-500">
              {profileResult.error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const profile = profileResult.data!;
  const tripTypes = tripTypesResult.success ? tripTypesResult.data! : [];
  const socialProof = socialProofResult.success ? socialProofResult.data! : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
                <Anchor className="h-5 w-5 text-cyan-700" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  {profile.business_name || profile.full_name || 'Charter Captain'}
                </h1>
                <p className="text-sm text-slate-500">Book Your Trip</p>
              </div>
            </div>

            {/* Desktop Step Indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-white text-sm font-medium">
                1
              </span>
              <span className="text-sm text-slate-500">of 4</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Mobile Progress Indicator */}
        <div className="sm:hidden mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-900">Step 1 of 4</span>
            <span className="text-sm text-cyan-700 font-medium">Select Trip</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-600 w-1/4 transition-all duration-300 rounded-full" />
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
          className="mb-4"
        />

        {/* Social Proof Bar */}
        {socialProof && (socialProof.review_stats || socialProof.completed_trips > 0) && (
          <div className="flex flex-wrap items-center gap-4 mb-6 px-1">
            {socialProof.review_stats && (
              <StarRating
                rating={socialProof.review_stats.average_overall}
                totalReviews={socialProof.review_stats.total_reviews}
              />
            )}
            {socialProof.completed_trips > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>{socialProof.completed_trips} trips completed</span>
              </div>
            )}
          </div>
        )}

        {/* Cancellation Policy Summary */}
        {profile.cancellation_policy && (
          <CancellationPolicy
            policy={profile.cancellation_policy}
            className="mb-6"
          />
        )}

        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Select Your Trip</h2>
          <p className="text-slate-500">
            Choose from the available charter experiences below.
          </p>
        </div>

        {/* Trip Cards */}
        {tripTypes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Anchor className="h-6 w-6 text-slate-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Trips Available</h3>
            <p className="text-slate-500">
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

        {/* Featured Reviews */}
        {socialProof?.review_stats?.featured_reviews && socialProof.review_stats.featured_reviews.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">What Guests Say</h3>
            <div className="space-y-3">
              {socialProof.review_stats.featured_reviews.map((review, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= review.overall_rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-slate-200 text-slate-200'
                          }`}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{review.guest_name}</span>
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-slate-600 line-clamp-2">&ldquo;{review.review_text}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-slate-400">
            Powered by DockSlot
          </p>
        </div>
      </footer>
    </div>
  );
}
