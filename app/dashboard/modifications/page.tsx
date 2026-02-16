import { requireAuth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import ModificationsClient from './ModificationsClient'
import { LockedFeatureOverlay } from '@/components/LockedFeatureOverlay'
import type { SubscriptionTier } from '@/lib/db/types'

export const metadata = {
  title: 'Modification Requests | DockSlot',
  description: 'Review and approve booking modification requests',
}

export default async function ModificationsPage() {
  const { user, supabase } = await requireAuth()

  // Get captain profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, subscription_tier')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/dashboard')
  }

  const subscriptionTier = (profile.subscription_tier ?? 'deckhand') as SubscriptionTier
  const isDeckhand = subscriptionTier === 'deckhand'

  const content = (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Modification Requests
        </h1>
        <p className="text-slate-400">
          Review and approve guest requests to change bookings
        </p>
      </div>

      <ModificationsClient />
    </div>
  )

  if (isDeckhand) {
    return (
      <LockedFeatureOverlay feature="booking_modifications" pattern="section">
        {content}
      </LockedFeatureOverlay>
    )
  }

  return content
}
