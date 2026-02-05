// components/booking/WeatherForecast.tsx
// Displays weather forecast for selected booking date using NOAA data
// Shows conditions relevant to fishing/boating charters

'use client';

import { useState, useEffect } from 'react';
import { Cloud, Wind, Thermometer, AlertTriangle, Sun, CloudRain, Loader2 } from 'lucide-react';

interface ForecastPeriod {
  name: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
}

interface WeatherData {
  forecast: ForecastPeriod | null;
  recommendation: 'safe' | 'caution' | 'dangerous';
  alerts: string[];
}

interface WeatherForecastProps {
  latitude: number;
  longitude: number;
  selectedDate: Date;
  className?: string;
}

function getWeatherIcon(forecast: string) {
  const lower = forecast.toLowerCase();
  if (lower.includes('rain') || lower.includes('shower') || lower.includes('thunder')) {
    return <CloudRain className="h-5 w-5" />;
  }
  if (lower.includes('cloud') || lower.includes('overcast')) {
    return <Cloud className="h-5 w-5" />;
  }
  return <Sun className="h-5 w-5" />;
}

export function WeatherForecast({ latitude, longitude, selectedDate, className = '' }: WeatherForecastProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get grid point first
        const pointRes = await fetch(
          `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`,
          { headers: { 'User-Agent': '(DockSlot Marina Booking, contact@dockslot.app)' } }
        );

        if (!pointRes.ok) throw new Error('Unable to fetch location data');

        const pointData = await pointRes.json();
        const { gridId, gridX, gridY } = pointData.properties;

        // Get forecast
        const forecastRes = await fetch(
          `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast`,
          { headers: { 'User-Agent': '(DockSlot Marina Booking, contact@dockslot.app)' } }
        );

        if (!forecastRes.ok) throw new Error('Unable to fetch forecast');

        const forecastData = await forecastRes.json();
        const periods = forecastData.properties.periods || [];

        // Find the forecast period that matches the selected date
        const targetDate = selectedDate.toISOString().split('T')[0];
        const matchingPeriod = periods.find((p: ForecastPeriod & { startTime: string }) => {
          const periodDate = p.startTime.split('T')[0];
          return periodDate === targetDate && !p.name.toLowerCase().includes('night');
        }) || periods[0];

        // Check wind speed for safety recommendation
        let recommendation: 'safe' | 'caution' | 'dangerous' = 'safe';
        const alerts: string[] = [];

        if (matchingPeriod?.windSpeed) {
          const windMatch = matchingPeriod.windSpeed.match(/(\d+)\s*(?:to\s*(\d+))?\s*mph/);
          if (windMatch) {
            const maxWind = parseInt(windMatch[2] || windMatch[1]);
            if (maxWind > 25) {
              recommendation = 'caution';
              alerts.push(`High winds expected: ${matchingPeriod.windSpeed}`);
            }
          }
        }

        const forecast = matchingPeriod?.shortForecast
          ? matchingPeriod as ForecastPeriod
          : null;

        setWeather({ forecast, recommendation, alerts });
      } catch (err) {
        // Weather is non-critical, fail silently
        setError('Weather data unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [latitude, longitude, selectedDate]);

  if (loading) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading weather forecast...</span>
        </div>
      </div>
    );
  }

  if (error || !weather?.forecast) {
    return null; // Don't show anything if weather unavailable
  }

  const { forecast, recommendation, alerts } = weather;

  return (
    <div className={`rounded-xl border ${
      recommendation === 'caution'
        ? 'border-amber-200 bg-amber-50'
        : 'border-slate-200 bg-blue-50/50'
    } p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${
          recommendation === 'caution' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
        }`}>
          {recommendation === 'caution' ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            getWeatherIcon(forecast.shortForecast)
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-slate-900">Weather Forecast</h4>
          </div>

          <p className="text-sm text-slate-700 mb-2">{forecast.shortForecast}</p>

          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Thermometer className="h-3.5 w-3.5" />
              {forecast.temperature}&deg;{forecast.temperatureUnit}
            </span>
            <span className="flex items-center gap-1">
              <Wind className="h-3.5 w-3.5" />
              {forecast.windSpeed} {forecast.windDirection}
            </span>
          </div>

          {alerts.length > 0 && (
            <div className="mt-2">
              {alerts.map((alert, i) => (
                <p key={i} className="text-xs text-amber-700 font-medium">{alert}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
