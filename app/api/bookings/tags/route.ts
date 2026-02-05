import { NextResponse } from 'next/server'

/**
 * GET /api/bookings/tags
 * Returns all unique tags used across bookings for the current captain
 *
 * Note: Tags feature is disabled until the database migration is applied.
 * See: supabase/migrations/20260131_booking_notes_tags.sql
 */
export async function GET() {
  // Tags feature disabled - migration not yet applied to production
  // Return empty array to prevent UI errors
  return NextResponse.json({ tags: [] })
}
