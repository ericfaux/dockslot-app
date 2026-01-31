import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ModificationRequestForm from './ModificationRequestForm'

export const metadata = {
  title: 'Request Booking Modification | DockSlot',
  description: 'Request changes to your booking',
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function ModifyBookingPage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()

  // Get booking by token
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      guest_name,
      party_size,
      scheduled_start,
      scheduled_end,
      status,
      management_token,
      vessels(name, max_passengers),
      trip_types(title, duration_hours)
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
            The modification link is invalid or has expired.
          </p>
        </div>
      </div>
    )
  }

  // Check if booking can be modified
  const canModify = ['confirmed', 'pending_deposit', 'rescheduled'].includes(booking.status)
  
  if (!canModify) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Cannot Modify Booking
          </h1>
          <p className="text-slate-400">
            This booking cannot be modified. Status: {booking.status}
          </p>
        </div>
      </div>
    )
  }

  const vessel = booking.vessels as any
  const tripType = booking.trip_types as any

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Request Booking Modification
          </h1>
          <p className="text-slate-400">
            Submit a request to change your booking details
          </p>
        </div>

        <div className="mb-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <h2 className="text-sm uppercase tracking-wider text-slate-500 mb-4">
            Current Booking
          </h2>
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
              <span className="text-sm text-slate-500">Party Size</span>
              <span className="text-white">{booking.party_size} guests</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Date & Time</span>
              <span className="text-white">
                {new Date(booking.scheduled_start).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <ModificationRequestForm
          bookingId={booking.id}
          token={token}
          currentPartySize={booking.party_size}
          currentScheduledStart={booking.scheduled_start}
          currentScheduledEnd={booking.scheduled_end}
          maxPassengers={vessel?.max_passengers || 10}
          durationHours={tripType?.duration_hours || 2}
        />
      </div>
    </div>
  )
}
