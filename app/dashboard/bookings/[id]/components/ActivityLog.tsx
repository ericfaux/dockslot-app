'use client';

import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Clock,
  Calendar,
  CreditCard,
  User,
  FileText,
  CloudRain,
  Mail,
  Edit3,
  CheckCircle,
  XCircle,
  RotateCcw,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Anchor,
} from 'lucide-react';
import { BookingLog } from '@/lib/db/types';

interface TimelineEvent {
  id: string;
  timestamp: string;
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
  title: string;
  description: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

interface ActivityLogProps {
  logs: BookingLog[];
  isLoading: boolean;
}

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  booking_created: { icon: Calendar, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  status_changed: { icon: Edit3, color: 'text-amber-600', bg: 'bg-amber-50' },
  payment_received: { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  payment_refunded: { icon: RotateCcw, color: 'text-purple-600', bg: 'bg-purple-50' },
  waiver_signed: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  passenger_added: { icon: User, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  passenger_updated: { icon: User, color: 'text-slate-500', bg: 'bg-slate-500/20' },
  rescheduled: { icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
  weather_hold_set: { icon: CloudRain, color: 'text-amber-600', bg: 'bg-amber-50' },
  note_added: { icon: Edit3, color: 'text-slate-500', bg: 'bg-slate-500/20' },
  guest_communication: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
  completed: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  cancelled: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  balance_requested: { icon: DollarSign, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  default: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500/20' },
};

function getEventConfig(eventType: string) {
  return EVENT_CONFIG[eventType] || EVENT_CONFIG.default;
}

function formatActorType(actorType: string): string {
  switch (actorType) {
    case 'captain':
      return 'Captain';
    case 'guest':
      return 'Guest';
    case 'system':
      return 'System';
    default:
      return actorType;
  }
}

export function ActivityLog({ logs, isLoading }: ActivityLogProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Process and merge logs into timeline events
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Process booking logs
    logs.forEach((log) => {
      const config = getEventConfig(log.entry_type);
      const Icon = config.icon;

      events.push({
        id: `log-${log.id}`,
        timestamp: log.created_at,
        icon: <Icon className="h-4 w-4" />,
        iconColor: config.color,
        bgColor: config.bg,
        title: formatLogTitle(log.entry_type),
        description: log.description,
        actor: formatActorType(log.actor_type),
        metadata: {
          old_value: log.old_value,
          new_value: log.new_value,
        },
      });
    });

    // Sort by timestamp (newest first)
    return events.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [logs]);

  const displayedEvents = isExpanded ? timelineEvents : timelineEvents.slice(0, 5);
  const hasMore = timelineEvents.length > 5;

  return (
    <section
      aria-label="Activity Log"
      className="rounded-lg border border-slate-200 bg-white p-6 print:border-slate-300 print:bg-white"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-600 print:text-cyan-600">
          <Anchor className="h-5 w-5" />
          Captain&apos;s Log
        </h2>
        {timelineEvents.length > 0 && (
          <span className="text-xs text-slate-500">{timelineEvents.length} entries</span>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : timelineEvents.length === 0 ? (
        <div className="rounded bg-slate-50 p-6 text-center print:bg-slate-100">
          <Clock className="mx-auto mb-2 h-8 w-8 text-slate-500" />
          <p className="text-slate-400">No activity recorded yet</p>
        </div>
      ) : (
        <>
          {/* Timeline */}
          <div className="space-y-4">
            {displayedEvents.map((event, index) => (
              <div key={event.id} className="flex gap-3">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${event.bgColor} ${event.iconColor}`}
                  >
                    {event.icon}
                  </div>
                  {index < displayedEvents.length - 1 && (
                    <div className="h-full w-px bg-slate-100 print:bg-slate-300" />
                  )}
                </div>

                {/* Event content */}
                <div className="min-w-0 flex-1 pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-slate-700 print:text-black">
                        {event.title}
                      </h4>
                      <p className="mt-0.5 text-sm text-slate-500 print:text-slate-600">
                        {event.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <time>{format(parseISO(event.timestamp), 'MMM d, yyyy • h:mm a')}</time>
                    {event.actor && (
                      <>
                        <span>•</span>
                        <span>{event.actor}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-slate-200 py-2 text-sm text-cyan-600 transition-colors hover:bg-slate-100 print:hidden"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show {timelineEvents.length - 5} More Entries
                </>
              )}
            </button>
          )}
        </>
      )}
    </section>
  );
}

// Helper functions
function formatLogTitle(entryType: string): string {
  const titles: Record<string, string> = {
    booking_created: 'Booking Created',
    status_changed: 'Status Updated',
    payment_received: 'Payment Received',
    payment_refunded: 'Refund Issued',
    waiver_signed: 'Waiver Signed',
    passenger_added: 'Passenger Added',
    passenger_updated: 'Passenger Updated',
    rescheduled: 'Booking Rescheduled',
    weather_hold_set: 'Weather Hold Set',
    note_added: 'Note Added',
    guest_communication: 'Message Sent',
    completed: 'Trip Completed',
    cancelled: 'Booking Cancelled',
    balance_requested: 'Balance Requested',
  };

  return titles[entryType] || entryType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

