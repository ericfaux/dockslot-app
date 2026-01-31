import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ReviewSubmissionForm from './ReviewSubmissionForm'

export const metadata = {
  title: 'Review Your Trip | DockSlot',
  description: 'Share your experience and rate your trip',
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function ReviewPage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()

  // Get booking by token
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      guest_name,
      scheduled_start,
      status,
      management_token,
      vessels(name),
      trip_types(title),
      captain_profiles(business_name)
    `)
    .eq('management_token', token)
    .single()

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Booking Not Found
          </h1>
          <p className="text-slate-400">
            The review link is invalid or has expired.
          </p>
        </div>
      </div>
    )
  }

  // Check if booking is completed
  if (booking.status !== 'completed') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Trip Not Yet Completed
          </h1>
          <p className="text-slate-400">
            You can submit a review once your trip is complete.
          </p>
        </div>
      </div>
    )
  }

  // Check if review already exists
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', booking.id)
    .single()

  if (existingReview) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-emerald-400 mb-4">
            ✓ Review Already Submitted
          </h1>
          <p className="text-slate-400">
            Thank you for your feedback! You've already reviewed this trip.
          </p>
        </div>
      </div>
    )
  }

  const vessel = booking.vessels as any
  const tripType = booking.trip_types as any
  const captain = booking.captain_profiles as any

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            How Was Your Trip?
          </h1>
          <p className="text-slate-400">
            Share your experience with {captain?.business_name || 'us'}
          </p>
        </div>

        <div className="mb-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Guest</span>
              <span className="text-white">{booking.guest_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Trip</span>
              <span className="text-white">{tripType?.title || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Vessel</span>
              <span className="text-white">{vessel?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Date</span>
              <span className="text-white">
                {new Date(booking.scheduled_start).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <ReviewSubmissionForm
          bookingId={booking.id}
          token={token}
        />
      </div>
    </div>
  )
}
