'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CloudRain,
  Wind,
  CheckCircle2,
  Loader2,
  ChevronRight,
  RefreshCw,
  Calendar,
  Waves,
  Cloud,
  Sun,
} from 'lucide-react';
import { format, addHours, addDays } from 'date-fns';

interface WeatherConditions {
  isSafe: boolean;
  recommendation: 'safe' | 'caution' | 'dangerous';
  reason?: string;
  windSpeed?: string;
  alerts: Array<{
    event: string;
    severity: string;
    headline: string;
    description: string;
  }>;
  forecast?: {
    periods: Array<{
      name: string;
      temperature: number;
      windSpeed: string;
      windDirection: string;
      shortForecast: string;
    }>;
  } | null;
}

interface WeatherAlertWidgetProps {
  lat: number | null;
  lon: number | null;
  upcomingBookingsCount?: number;
}

export default function WeatherAlertWidget({
  lat,
  lon,
  upcomingBookingsCount = 0,
}: WeatherAlertWidgetProps) {
  const [conditions, setConditions] = useState<WeatherConditions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchWeather = async () => {
    if (!lat || !lon) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/weather/check?lat=${lat}&lon=${lon}&date=${new Date().toISOString()}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch weather');
      }

      const data = await response.json();
      setConditions(data.conditions);
      setLastChecked(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check weather');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lat, lon]);

  // Parse wind speed to check if it's concerning (>15mph)
  const parseWindSpeed = (windSpeedStr?: string): number | null => {
    if (!windSpeedStr) return null;
    const match = windSpeedStr.match(/(\d+)\s*(?:to\s*(\d+))?\s*mph/);
    if (match) {
      return parseInt(match[2] || match[1]);
    }
    return null;
  };

  const maxWind = parseWindSpeed(conditions?.windSpeed);
  const isWindConcerning = maxWind !== null && maxWind > 15;

  // Generate URL for bookings in next 48 hours
  const get48hBookingsUrl = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const in2days = format(addDays(new Date(), 2), 'yyyy-MM-dd');
    return `/dashboard/bookings?status=confirmed,rescheduled&startDate=${today}&endDate=${in2days}`;
  };

  // No coordinates set - show setup message
  if (!lat || !lon) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <CloudRain className="h-5 w-5 text-slate-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-slate-700">Weather Alerts</h3>
            <p className="text-sm text-slate-500">
              Set your meeting spot location in Settings to enable weather monitoring
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Settings
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !conditions) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
          <span className="text-sm text-slate-500">Checking marine conditions...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <span className="text-sm text-rose-700">{error}</span>
          </div>
          <button
            onClick={fetchWeather}
            className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Dangerous conditions - prominent red alert
  if (conditions?.recommendation === 'dangerous') {
    return (
      <div className="rounded-lg border-2 border-rose-300 bg-gradient-to-r from-rose-50 to-rose-50/50 p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 animate-pulse">
            <AlertTriangle className="h-6 w-6 text-rose-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-rose-800 text-lg">Dangerous Weather Alert</h3>
            </div>
            <p className="text-rose-700 text-sm mb-3">
              {conditions.alerts[0]?.headline || conditions.reason || 'Unsafe conditions detected'}
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {conditions.windSpeed && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-100 px-3 py-1.5">
                  <Wind className="h-4 w-4 text-rose-700" />
                  <span className="text-sm font-medium text-rose-800">{conditions.windSpeed}</span>
                </div>
              )}
              {conditions.alerts.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-100 px-3 py-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-700" />
                  <span className="text-sm font-medium text-rose-800">
                    {conditions.alerts.length} Active Alert{conditions.alerts.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Call to Action */}
            {upcomingBookingsCount > 0 && (
              <Link
                href={get48hBookingsUrl()}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 font-semibold text-white hover:bg-rose-700 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Review {upcomingBookingsCount} Upcoming Booking{upcomingBookingsCount !== 1 ? 's' : ''}
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <button
            onClick={fetchWeather}
            disabled={isLoading}
            className="rounded-lg p-2 text-rose-400 hover:bg-rose-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-[10px] text-rose-400 opacity-50 text-right mt-1">Source: NOAA Marine Forecast</p>
      </div>
    );
  }

  // Caution conditions - amber warning
  if (conditions?.recommendation === 'caution' || isWindConcerning) {
    return (
      <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/50 p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <CloudRain className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-amber-800">Weather Advisory</h3>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Review Recommended
              </span>
            </div>
            <p className="text-amber-700 text-sm mb-3">
              {conditions?.alerts[0]?.headline ||
               conditions?.reason ||
               (isWindConcerning ? `Winds ${conditions?.windSpeed} - consider weather holds for affected trips` : 'Weather conditions may affect trips')}
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {conditions?.windSpeed && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-100 border border-amber-200 px-3 py-1.5">
                  <Wind className="h-4 w-4 text-amber-700" />
                  <span className="text-sm font-medium text-amber-800">{conditions.windSpeed}</span>
                </div>
              )}
              {conditions?.forecast?.periods[0] && (
                <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-1.5">
                  <Cloud className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">{conditions.forecast.periods[0].shortForecast}</span>
                </div>
              )}
            </div>

            {/* Call to Action */}
            {upcomingBookingsCount > 0 && (
              <Link
                href={get48hBookingsUrl()}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 font-medium text-amber-800 hover:bg-amber-200 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Review {upcomingBookingsCount} Booking{upcomingBookingsCount !== 1 ? 's' : ''} in Next 48h
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <button
            onClick={fetchWeather}
            disabled={isLoading}
            className="rounded-lg p-2 text-amber-500 hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-[10px] text-amber-400 opacity-50 text-right mt-1">Source: NOAA Marine Forecast</p>
      </div>
    );
  }

  // Safe conditions - compact green indicator
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-medium text-emerald-800">Good Conditions</h3>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              {conditions?.windSpeed && (
                <span className="flex items-center gap-1">
                  <Wind className="h-3.5 w-3.5" />
                  {conditions.windSpeed}
                </span>
              )}
              {conditions?.forecast?.periods[0] && (
                <span className="flex items-center gap-1">
                  <Sun className="h-3.5 w-3.5" />
                  {conditions.forecast.periods[0].shortForecast}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastChecked && (
            <span className="text-xs text-slate-400">
              Updated {format(lastChecked, 'h:mm a')}
            </span>
          )}
          <button
            onClick={fetchWeather}
            disabled={isLoading}
            className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 opacity-50 text-right mt-1">Source: NOAA Marine Forecast</p>
    </div>
  );
}
