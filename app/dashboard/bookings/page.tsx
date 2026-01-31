export const dynamic = 'force-dynamic'

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { BookingsListClient } from './BookingsListClient'

/**
 * Bookings List Page - Server Component
 * Fetches captain profile and renders filterable bookings list
 */

export default async function BookingsListPage() {
  const supabase = await createSupabaseServerClient()

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
    redirect('/login')
  }

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold text-slate-100">
            All Bookings
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Search, filter, and manage all your bookings
          </p>
        </div>
      </div>

      {/* Bookings List with Filters */}
      <BookingsListClient captainId={profile.id} />
    </div>
  )
}
