'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Navigation,
  Users,
  FileCheck,
  CreditCard,
  Phone,
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
  CloudSun,
  AlertTriangle,
  Send,
  CloudRain,
  Eye,
  CheckCircle,
  Anchor,
  Wind,
  Thermometer,
} from 'lucide-react';
import { BookingStatus, PaymentStatus } from '@/lib/db/types';
import { setWeatherHold } from '@/app/actions/bookings';
import { format, parseISO, isPast, isFuture, isToday, isTomorrow } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

export interface FloatPlanTrip {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  tripType: string;
  guestName: string;
  guestPhone: string | null;
  partySize: number;
  vesselCapacity: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  waiversSigned: number;
  waiversTotal: number;
}

export interface WeatherSummary {
  temperature?: number;
  windSpeed?: string;
  windDirection?: string;
  condition?: string;
  hasAdvisory: boolean;
  advisoryMessage?: string;
}

export interface FloatPlanWidgetProps {
  todayTrips: FloatPlanTrip[];
  tomorrowTrips: FloatPlanTrip[];
  nextUpcomingTrip: FloatPlanTrip | null;
  weather?: WeatherSummary | null;
  timezone: string;
}

// ============================================================================
// Helper Components
// ============================================================================

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const config: Record<PaymentStatus, { label: string; bg: string; text: string; border: string }> = {
    unpaid: {
      label: 'Balance Due',
      bg: 'bg-rose-500/20',
      text: 'text-rose-300',
      border: 'border-rose-500/30',
    },
    deposit_paid: {
      label: 'Deposit Paid',
      bg: 'bg-amber-500/20',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
    },
    fully_paid: {
      label: 'Paid in Full',
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-300',
      border: 'border-emerald-500/30',
    },
    partially_refunded: {
      label: 'Partial Refund',
      bg: 'bg-slate-500/20',
      text: 'text-slate-300',
      border: 'border-slate-500/30',
    },
    fully_refunded: {
      label: 'Refunded',
      bg: 'bg-slate-500/20',
      text: 'text-slate-300',
      border: 'border-slate-500/30',
    },
  };

  const { label, bg, text, border } = config[status] || config.unpaid;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${bg} ${text} ${border}`}>
      <CreditCard className="h-3 w-3" />
      {label}
    </span>
  );
}

function WaiverBadge({ signed, total }: { signed: number; total: number }) {
  const allSigned = signed === total && total > 0;
  const noneSigned = signed === 0;

  let bg, text, border;
  if (allSigned) {
    bg = 'bg-emerald-500/20';
    text = 'text-emerald-300';
    border = 'border-emerald-500/30';
  } else if (noneSigned) {
    bg = 'bg-rose-500/20';
    text = 'text-rose-300';
    border = 'border-rose-500/30';
  } else {
    bg = 'bg-amber-500/20';
    text = 'text-amber-300';
    border = 'border-amber-500/30';
  }

  const label = allSigned ? 'All Signed' : noneSigned ? 'None Signed' : `${signed}/${total} Signed`;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${bg} ${text} ${border}`}>
      <FileCheck className="h-3 w-3" />
      {label}
    </span>
  );
}

function TimelineIndicator({ status }: { status: 'past' | 'current' | 'upcoming' }) {
  if (status === 'past') {
    return (
      <div className="flex flex-col items-center">
        <div className="h-3 w-3 rounded-full bg-slate-600" />
        <div className="mt-1 h-full w-0.5 bg-slate-700" />
      </div>
    );
  }

  if (status === 'current') {
    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="h-4 w-4 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50" />
          <div className="absolute inset-0 h-4 w-4 animate-ping rounded-full bg-cyan-400 opacity-75" />
        </div>
        <div className="mt-1 h-full w-0.5 bg-gradient-to-b from-cyan-500 to-slate-700" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="h-3 w-3 rounded-full border-2 border-slate-500 bg-slate-800" />
      <div className="mt-1 h-full w-0.5 bg-slate-700" />
    </div>
  );
}

// ============================================================================
// Trip Card Component
// ============================================================================

interface TripCardProps {
  trip: FloatPlanTrip;
  timelineStatus: 'past' | 'current' | 'upcoming';
  showTimeline?: boolean;
}

