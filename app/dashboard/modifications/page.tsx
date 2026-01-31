import { requireAuth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import ModificationsClient from './ModificationsClient'

export const metadata = {
  title: 'Modification Requests | DockSlot',
  description: 'Review and approve booking modification requests',
}

export default async function ModificationsPage() {
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

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Modification Requests
        </h1>
        <p className="text-slate-400">
          Review and approve guest requests to change bookings
        </p>
      </div>

      <ModificationsClient />
    </div>
  )
}
