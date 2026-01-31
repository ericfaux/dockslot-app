import { requireAuth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import ReportsClient from './ReportsClient'

export const metadata = {
  title: 'Advanced Reports | DockSlot',
  description: 'Comprehensive booking analytics and reports',
}

export default async function AdvancedReportsPage() {
  const { user, supabase } = await requireAuth()

  // Get captain profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/dashboard')
  }

  // Get vessels and trip types for filters
  const { data: vessels } = await supabase
    .from('vessels')
    .select('id, name')
    .eq('captain_id', profile.id)
    .order('name')

  const { data: tripTypes } = await supabase
    .from('trip_types')
    .select('id, title')
    .eq('captain_id', profile.id)
    .order('title')

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Advanced Reports
        </h1>
        <p className="text-slate-400">
          Comprehensive booking analytics with filters and visualizations
        </p>
      </div>

      <ReportsClient
        vessels={vessels || []}
        tripTypes={tripTypes || []}
      />
    </div>
  )
}
