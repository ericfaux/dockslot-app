'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Clock,
  CreditCard,
  User,
  Calendar,
  Mail,
  FileText,
  CloudRain,
  CheckCircle,
  XCircle,
  Edit3,
  DollarSign,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface BookingLog {
  id: string
  booking_id: string
  entry_type: string
  description: string
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  actor_type: string
  actor_id: string | null
  created_at: string
}

interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: string
  changed_fields: string[] | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  user_id: string | null
  created_at: string
}

interface TimelineEvent {
  id: string
  timestamp: string
  type: 'booking_log' | 'audit_log'
  icon: React.ReactNode
  iconColor: string
  title: string
  description: string
  metadata?: Record<string, unknown>
}

interface BookingTimelineProps {
  bookingId: string
}

const EVENT_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  booking_created: { icon: Calendar, color: 'text-cyan-400' },
  status_changed: { icon: Edit3, color: 'text-amber-400' },
  payment_received: { icon: CreditCard, color: 'text-emerald-400' },
  payment_refunded: { icon: RotateCcw, color: 'text-purple-400' },
  waiver_signed: { icon: FileText, color: 'text-blue-400' },
  passenger_added: { icon: User, color: 'text-cyan-400' },
  passenger_updated: { icon: User, color: 'text-slate-400' },
  rescheduled: { icon: Calendar, color: 'text-amber-400' },
  weather_hold_set: { icon: CloudRain, color: 'text-amber-400' },
  note_added: { icon: Edit3, color: 'text-slate-400' },
  guest_communication: { icon: Mail, color: 'text-blue-400' },
  completed: { icon: CheckCircle, color: 'text-emerald-400' },
  cancelled: { icon: XCircle, color: 'text-rose-400' },
  balance_requested: { icon: DollarSign, color: 'text-cyan-400' },
  default: { icon: Clock, color: 'text-slate-400' },
}

function getEventIcon(eventType: string) {
  return EVENT_ICONS[eventType] || EVENT_ICONS.default
}

export default function BookingTimeline({ bookingId }: BookingTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTimeline = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/bookings/${bookingId}/timeline`)
        if (!response.ok) {
          throw new Error('Failed to fetch timeline')
        }

        const data = await response.json()
        const processedEvents = processTimelineData(data.logs, data.auditLogs)
        setEvents(processedEvents)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load timeline')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTimeline()
  }, [bookingId])

  const processTimelineData = (
    logs: BookingLog[],
    auditLogs: AuditLog[]
  ): TimelineEvent[] => {
    const allEvents: TimelineEvent[] = []

    // Process booking logs
    logs.forEach((log) => {
      const { icon: Icon, color } = getEventIcon(log.entry_type)
      allEvents.push({
        id: `log-${log.id}`,
        timestamp: log.created_at,
        type: 'booking_log',
        icon: <Icon className="h-4 w-4" />,
        iconColor: color,
        title: formatLogTitle(log.entry_type),
        description: log.description,
        metadata: {
          old_value: log.old_value,
          new_value: log.new_value,
          actor: log.actor_type,
        },
      })
    })

    // Process audit logs
    auditLogs.forEach((log) => {
      const { icon: Icon, color } = getEventIcon(log.action)
      allEvents.push({
        id: `audit-${log.id}`,
        timestamp: log.created_at,
        type: 'audit_log',
        icon: <Icon className="h-4 w-4" />,
        iconColor: color,
        title: formatAuditTitle(log.action, log.changed_fields),
        description: formatAuditDescription(log),
        metadata: {
          changed_fields: log.changed_fields,
          old_values: log.old_values,
          new_values: log.new_values,
        },
      })
    })

    // Sort by timestamp (newest first)
    return allEvents.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  const formatLogTitle = (entryType: string): string => {
    return entryType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatAuditTitle = (
    action: string,
    changedFields: string[] | null
  ): string => {
    if (action === 'update' && changedFields && changedFields.length > 0) {
      const fields = changedFields.map((f) =>
        f.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      )
      return `Updated ${fields.join(', ')}`
    }
    return action.charAt(0).toUpperCase() + action.slice(1)
  }

  const formatAuditDescription = (log: AuditLog): string => {
    if (log.action === 'update' && log.changed_fields) {
      const changes = log.changed_fields
        .map((field) => {
          const oldVal = log.old_values?.[field]
          const newVal = log.new_values?.[field]
          if (oldVal !== undefined && newVal !== undefined) {
            return `${field}: ${JSON.stringify(oldVal)} → ${JSON.stringify(newVal)}`
          }
          return null
        })
        .filter(Boolean)
        .join(', ')

      return changes || 'Fields updated'
    }
    return `Booking ${log.action}`
  }

  const formatTimestamp = (isoString: string): string => {
    try {
      return format(parseISO(isoString), 'MMM d, yyyy • h:mm a')
    } catch {
      return isoString
    }
  }

  const displayedEvents = isExpanded ? events : events.slice(0, 5)
  const hasMore = events.length > 5

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-cyan-400">
          <Clock className="h-4 w-4" />
          Booking Timeline
        </h3>
        {events.length > 0 && (
          <span className="text-xs text-slate-500">{events.length} events</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded bg-rose-500/10 p-3 text-sm text-rose-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded bg-slate-900/30 p-6 text-center text-sm text-slate-500">
          No timeline events yet
        </div>
      ) : (
        <>
          {/* Timeline Events */}
          <div className="space-y-4">
            {displayedEvents.map((event, index) => (
              <div key={event.id} className="flex gap-3">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 ring-2 ring-slate-700 ${event.iconColor}`}
                  >
                    {event.icon}
                  </div>
                  {index < displayedEvents.length - 1 && (
                    <div className="h-full w-px bg-slate-700" />
                  )}
                </div>

                {/* Event Content */}
                <div className="flex-1 pb-4">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h4 className="font-medium text-slate-200">{event.title}</h4>
                    <time className="flex-shrink-0 text-xs text-slate-500">
                      {formatTimestamp(event.timestamp)}
                    </time>
                  </div>
                  <p className="text-sm text-slate-400">{event.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-slate-700 py-2 text-sm text-cyan-400 transition-colors hover:bg-slate-700/50"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show {events.length - 5} More Events
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  )
}
