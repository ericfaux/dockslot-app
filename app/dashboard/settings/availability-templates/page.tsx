import { requireAuth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import AvailabilityTemplatesClient from './AvailabilityTemplatesClient'

export const metadata = {
  title: 'Availability Templates | DockSlot',
  description: 'Manage recurring weekly availability schedules',
}

export default async function AvailabilityTemplatesPage() {
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Availability Templates
        </h1>
        <p className="text-slate-400">
          Create reusable weekly schedules to quickly set your availability
        </p>
      </div>

      <AvailabilityTemplatesClient />
    </div>
  )
}
