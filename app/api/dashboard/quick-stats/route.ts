import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, addDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get captain ID from query
    const searchParams = request.nextUrl.searchParams
    const captainId = searchParams.get('captainId')

    if (!captainId) {
      return NextResponse.json(
        { error: 'captainId is required' },
        { status: 400 }
      )
    }

    // Verify user is the captain
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.id !== captainId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))
    const next7Days = addDays(now, 7)

    // Today's bookings
    const { count: todayCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('captain_id', captainId)
      .gte('scheduled_start', todayStart.toISOString())
      .lte('scheduled_start', todayEnd.toISOString())
      .in('status', ['confirmed', 'rescheduled'])

    // This week's bookings
    const { count: weekCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('captain_id', captainId)
      .gte('scheduled_start', weekStart.toISOString())
      .lte('scheduled_start', weekEnd.toISOString())
      .in('status', ['confirmed', 'rescheduled', 'pending_deposit'])

    // This month's revenue (deposit + balance paid)
    const { data: monthBookings } = await supabase
      .from('bookings')
      .select('deposit_paid_cents, total_price_cents, payment_status')
      .eq('captain_id', captainId)
      .gte('scheduled_start', monthStart.toISOString())
      .lte('scheduled_start', monthEnd.toISOString())

    const monthRevenue = (monthBookings || []).reduce((sum, b) => {
      // Count deposit for all, plus balance if fully paid
      if (b.payment_status === 'fully_paid') {
        return sum + b.total_price_cents
      } else if (b.payment_status === 'deposit_paid') {
        return sum + b.deposit_paid_cents
      }
      return sum
    }, 0)

    // Last month's revenue for comparison
    const { data: lastMonthBookings } = await supabase
      .from('bookings')
      .select('deposit_paid_cents, total_price_cents, payment_status')
      .eq('captain_id', captainId)
      .gte('scheduled_start', lastMonthStart.toISOString())
      .lte('scheduled_start', lastMonthEnd.toISOString())

    const lastMonthRevenue = (lastMonthBookings || []).reduce((sum, b) => {
      if (b.payment_status === 'fully_paid') {
        return sum + b.total_price_cents
      } else if (b.payment_status === 'deposit_paid') {
        return sum + b.deposit_paid_cents
      }
      return sum
    }, 0)

    const revenueChange =
      lastMonthRevenue > 0
        ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0

    // Pending deposits
    const { count: pendingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('captain_id', captainId)
      .eq('status', 'pending_deposit')
      .gte('scheduled_start', now.toISOString()) // Only upcoming

    // Upcoming trips (next 7 days)
    const { count: upcomingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('captain_id', captainId)
      .gte('scheduled_start', now.toISOString())
      .lte('scheduled_start', next7Days.toISOString())
      .in('status', ['confirmed', 'rescheduled'])

    return NextResponse.json({
      todayBookings: todayCount || 0,
      weekBookings: weekCount || 0,
      monthRevenue,
      revenueChange,
      pendingDeposits: pendingCount || 0,
      upcomingTrips: upcomingCount || 0,
    })
  } catch (error) {
    console.error('Error fetching quick stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
