'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { BookingFilterState } from '../schedule/BookingFilters'

interface ExportButtonProps {
  captainId: string
  filters: BookingFilterState
  totalCount: number
}

export function ExportButton({
  captainId,
  filters,
  totalCount,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)

    try {
      // Build query params from filters
      const params = new URLSearchParams({ captainId })

      if (filters.search) params.append('search', filters.search)
      if (filters.tags.length > 0)
        params.append('tags', filters.tags.join(','))
      if (filters.statuses.length > 0)
        params.append('status', filters.statuses.join(','))
      if (filters.paymentStatus.length > 0)
        params.append('paymentStatus', filters.paymentStatus.join(','))
      if (filters.dateRange.start)
        params.append('startDate', filters.dateRange.start)
      if (filters.dateRange.end) params.append('endDate', filters.dateRange.end)

      // Fetch CSV
      const response = await fetch(`/api/bookings/export?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'bookings_export.csv'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
      console.error('Export error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={isExporting || totalCount === 0}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isExporting ? 'Exporting...' : `Export${totalCount > 0 ? ` (${totalCount})` : ''}`}
      </button>
      {error && (
        <p className="mt-2 text-sm text-rose-600">{error}</p>
      )}
    </div>
  )
}
