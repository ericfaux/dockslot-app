export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth/server'
import { BookingsListClient } from './BookingsListClient'
import { expireOverdueBookings } from '@/app/actions/bookings'

/**
 * Bookings List Page - Server Component
 * Fetches captain profile and renders filterable bookings list
 */

export default async function BookingsListPage() {
  const { user, supabase } = await requireAuth()

  // Get captain profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('[Bookings] Profile query failed for user:', user.id, profileError)
  }

  // Use fallback value if profile query fails - user is still authenticated
  const captainId = profile?.id ?? user.id

  // Expire overdue pending_deposit bookings before rendering the list
  await expireOverdueBookings(captainId).catch((err) => {
    console.error('Error expiring overdue bookings on bookings list load:', err);
  });

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold text-slate-800">
            All Bookings
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Search, filter, and manage all your bookings
          </p>
        </div>
      </div>

      {/* Bookings List with Filters */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      }>
        <BookingsListClient captainId={captainId} />
      </Suspense>
    </div>
  )
}
