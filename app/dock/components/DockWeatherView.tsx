'use client';

// app/dock/components/DockWeatherView.tsx
// Expanded weather view for Dock Mode
// Shows detailed conditions and 4-hour forecast

import { useDockMode } from '../context/DockModeContext';
import {
  ArrowLeft,
  Cloud,
  Wind,
  Thermometer,
  Waves,
  AlertTriangle,
  Sun,
  CloudRain,
} from 'lucide-react';

export function DockWeatherView() {
  const { weather, goBack } = useDockMode();

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* Header with Back Button */}
      <header className="flex items-center gap-4 border-b border-slate-800 px-4 py-3">
        <button
          onClick={goBack}
          className="flex min-h-[60px] min-w-[60px] items-center justify-center rounded-xl bg-slate-800 text-white active:bg-slate-700"
          aria-label="Go back"
        >
          <ArrowLeft className="h-8 w-8" />
        </button>
        <h1 className="text-2xl font-bold text-white">Weather Conditions</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {!weather ? (
            <NoWeatherData />
          ) : (
            <>
              {/* Warning Alert */}
              {weather.hasWarning && weather.warningMessage && (
                <div className="rounded-2xl border-2 border-amber-500 bg-amber-500/20 p-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-10 w-10 flex-shrink-0 text-amber-400" />
                    <div>
                      <h2 className="text-2xl font-bold text-amber-300 mb-2">
                        Weather Advisory
                      </h2>
                      <p className="text-xl text-amber-200">
                        {weather.warningMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Conditions Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Temperature */}
                <WeatherCard
                  icon={<Thermometer className="h-10 w-10 text-cyan-400" />}
                  label="Water Temp"
                  value={weather.temperature !== null ? `${weather.temperature}°F` : '--'}
                />

                {/* Wind Speed */}
                <WeatherCard
                  icon={<Wind className="h-10 w-10 text-cyan-400" />}
                  label="Wind"
                  value={
                    weather.windSpeed !== null
                      ? `${weather.windSpeed} kts`
                      : '--'
                  }
                  subtitle={weather.windDirection || undefined}
                />

                {/* Wave Height */}
                <WeatherCard
                  icon={<Waves className="h-10 w-10 text-cyan-400" />}
                  label="Waves"
                  value={
                    weather.waveHeight !== null
                      ? `${weather.waveHeight.toFixed(1)} ft`
                      : '--'
                  }
                />

                {/* Conditions */}
                <WeatherCard
                  icon={<Cloud className="h-10 w-10 text-cyan-400" />}
                  label="Conditions"
                  value={weather.conditions || 'Unknown'}
                  isText
                />
              </div>

              {/* 4-Hour Forecast */}
              {weather.forecast.length > 0 && (
                <div className="rounded-2xl border-2 border-slate-700 bg-slate-900 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">
                    4-Hour Forecast
                  </h2>
                  <div className="grid grid-cols-4 gap-3">
                    {weather.forecast.map((period, index) => (
                      <ForecastCard key={index} {...period} />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Action */}
              <div className="text-center">
                <p className="text-lg text-slate-400 mb-3">
                  Conditions looking rough?
                </p>
                <a
                  href="/dashboard/bookings"
                  className="inline-flex min-h-[60px] items-center justify-center gap-3 rounded-xl bg-amber-600 px-8 text-white active:bg-amber-700"
                >
                  <AlertTriangle className="h-6 w-6" />
                  <span className="text-xl font-bold">Review Bookings</span>
                </a>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Bottom safe area */}
      <div className="h-6" />
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function NoWeatherData() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
      <Cloud className="mx-auto h-16 w-16 text-slate-600 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">
        Weather Unavailable
      </h2>
      <p className="text-lg text-slate-400 mb-6">
        Set your meeting spot location in Settings to see weather data.
      </p>
      <a
        href="/dashboard/settings"
        className="inline-flex min-h-[60px] items-center justify-center gap-3 rounded-xl bg-cyan-600 px-8 text-white active:bg-cyan-700"
      >
        <span className="text-xl font-bold">Go to Settings</span>
      </a>
    </div>
  );
}

interface WeatherCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  isText?: boolean;
}

function WeatherCard({ icon, label, value, subtitle, isText }: WeatherCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <span className="text-base text-slate-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p
        className={`font-bold text-white ${
          isText ? 'text-xl' : 'text-4xl'
        }`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-lg text-slate-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

interface ForecastCardProps {
  time: string;
  temperature: number;
  windSpeed: number;
  conditions: string;
}

function ForecastCard({ time, temperature, windSpeed, conditions }: ForecastCardProps) {
  // Determine icon based on conditions
  const getIcon = () => {
    const lower = conditions.toLowerCase();
    if (lower.includes('rain') || lower.includes('shower')) {
      return <CloudRain className="h-8 w-8 text-blue-400" />;
    }
    if (lower.includes('cloud')) {
      return <Cloud className="h-8 w-8 text-slate-400" />;
    }
    return <Sun className="h-8 w-8 text-amber-400" />;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4 text-center">
      <p className="text-base font-bold text-white mb-2">{time}</p>
      {getIcon()}
      <p className="text-2xl font-bold text-white mt-2">{temperature}°</p>
      <p className="text-sm text-slate-400 mt-1">{windSpeed} kts</p>
    </div>
  );
}
