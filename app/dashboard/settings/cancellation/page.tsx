import { requireAuth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import CancellationPolicyEditor from './CancellationPolicyEditor'

export const metadata = {
  title: 'Cancellation Policies | DockSlot',
  description: 'Configure cancellation policies for your trip types',
}

export default async function CancellationPoliciesPage() {
  const { user, supabase } = await requireAuth()

  // Get captain profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/dashboard')
  }

  // Get all trip types for this captain
  const { data: tripTypes } = await supabase
    .from('trip_types')
    .select('*')
    .eq('captain_id', profile.id)
    .order('title')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Cancellation Policies
        </h1>
        <p className="text-slate-400">
          Configure refund policies for each trip type. Policies are shown to guests before booking.
        </p>
      </div>

      {tripTypes && tripTypes.length > 0 ? (
        <CancellationPolicyEditor tripTypes={tripTypes} />
      ) : (
        <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
          <p className="text-slate-400">
            No trip types found. Create a trip type first to configure cancellation policies.
          </p>
        </div>
      )}
    </div>
  )
}
