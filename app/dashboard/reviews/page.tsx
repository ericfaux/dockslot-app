import { requireAuth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import ReviewsClient from './ReviewsClient'
import { LockedFeatureOverlay } from '@/components/LockedFeatureOverlay'
import type { SubscriptionTier } from '@/lib/db/types'

export const metadata = {
  title: 'Reviews | DockSlot',
  description: 'Manage guest reviews and ratings',
}

export default async function ReviewsPage() {
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
          Reviews & Ratings
        </h1>
        <p className="text-slate-400">
          Manage guest reviews, respond to feedback, and showcase testimonials
        </p>
      </div>

      <ReviewsClient captainId={profile.id} />
    </div>
  )

  if (isDeckhand) {
    return (
      <LockedFeatureOverlay feature="reviews_ratings" pattern="section">
        {content}
      </LockedFeatureOverlay>
    )
  }

  return content
}
