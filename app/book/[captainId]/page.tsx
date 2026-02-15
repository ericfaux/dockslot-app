export const dynamic = 'force-dynamic';

import { Anchor, AlertTriangle, CheckCircle } from 'lucide-react';
import { getPublicCaptainProfile, getPublicTripTypes, getHibernationInfo, getCaptainSocialProof, resolveCaptainId } from '@/app/actions/public-booking';
import { TripCard } from '../components/TripCard';
import { BrandedLayout } from '../components/BrandedLayout';
import { CaptainInfoCard, CancellationPolicy, StarRating } from '@/components/booking/TrustSignals';
import { HibernationPage } from '../components/HibernationPage';
import { BookingHelpButton } from '../components/BookingHelpButton';

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
  const { captainId: rawId } = await params;

  // Resolve slug or UUID to captain ID
  const resolveResult = await resolveCaptainId(rawId);
  if (!resolveResult.success || !resolveResult.data) {
    const isTransient = resolveResult.code === 'DATABASE';
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
              {isTransient ? 'Temporarily Unavailable' : 'Captain Not Found'}
            </h1>
            <p className="text-slate-500">
              {isTransient
                ? 'We had trouble loading this booking page. Please refresh to try again.'
                : "We couldn\u0027t find a captain with this booking link."}
            </p>
          </div>
        </div>
      </div>
    );
  }
  const captainId = resolveResult.data;

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
  const hasHero = !!profile.hero_image_url;

  return (
    <BrandedLayout accentColor={profile.brand_accent_color || '#0891b2'}>
      <div className="min-h-screen bg-slate-50">
        {/* Hero or Standard Header */}
        {hasHero ? (
          <>
            {/* Hero Image Section */}
            <div className="relative h-48 sm:h-64 w-full overflow-hidden">
              <img
                src={profile.hero_image_url!}
                alt={profile.business_name || 'Charter'}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                    {profile.business_name || profile.full_name || 'Charter Captain'}
                  </h1>
                  {profile.booking_tagline && (
                    <p className="mt-1 text-sm sm:text-base text-white/90 drop-shadow">
                      {profile.booking_tagline}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Slim sticky nav below hero */}
            <div className="border-b border-slate-200 bg-white/95 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
              <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">
                  {profile.business_name || profile.full_name || 'Charter Captain'}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: 'var(--brand-accent)' }}
                  >
                    1
                  </span>
                  <span className="text-sm text-slate-500">of 4</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Standard Header (no hero image) */
          <header className="border-b border-slate-200 bg-white/95 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'var(--brand-accent-light)' }}
                  >
                    <Anchor className="h-5 w-5" style={{ color: 'var(--brand-accent)' }} />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-slate-900">
                      {profile.business_name || profile.full_name || 'Charter Captain'}
                    </h1>
                    <p className="text-sm text-slate-500">
                      {profile.booking_tagline || 'Book Your Trip'}
                    </p>
                  </div>
                </div>

                {/* Desktop Step Indicator */}
                <div className="hidden sm:flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: 'var(--brand-accent)' }}
                  >
                    1
                  </span>
                  <span className="text-sm text-slate-500">of 4</span>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Mobile Progress Indicator */}
          <div className="sm:hidden mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-900">Step 1 of 4</span>
              <span className="text-sm font-medium" style={{ color: 'var(--brand-accent)' }}>Select Trip</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full w-1/4 transition-all duration-300 rounded-full"
                style={{ backgroundColor: 'var(--brand-accent)' }}
              />
            </div>
          </div>

          {/* Captain Info Card */}
          <CaptainInfoCard
            name={profile.full_name || profile.business_name || 'Captain'}
            businessName={profile.business_name}
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
                  image_url={tripType.image_url}
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

      <BookingHelpButton
        email={profile.booking_help_email}
        phone={profile.booking_help_phone}
        captainName={profile.business_name || profile.full_name || null}
      />
    </BrandedLayout>
  );
}
