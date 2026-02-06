'use client'

import { useState, useEffect } from 'react'
import { Calendar, Download, Filter, TrendingUp, Users, DollarSign, Ship, Anchor, Loader2, BarChart3 } from 'lucide-react'

interface Vessel {
  id: string
  name: string
}

interface TripType {
  id: string
  title: string
}

interface ReportsClientProps {
  vessels: Vessel[]
  tripTypes: TripType[]
}

interface ReportMetrics {
  totalBookings: number
  totalRevenue: number
  depositsCollected: number
  totalGuests: number
  averageBookingValue: number
  averagePartySize: number
}

interface ReportBreakdowns {
  status: Record<string, number>
  payment: Record<string, number>
  vessel: Record<string, number>
  tripType: Record<string, number>
}

interface ReportData {
  metrics: ReportMetrics
  breakdowns: ReportBreakdowns
  charts: {
    revenueByMonth: Array<{ month: string; revenue: number }>
  }
  bookings: any[]
}

export default function ReportsClient({ vessels, tripTypes }: ReportsClientProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('')
  const [vesselId, setVesselId] = useState('')
  const [tripTypeId, setTripTypeId] = useState('')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)

  useEffect(() => {
    loadReport()
  }, [startDate, endDate, status, vesselId, tripTypeId])

  async function loadReport() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (status) params.set('status', status)
      if (vesselId) params.set('vesselId', vesselId)
      if (tripTypeId) params.set('tripTypeId', tripTypeId)

      const res = await fetch(`/api/reports/bookings?${params}`)
      if (res.ok) {
        const reportData = await res.json()
        setData(reportData)
      }
    } catch (err) {
      console.error('Failed to load report:', err)
    } finally {
      setLoading(false)
    }
  }

  function clearFilters() {
    setStartDate('')
    setEndDate('')
    setStatus('')
    setVesselId('')
    setTripTypeId('')
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
        <p className="text-slate-400">No data available</p>
      </div>
    )
  }

  const { metrics, breakdowns, charts } = data

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending_deposit">Pending Deposit</option>
              <option value="weather_hold">Weather Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Vessel
            </label>
            <select
              value={vesselId}
              onChange={(e) => setVesselId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="">All Vessels</option>
              {vessels.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Trip Type
            </label>
            <select
              value={tripTypeId}
              onChange={(e) => setTripTypeId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="">All Trip Types</option>
              {tripTypes.map(tt => (
                <option key={tt.id} value={tt.id}>{tt.title}</option>
              ))}
            </select>
          </div>
        </div>

        {(startDate || endDate || status || vesselId || tripTypeId) && (
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 text-sm text-cyan-600 hover:text-cyan-600 transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          icon={<Anchor className="w-6 h-6" />}
          label="Total Bookings"
          value={metrics.totalBookings.toString()}
          color="cyan"
        />
        <MetricCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Total Revenue"
          value={`$${(metrics.totalRevenue / 100).toFixed(2)}`}
          color="emerald"
        />
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          label="Total Guests"
          value={metrics.totalGuests.toString()}
          color="blue"
        />
        <MetricCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Deposits Collected"
          value={`$${(metrics.depositsCollected / 100).toFixed(2)}`}
          color="amber"
        />
        <MetricCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Avg Booking Value"
          value={`$${(metrics.averageBookingValue / 100).toFixed(2)}`}
          color="purple"
        />
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          label="Avg Party Size"
          value={metrics.averagePartySize.toString()}
          color="rose"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Month */}
        {charts.revenueByMonth.length > 0 && (
          <div className="p-6 bg-white rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-600" />
              Revenue by Month
            </h3>
            <div className="space-y-3">
              {charts.revenueByMonth.map(({ month, revenue }) => {
                const maxRevenue = Math.max(...charts.revenueByMonth.map(m => m.revenue))
                const percentage = (revenue / maxRevenue) * 100
                return (
                  <div key={month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400">{month}</span>
                      <span className="text-sm font-mono text-slate-900">
                        ${(revenue / 100).toFixed(0)}
                      </span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Status Breakdown */}
        <div className="p-6 bg-white rounded-xl border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Status Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(breakdowns.status).map(([status, count]) => {
              const total = metrics.totalBookings
              const percentage = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-400 capitalize">
                      {status.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-mono text-slate-900">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Additional Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by Vessel */}
        {Object.keys(breakdowns.vessel).length > 0 && (
          <div className="p-6 bg-white rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Ship className="w-5 h-5 text-cyan-600" />
              Bookings by Vessel
            </h3>
            <div className="space-y-3">
              {Object.entries(breakdowns.vessel)
                .sort(([, a], [, b]) => b - a)
                .map(([vessel, count]) => {
                  const max = Math.max(...Object.values(breakdowns.vessel))
                  const percentage = (count / max) * 100
                  return (
                    <div key={vessel}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-400">{vessel}</span>
                        <span className="text-sm font-mono text-slate-900">{count}</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Bookings by Trip Type */}
        {Object.keys(breakdowns.tripType).length > 0 && (
          <div className="p-6 bg-white rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Anchor className="w-5 h-5 text-cyan-600" />
              Bookings by Trip Type
            </h3>
            <div className="space-y-3">
              {Object.entries(breakdowns.tripType)
                .sort(([, a], [, b]) => b - a)
                .map(([tripType, count]) => {
                  const max = Math.max(...Object.values(breakdowns.tripType))
                  const percentage = (count / max) * 100
                  return (
                    <div key={tripType}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-400">{tripType}</span>
                        <span className="text-sm font-mono text-slate-900">{count}</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  color: 'cyan' | 'emerald' | 'blue' | 'amber' | 'purple' | 'rose'
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
  const colorClasses = {
    cyan: 'bg-cyan-50 text-cyan-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-500/10 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-500/10 text-purple-600',
    rose: 'bg-rose-50 text-rose-600',
  }

  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
      </div>
    </div>
  )
}