function TripCard({ trip, timelineStatus, showTimeline = true }: TripCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [weatherReason, setWeatherReason] = useState('');

  const isPastTrip = timelineStatus === 'past';
  const isCurrent = timelineStatus === 'current';

  const startTime = parseISO(trip.scheduledStart);
  const formattedTime = format(startTime, 'h:mm a');

  const handleWeatherHold = async () => {
    if (!weatherReason.trim()) return;

    startTransition(async () => {
      const result = await setWeatherHold(trip.id, weatherReason);
      if (result.success) {
        setShowWeatherModal(false);
        setWeatherReason('');
        router.refresh();
      }
    });
  };

  const cardClasses = isPastTrip
    ? 'opacity-50 bg-slate-800/30'
    : isCurrent
    ? 'bg-slate-800 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/10'
    : 'bg-slate-800/50 hover:bg-slate-800/70';

  return (
    <div className="flex gap-3">
      {/* Timeline */}
      {showTimeline && (
        <div className="flex-shrink-0 w-6 flex flex-col items-center pt-2">
          <TimelineIndicator status={timelineStatus} />
        </div>
      )}

      {/* Card */}
      <div className={`flex-1 rounded-lg border border-slate-700 p-4 transition-all ${cardClasses}`}>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg font-mono text-lg font-bold ${
              isCurrent ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700 text-slate-300'
            }`}>
              {format(startTime, 'h:mm')}
              <span className="text-xs ml-0.5 opacity-70">{format(startTime, 'a')}</span>
            </div>
            <div>
              <h3 className="font-semibold text-white">{trip.tripType}</h3>
              <p className="text-sm text-slate-400">{trip.guestName}</p>
            </div>
          </div>

          {/* Party Size */}
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-700/50 px-2.5 py-1.5">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">
              {trip.partySize} of {trip.vesselCapacity}
            </span>
          </div>
        </div>

        {/* Phone Number - Tap to Call (min 44px touch target) */}
        {trip.guestPhone && (
          <a
            href={`tel:${trip.guestPhone}`}
            className="mb-3 flex items-center gap-2 rounded-lg bg-slate-700/30 px-3 py-3 min-h-[44px] text-sm text-cyan-300 hover:bg-slate-700/50 transition-colors active:scale-[0.98]"
          >
            <Phone className="h-4 w-4" />
            <span className="font-mono">{trip.guestPhone}</span>
          </a>
        )}

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <PaymentBadge status={trip.paymentStatus} />
          <WaiverBadge signed={trip.waiversSigned} total={trip.waiversTotal} />
        </div>

        {/* Quick Actions - touch-friendly 44px min targets */}
        {!isPastTrip && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/schedule?bookingId=${trip.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2.5 min-h-[44px] text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors active:scale-[0.98]"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Link>

            <Link
              href={`/dashboard/schedule?bookingId=${trip.id}&action=message`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2.5 min-h-[44px] text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors active:scale-[0.98]"
            >
              <Send className="h-4 w-4" />
              Send Reminder
            </Link>

            {['confirmed', 'rescheduled'].includes(trip.status) && (
              <button
                onClick={() => setShowWeatherModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-2.5 min-h-[44px] text-sm font-medium text-amber-300 hover:bg-amber-500/30 transition-colors active:scale-[0.98]"
              >
                <CloudRain className="h-4 w-4" />
                Weather Hold
              </button>
            )}
          </div>
        )}

        {/* Completed indicator for past trips */}
        {isPastTrip && trip.status === 'completed' && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Completed</span>
          </div>
        )}
      </div>

      {/* Weather Hold Modal */}
      {showWeatherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                <CloudRain className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Set Weather Hold</h3>
                <p className="text-sm text-slate-400">{trip.guestName} - {formattedTime}</p>
              </div>
            </div>

            <textarea
              value={weatherReason}
              onChange={(e) => setWeatherReason(e.target.value)}
              placeholder="Enter weather hold reason..."
              className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              rows={3}
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setShowWeatherModal(false);
                  setWeatherReason('');
                }}
                className="flex-1 rounded-lg border border-slate-600 px-4 py-2.5 font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWeatherHold}
                disabled={isPending || !weatherReason.trim()}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 font-medium text-white hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Setting...' : 'Set Weather Hold'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Weather Summary Component
// ============================================================================

function WeatherSummaryBanner({ weather }: { weather: WeatherSummary }) {
  if (weather.hasAdvisory) {
    return (
      <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-300">
              {weather.advisoryMessage || 'Weather advisory in effect - review trips'}
            </p>
          </div>
          {weather.windSpeed && (
            <div className="flex items-center gap-1.5 text-sm text-amber-300">
              <Wind className="h-4 w-4" />
              {weather.windSpeed}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
      <div className="flex items-center gap-4">
        <CloudSun className="h-5 w-5 text-cyan-400" />
        <span className="text-sm text-slate-300">
          {weather.condition || 'Good conditions'}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-400">
        {weather.temperature && (
          <span className="flex items-center gap-1">
            <Thermometer className="h-4 w-4" />
            {weather.temperature}°F
          </span>
        )}
        {weather.windSpeed && (
          <span className="flex items-center gap-1">
            <Wind className="h-4 w-4" />
            {weather.windSpeed} {weather.windDirection || ''}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Tomorrow Preview Component
// ============================================================================

function TomorrowPreview({ trips }: { trips: FloatPlanTrip[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (trips.length === 0) return null;

  return (
    <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-slate-400" />
          <span className="font-medium text-slate-300">Tomorrow</span>
          <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-300">
            {trips.length} trip{trips.length !== 1 ? 's' : ''}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-slate-700 p-4 space-y-3">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium text-cyan-300">
                  {format(parseISO(trip.scheduledStart), 'h:mm a')}
                </span>
                <span className="text-sm text-slate-300">{trip.tripType}</span>
                <span className="text-sm text-slate-500">- {trip.guestName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm text-slate-400">
                  <Users className="h-4 w-4" />
                  {trip.partySize}
                </span>
                <Link
                  href={`/dashboard/schedule?bookingId=${trip.id}`}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState({ nextTrip }: { nextTrip: FloatPlanTrip | null }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-700/50">
        <Anchor className="h-8 w-8 text-slate-500" />
      </div>

      <h3 className="font-semibold text-lg text-slate-300 mb-2">
        No trips scheduled for today
      </h3>

      {nextTrip ? (
        <div className="mt-4 rounded-lg bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400 mb-2">Next trip:</p>
          <div className="flex items-center justify-center gap-3">
            <Calendar className="h-5 w-5 text-cyan-400" />
            <span className="font-medium text-white">
              {format(parseISO(nextTrip.scheduledStart), 'EEEE, MMM d')} at{' '}
              {format(parseISO(nextTrip.scheduledStart), 'h:mm a')}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {nextTrip.tripType} - {nextTrip.guestName}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Your upcoming bookings will appear here
        </p>
      )}

      <Link
        href="/dashboard/schedule"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors"
      >
        <Calendar className="h-4 w-4" />
        View full schedule
      </Link>
    </div>
  );
}

// ============================================================================
// Main Widget Component
// ============================================================================

export function FloatPlanWidget({
  todayTrips,
  tomorrowTrips,
  nextUpcomingTrip,
  weather,
  timezone,
}: FloatPlanWidgetProps) {
  const now = new Date();

  // Determine timeline status for each trip
  const getTimelineStatus = (trip: FloatPlanTrip): 'past' | 'current' | 'upcoming' => {
    const start = parseISO(trip.scheduledStart);
    const end = parseISO(trip.scheduledEnd);

    if (isPast(end)) {
      return 'past';
    }
    if (isPast(start) && isFuture(end)) {
      return 'current';
    }
    // Check if this is the next upcoming trip
    const upcomingTrips = todayTrips.filter((t) => {
      const tEnd = parseISO(t.scheduledEnd);
      return !isPast(tEnd);
    });
    if (upcomingTrips.length > 0 && upcomingTrips[0].id === trip.id) {
      return 'current';
    }
    return 'upcoming';
  };

  // No trips today
  if (todayTrips.length === 0) {
    return (
      <div>
        {weather && <WeatherSummaryBanner weather={weather} />}
        <EmptyState nextTrip={nextUpcomingTrip} />
        <TomorrowPreview trips={tomorrowTrips} />
      </div>
    );
  }

  return (
    <div>
      {/* Weather Summary */}
      {weather && <WeatherSummaryBanner weather={weather} />}

      {/* Today's Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyan-400" />
          <span className="font-medium text-slate-300">Today's Trips</span>
          <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
            {todayTrips.length}
          </span>
        </div>
        <Link
          href="/dashboard/schedule"
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Trip Cards with Timeline */}
      <div className="space-y-4">
        {todayTrips.map((trip, index) => (
          <TripCard
            key={trip.id}
            trip={trip}
            timelineStatus={getTimelineStatus(trip)}
            showTimeline={todayTrips.length > 1}
          />
        ))}
      </div>

      {/* Tomorrow Preview */}
      <TomorrowPreview trips={tomorrowTrips} />
    </div>
  );
}

export default FloatPlanWidget;
