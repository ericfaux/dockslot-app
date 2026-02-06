export const dynamic = 'force-dynamic'

import { requireAuth } from '@/lib/auth/server'
import { getTripTypes } from '@/app/actions/trips'
import { getVessels } from '@/app/actions/vessels'
import { NewBookingClient } from './NewBookingClient'

export default async function NewBookingPage() {
  const { user } = await requireAuth()

  const [tripTypesResult, vesselsResult] = await Promise.all([
    getTripTypes(),
    getVessels(),
  ])

  const tripTypes = tripTypesResult.success ? tripTypesResult.data ?? [] : []
  const vessels = vesselsResult.success ? vesselsResult.data ?? [] : []

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold text-slate-100">
          New Booking
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Create a manual booking on behalf of a guest
        </p>
      </div>

      <NewBookingClient
        captainId={user.id}
        tripTypes={tripTypes}
        vessels={vessels}
      />
    </div>
  )
}
