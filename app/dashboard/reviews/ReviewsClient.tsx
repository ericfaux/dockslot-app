'use client'

import { useState, useEffect } from 'react'
import { Star, MessageSquare, Eye, EyeOff, Award, Trash2, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'

interface ReviewsClientProps {
  captainId: string
}

interface Review {
  id: string
  overall_rating: number
  vessel_rating: number | null
  captain_rating: number | null
  experience_rating: number | null
  review_title: string | null
  review_text: string | null
  guest_name: string
  is_featured: boolean
  is_public: boolean
  captain_response: string | null
  captain_response_at: string | null
  created_at: string
}

interface Ratings {
  total_reviews: number
  average_overall: number
  average_vessel: number
  average_captain: number
  average_experience: number
  rating_distribution: Record<string, number>
}

export default function ReviewsClient({ captainId }: ReviewsClientProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [ratings, setRatings] = useState<Ratings | null>(null)
  const [loading, setLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')

  useEffect(() => {
    loadReviews()
  }, [])

  async function loadReviews() {
    try {
      setLoading(true)
      const res = await fetch(`/api/reviews?captainId=${captainId}&includePrivate=true`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews)
        setRatings(data.ratings)
      }
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  async function togglePublic(reviewId: string, currentValue: boolean) {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !currentValue }),
      })
      if (res.ok) {
        loadReviews()
      }
    } catch (err) {
      console.error('Failed to toggle public:', err)
    }
  }

  async function toggleFeatured(reviewId: string, currentValue: boolean) {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !currentValue }),
      })
      if (res.ok) {
        loadReviews()
      }
    } catch (err) {
      console.error('Failed to toggle featured:', err)
    }
  }

  async function submitResponse(reviewId: string) {
    if (!responseText.trim()) return

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captain_response: responseText }),
      })
      if (res.ok) {
        setRespondingTo(null)
        setResponseText('')
        loadReviews()
      }
    } catch (err) {
      console.error('Failed to submit response:', err)
    }
  }

  async function deleteReview(reviewId: string) {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        loadReviews()
      }
    } catch (err) {
      console.error('Failed to delete review:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Ratings Summary */}
      {ratings && ratings.total_reviews > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <Star className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Average Rating</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {ratings.average_overall.toFixed(1)} / 5.0
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-lg">
                <MessageSquare className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Reviews</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {ratings.total_reviews}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <Star className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Vessel Rating</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {ratings.average_vessel ? ratings.average_vessel.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Star className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Captain Rating</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {ratings.average_captain ? ratings.average_captain.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            description="Reviews build trust with new guests. After your first completed trip, we'll automatically ask your guest for a review."
            actions={[
              { label: 'View Completed Trips', href: '/dashboard/bookings?status=completed' },
            ]}
          />
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className={`p-6 bg-slate-800 rounded-xl border ${
                review.is_featured
                  ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
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
                    {review.is_featured && (
                      <Award className="w-5 h-5 text-amber-400" />
                    )}
                    {!review.is_public && (
                      <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-400">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-white">{review.guest_name}</p>
                  <p className="text-sm text-slate-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFeatured(review.id, review.is_featured)}
                    className={`p-2 rounded-lg transition-colors ${
                      review.is_featured
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-700 text-slate-400 hover:text-white'
                    }`}
                    title={review.is_featured ? 'Remove from featured' : 'Mark as featured'}
                  >
                    <Award className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => togglePublic(review.id, review.is_public)}
                    className={`p-2 rounded-lg transition-colors ${
                      review.is_public
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700 text-slate-400 hover:text-white'
                    }`}
                    title={review.is_public ? 'Hide from public' : 'Show publicly'}
                  >
                    {review.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="p-2 bg-slate-700 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                    title="Delete review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Review Content */}
              {review.review_title && (
                <h3 className="text-lg font-semibold text-white mb-2">
                  {review.review_title}
                </h3>
              )}
              {review.review_text && (
                <p className="text-slate-300 mb-4 whitespace-pre-wrap">
                  {review.review_text}
                </p>
              )}

              {/* Detailed Ratings */}
              {(review.vessel_rating || review.captain_rating || review.experience_rating) && (
                <div className="flex gap-4 mb-4 text-sm">
                  {review.vessel_rating && (
                    <div>
                      <span className="text-slate-500">Vessel: </span>
                      <span className="text-white">{review.vessel_rating}/5</span>
                    </div>
                  )}
                  {review.captain_rating && (
                    <div>
                      <span className="text-slate-500">Captain: </span>
                      <span className="text-white">{review.captain_rating}/5</span>
                    </div>
                  )}
                  {review.experience_rating && (
                    <div>
                      <span className="text-slate-500">Experience: </span>
                      <span className="text-white">{review.experience_rating}/5</span>
                    </div>
                  )}
                </div>
              )}

              {/* Captain Response */}
              {review.captain_response ? (
                <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border-l-4 border-cyan-500">
                  <p className="text-sm font-medium text-cyan-400 mb-1">Your Response</p>
                  <p className="text-slate-300 whitespace-pre-wrap">
                    {review.captain_response}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(review.captain_response_at!).toLocaleDateString()}
                  </p>
                </div>
              ) : respondingTo === review.id ? (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitResponse(review.id)}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
                    >
                      Submit Response
                    </button>
                    <button
                      onClick={() => {
                        setRespondingTo(null)
                        setResponseText('')
                      }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setRespondingTo(review.id)}
                  className="mt-4 px-4 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Respond to Review
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
