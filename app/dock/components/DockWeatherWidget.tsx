'use client';

// app/dock/components/DockWeatherWidget.tsx
// Compact weather indicator for Dock Mode home screen
// Tap to expand to full weather view

import { useDockMode } from '../context/DockModeContext';
import {
  Cloud,
  Wind,
  Thermometer,
  Waves,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export function DockWeatherWidget() {
  const { weather, goToWeather } = useDockMode();

  // No weather data available
  if (!weather) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-center">
        <p className="text-lg text-slate-500">Weather data unavailable</p>
        <p className="text-sm text-slate-600">Set meeting spot in Settings</p>
      </div>
    );
  }

  return (
    <button
      onClick={goToWeather}
      className="w-full rounded-2xl border-2 border-slate-700 bg-slate-900 p-5 text-left transition-colors active:bg-slate-800"
    >
      {/* Warning Banner (if applicable) */}
      {weather.hasWarning && weather.warningMessage && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-500/20 border border-amber-500/50 px-4 py-3">
          <AlertTriangle className="h-7 w-7 flex-shrink-0 text-amber-400" />
          <p className="text-lg font-bold text-amber-300">{weather.warningMessage}</p>
        </div>
      )}

      {/* Weather Data Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Temperature */}
          {weather.temperature !== null && (
            <div className="flex items-center gap-2">
              <Thermometer className="h-8 w-8 text-cyan-400" />
              <span className="text-4xl font-bold text-white">
                {weather.temperature}°
              </span>
            </div>
          )}

          {/* Wind */}
          {weather.windSpeed !== null && (
            <div className="flex items-center gap-2">
              <Wind className="h-8 w-8 text-cyan-400" />
              <div>
                <span className="text-3xl font-bold text-white">
                  {weather.windSpeed}
                </span>
                <span className="ml-1 text-lg text-slate-400">kts</span>
                {weather.windDirection && (
                  <span className="ml-2 text-lg text-slate-400">
                    {weather.windDirection}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Wave Height */}
          {weather.waveHeight !== null && (
            <div className="flex items-center gap-2">
              <Waves className="h-8 w-8 text-cyan-400" />
              <div>
                <span className="text-3xl font-bold text-white">
                  {weather.waveHeight.toFixed(1)}
                </span>
                <span className="ml-1 text-lg text-slate-400">ft</span>
              </div>
            </div>
          )}
        </div>

        {/* Tap for more indicator */}
        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-base">Details</span>
          <ChevronRight className="h-6 w-6" />
        </div>
      </div>

      {/* Current Conditions */}
      {weather.conditions && (
        <p className="mt-3 text-lg text-slate-400">{weather.conditions}</p>
      )}
    </button>
  );
}
