import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ReviewsClient from './ReviewsClient'

export const metadata = {
  title: 'Reviews | DockSlot',
  description: 'Manage guest reviews and ratings',
}

export default async function ReviewsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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
          Reviews & Ratings
        </h1>
        <p className="text-slate-400">
          Manage guest reviews, respond to feedback, and showcase testimonials
        </p>
      </div>

      <ReviewsClient captainId={profile.id} />
    </div>
  )
}
