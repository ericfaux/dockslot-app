import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Star, Ship, Calendar, Users, Award, MapPin } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, bio')
    .eq('slug', slug)
    .single()

  if (!profile) {
    return {
      title: 'Captain Not Found | DockSlot',
    }
  }

  return {
    title: `${profile.business_name} - Charter Booking | DockSlot`,
    description: profile.bio || `Book your charter trip with ${profile.business_name}`,
  }
}

export default async function CaptainPublicProfilePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Get captain profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  // Get vessels
  const { data: vessels } = await supabase
    .from('vessels')
    .select('*')
    .eq('captain_id', profile.id)
    .order('name')

  // Get trip types
  const { data: tripTypes } = await supabase
    .from('trip_types')
    .select('*')
    .eq('captain_id', profile.id)
    .order('title')

  // Get reviews and ratings
  const { data: reviewsData } = await supabase
    .from('reviews')
    .select('*')
    .eq('captain_id', profile.id)
    .eq('is_public', true)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(10)

  const reviews = reviewsData || []

  // Get ratings summary
  const { data: ratingsData } = await supabase
    .rpc('get_captain_ratings', { captain_id_param: profile.id })
    .single()

  const ratings = (ratingsData as any) || {
    total_reviews: 0,
    average_overall: 0,
    average_vessel: 0,
    average_captain: 0,
    average_experience: 0,
    rating_distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
  }

  const featuredReviews = reviews.filter(r => r.is_featured).slice(0, 3)
  const regularReviews = reviews.filter(r => !r.is_featured)

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-4">
              {profile.business_name}
            </h1>
            {profile.tagline && (
              <p className="text-xl text-cyan-300 mb-6">
                {profile.tagline}
              </p>
            )}
            
            {/* Ratings Summary */}
            {ratings.total_reviews > 0 && (
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 ${
                          star <= Math.round(ratings.average_overall)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {ratings.average_overall.toFixed(1)}
                  </span>
                </div>
                <div className="text-slate-300">
                  {ratings.total_reviews} review{ratings.total_reviews !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {profile.meeting_location && (
              <div className="flex items-center justify-center gap-2 text-slate-300 mb-8">
                <MapPin className="w-5 h-5" />
                <span>{profile.meeting_location}</span>
              </div>
            )}

            <Link
              href={`/c/${profile.id}`}
              className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold text-lg hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/30"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* About Section */}
        {profile.bio && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-6">About</h2>
            <p className="text-lg text-slate-300 leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Vessels Section */}
        {vessels && vessels.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Ship className="w-8 h-8 text-cyan-400" />
              Our Fleet
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vessels.map((vessel) => (
                <div
                  key={vessel.id}
                  className="p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-colors"
                >
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {vessel.name}
                  </h3>
                  {vessel.description && (
                    <p className="text-slate-400 text-sm mb-4">
                      {vessel.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                      Up to {vessel.max_passengers} passengers
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trip Types Section */}
        {tripTypes && tripTypes.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-cyan-400" />
              Trip Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tripTypes.map((tripType) => (
                <div
                  key={tripType.id}
                  className="p-6 bg-slate-800 rounded-xl border border-slate-700"
                >
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {tripType.title}
                  </h3>
                  {tripType.description && (
                    <p className="text-slate-400 mb-4">
                      {tripType.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">
                      {tripType.duration_hours}h trip
                    </span>
                    <span className="text-2xl font-bold text-cyan-400">
                      ${(tripType.base_price / 100).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Reviews */}
        {featuredReviews.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-400" />
              Featured Reviews
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-6 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl border border-amber-500/20"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= review.overall_rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  {review.review_title && (
                    <h4 className="font-semibold text-white mb-2">
                      {review.review_title}
                    </h4>
                  )}
                  {review.review_text && (
                    <p className="text-slate-300 text-sm mb-3 line-clamp-4">
                      {review.review_text}
                    </p>
                  )}
                  <div className="text-sm text-slate-400">
                    — {review.guest_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Reviews */}
        {regularReviews.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Star className="w-8 h-8 text-cyan-400" />
              All Reviews
            </h2>
            <div className="space-y-6">
              {regularReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-6 bg-slate-800 rounded-xl border border-slate-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.overall_rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="font-semibold text-white">{review.guest_name}</p>
                    </div>
                    <span className="text-sm text-slate-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.review_title && (
                    <h4 className="font-semibold text-white mb-2">
                      {review.review_title}
                    </h4>
                  )}
                  {review.review_text && (
                    <p className="text-slate-300 mb-3 whitespace-pre-wrap">
                      {review.review_text}
                    </p>
                  )}
                  {review.captain_response && (
                    <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border-l-4 border-cyan-500">
                      <p className="text-sm font-medium text-cyan-400 mb-1">
                        Response from {profile.business_name}
                      </p>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">
                        {review.captain_response}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center py-16 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-2xl border border-cyan-500/20">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Book Your Adventure?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Choose your trip and reserve your spot today
          </p>
          <Link
            href={`/c/${profile.id}`}
            className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold text-lg hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/30"
          >
            View Available Dates
          </Link>
        </div>
      </div>
    </div>
  )
}
