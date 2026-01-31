'use client'

import { useState } from 'react'
import { Star, Send, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ReviewSubmissionFormProps {
  bookingId: string
  token: string
}

export default function ReviewSubmissionForm({ bookingId, token }: ReviewSubmissionFormProps) {
  const router = useRouter()
  const [overallRating, setOverallRating] = useState(0)
  const [vesselRating, setVesselRating] = useState(0)
  const [captainRating, setCaptainRating] = useState(0)
  const [experienceRating, setExperienceRating] = useState(0)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (overallRating === 0) {
      setError('Please provide an overall rating')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          token,
          overall_rating: overallRating,
          vessel_rating: vesselRating || null,
          captain_rating: captainRating || null,
          experience_rating: experienceRating || null,
          review_title: reviewTitle || null,
          review_text: reviewText || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit review')
      }

      setIsSubmitted(true)
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
        <Check className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Thank You!
        </h2>
        <p className="text-slate-400">
          Your review has been submitted successfully.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Overall Rating */}
      <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
        <label className="block text-lg font-semibold text-white mb-4">
          Overall Rating <span className="text-rose-400">*</span>
        </label>
        <StarRating
          value={overallRating}
          onChange={setOverallRating}
          size="large"
        />
      </div>

      {/* Detailed Ratings */}
      <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 space-y-6">
        <h3 className="text-lg font-semibold text-white">
          Detailed Ratings (Optional)
        </h3>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Vessel Condition
          </label>
          <StarRating value={vesselRating} onChange={setVesselRating} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Captain Service
          </label>
          <StarRating value={captainRating} onChange={setCaptainRating} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Overall Experience
          </label>
          <StarRating value={experienceRating} onChange={setExperienceRating} />
        </div>
      </div>

      {/* Written Review */}
      <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Written Review (Optional)
        </h3>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Review Title
          </label>
          <input
            type="text"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            placeholder="e.g., Amazing sunset cruise!"
            maxLength={200}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Your Review
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Tell us about your experience..."
            rows={6}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
          />
          <p className="mt-2 text-xs text-slate-500">
            {reviewText.length} characters
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || overallRating === 0}
        className="w-full px-6 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-semibold"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Submit Review
          </>
        )}
      </button>
    </form>
  )
}

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  size?: 'normal' | 'large'
}

function StarRating({ value, onChange, size = 'normal' }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)
  const iconSize = size === 'large' ? 'w-10 h-10' : 'w-6 h-6'

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverValue || value)
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`${iconSize} transition-colors ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-600'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}
