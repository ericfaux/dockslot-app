'use client'

import { useEffect, useState } from 'react'
import {
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  Users,
  Clock,
} from 'lucide-react'

interface QuickStats {
  todayBookings: number
  weekBookings: number
  monthRevenue: number
  pendingDeposits: number
  upcomingTrips: number
  revenueChange: number
}

import type { SubscriptionTier } from '@/lib/db/types'

interface QuickStatsWidgetsProps {
  captainId: string
  subscriptionTier?: SubscriptionTier
}

export default function QuickStatsWidgets({
  captainId,
  subscriptionTier = 'deckhand',
}: QuickStatsWidgetsProps) {
  const isDeckhand = subscriptionTier === 'deckhand'
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setHasError(false)
        const response = await fetch(`/api/dashboard/quick-stats?captainId=${captainId}`)
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          setHasError(true)
        }
      } catch (error) {
        console.error('Error fetching quick stats:', error)
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [captainId])

  // Don't render anything while loading or on error — avoids persistent skeleton states
  if (isLoading || hasError || !stats) {
    return null
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  // Get current month for analytics filter
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

  const widgets = [
    {
      icon: Calendar,
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-50',
      label: 'Today',
      value: stats.todayBookings.toString(),
      subtext: stats.todayBookings === 1 ? 'booking' : 'bookings',
      link: '/dashboard/schedule',
    },
    {
      icon: Clock,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      label: 'This Week',
      value: stats.weekBookings.toString(),
      subtext: stats.weekBookings === 1 ? 'booking' : 'bookings',
      link: '/dashboard/schedule',
    },
    {
      icon: DollarSign,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      label: 'Month Revenue',
      value: formatCurrency(stats.monthRevenue),
      subtext:
        stats.revenueChange >= 0
          ? `+${stats.revenueChange.toFixed(1)}% from last month`
          : `${stats.revenueChange.toFixed(1)}% from last month`,
      subtextColor:
        stats.revenueChange >= 0 ? 'text-emerald-600' : 'text-rose-600',
      link: `/dashboard/reports?view=revenue&month=${currentMonth}`,
    },
    {
      icon: AlertCircle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      label: 'Pending Deposits',
      value: stats.pendingDeposits.toString(),
      subtext: 'needs attention',
      link: '/dashboard/bookings?status=pending_deposit',
    },
    {
      icon: Users,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      label: 'Upcoming',
      value: stats.upcomingTrips.toString(),
      subtext: 'next 7 days',
      link: '/dashboard/schedule',
    },
    {
      icon: TrendingUp,
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-50',
      label: 'Avg Booking',
      value: formatCurrency(
        stats.monthRevenue / (stats.weekBookings || 1) * 4 // Rough estimate
      ),
      subtext: 'this month',
      link: `/dashboard/reports?view=analytics&month=${currentMonth}`,
    },
  ]

  // Deckhand: only show basic counts (Today, This Week, Upcoming). Hide revenue-related stats.
  const visibleWidgets = isDeckhand
    ? widgets.filter((w) => ['Today', 'This Week', 'Upcoming'].includes(w.label))
    : widgets

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visibleWidgets.map((widget, index) => {
        const Icon = widget.icon
        const Wrapper = widget.link ? 'a' : 'div'
        const wrapperProps = widget.link
          ? { href: widget.link, className: 'block' }
          : {}

        return (
          <Wrapper key={index} {...wrapperProps}>
            <div
              className={`rounded-lg border border-slate-200 bg-white p-4 transition-all ${
                widget.link ? 'hover:border-cyan-300 hover:shadow-sm' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                    {widget.label}
                  </div>
                  <div className="mb-1 font-mono text-2xl font-bold text-slate-900">
                    {widget.value}
                  </div>
                  <div
                    className={`text-xs ${
                      widget.subtextColor || 'text-slate-500'
                    }`}
                  >
                    {widget.subtext}
                  </div>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${widget.iconBg}`}
                >
                  <Icon className={`h-6 w-6 ${widget.iconColor}`} />
                </div>
              </div>
            </div>
          </Wrapper>
        )
      })}
    </div>
  )
}
