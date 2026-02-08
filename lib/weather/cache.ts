/**
 * Weather-specific caching layer with stale-while-revalidate pattern
 *
 * TTLs:
 * - Forecast (wind/conditions): 5 minutes
 * - Buoy (water temperature): 10 minutes
 * - Sunset: 24 hours
 *
 * When data is stale, returns cached data immediately and refreshes
 * in the background. If an API call fails, returns the last cached
 * value as fallback.
 */

import { checkMarineConditions } from './noaa';
import { getBuoyData } from './buoy';
import SunCalc from 'suncalc';
import { formatInTimeZone } from 'date-fns-tz';

// TTL constants (milliseconds)
export const FORECAST_TTL = 5 * 60 * 1000;       // 5 minutes
export const BUOY_TTL = 10 * 60 * 1000;          // 10 minutes
export const SUNSET_TTL = 24 * 60 * 60 * 1000;   // 24 hours
const MAX_STALE_AGE = 60 * 60 * 1000;            // 1 hour max fallback

export interface WeatherData {
  waterTemp: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  sunset: string | null;
  lastUpdated: number | null; // Unix timestamp (ms)
}

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  ttl: number;
}

// Track in-flight background refreshes to prevent duplicate fetches
const refreshing = new Set<string>();

class WeatherDataCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      fetchedAt: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): { data: T; fetchedAt: number; isStale: boolean } | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.fetchedAt;

    // Don't return data older than MAX_STALE_AGE
    if (age > MAX_STALE_AGE) {
      this.store.delete(key);
      return null;
    }

    return {
      data: entry.data as T,
      fetchedAt: entry.fetchedAt,
      isStale: age > entry.ttl,
    };
  }

  invalidate(lat: number, lon: number): void {
    const coordKey = `${lat}:${lon}`;
    for (const key of this.store.keys()) {
      if (key.includes(coordKey)) {
        this.store.delete(key);
      }
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.fetchedAt > MAX_STALE_AGE) {
        this.store.delete(key);
      }
    }
  }
}

const cache = new WeatherDataCache();

// Periodic cleanup every 10 minutes
if (typeof global !== 'undefined') {
  setInterval(() => cache.cleanup(), 600000);
}

// ─── Individual data types ───

interface ForecastResult {
  windSpeed: number | null;
  windDirection: string | null;
}

interface BuoyResult {
  waterTemp: number | null;
}

// ─── Stale-while-revalidate helper ───

async function getOrFetch<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>,
): Promise<{ data: T; fetchedAt: number } | null> {
  const cached = cache.get<T>(key);

  if (cached && !cached.isStale) {
    // Fresh cache hit
    return { data: cached.data, fetchedAt: cached.fetchedAt };
  }

  if (cached && cached.isStale) {
    // Stale cache - return immediately, refresh in background
    if (!refreshing.has(key)) {
      refreshing.add(key);
      fetchFn()
        .then(data => cache.set(key, data, ttl))
        .catch(err => console.error(`Background refresh failed for ${key}:`, err))
        .finally(() => refreshing.delete(key));
    }
    return { data: cached.data, fetchedAt: cached.fetchedAt };
  }

  // No cache at all - fetch synchronously
  try {
    const data = await fetchFn();
    cache.set(key, data, ttl);
    return { data, fetchedAt: Date.now() };
  } catch (error) {
    console.error(`Failed to fetch ${key}:`, error);
    return null;
  }
}

// ─── Data fetchers ───

async function fetchForecast(lat: number, lon: number): Promise<ForecastResult> {
  const conditions = await checkMarineConditions(lat, lon, new Date());

  let windSpeed: number | null = null;
  let windDirection: string | null = null;

  if (conditions.forecast?.periods[0]) {
    const period = conditions.forecast.periods[0];
    const windMatch = period.windSpeed.match(/(\d+)\s*(?:to\s*(\d+))?\s*mph/);
    if (windMatch) {
      const maxWind = parseInt(windMatch[2] || windMatch[1]);
      windSpeed = Math.round(maxWind * 0.868976); // mph to knots
      windDirection = period.windDirection;
    }
  }

  return { windSpeed, windDirection };
}

async function fetchBuoy(lat: number, lon: number): Promise<BuoyResult> {
  const buoyData = await getBuoyData(lat, lon);
  return {
    waterTemp: buoyData?.waterTemperature ? Math.round(buoyData.waterTemperature) : null,
  };
}

function calculateSunset(lat: number, lon: number, timezone: string): string | null {
  const sunTimes = SunCalc.getTimes(new Date(), lat, lon);
  return formatInTimeZone(sunTimes.sunset, timezone, 'h:mm a');
}

// ─── Public API ───

/**
 * Get weather data with caching and stale-while-revalidate.
 * Returns cached data immediately when available, even if stale.
 */
export async function getCachedWeatherData(
  lat: number,
  lon: number,
  timezone: string,
): Promise<WeatherData> {
  const forecastKey = `forecast:${lat}:${lon}`;
  const buoyKey = `buoy:${lat}:${lon}`;
  const sunsetKey = `sunset:${lat}:${lon}`;

  // Fetch all three in parallel with caching
  const [forecastResult, buoyResult, sunsetResult] = await Promise.all([
    getOrFetch<ForecastResult>(forecastKey, FORECAST_TTL, () => fetchForecast(lat, lon)),
    getOrFetch<BuoyResult>(buoyKey, BUOY_TTL, () => fetchBuoy(lat, lon)),
    getOrFetch<string | null>(sunsetKey, SUNSET_TTL, async () => calculateSunset(lat, lon, timezone)),
  ]);

  // Use the oldest API-fetched timestamp as "last updated"
  // (sunset is local calculation, so exclude it)
  const timestamps = [
    forecastResult?.fetchedAt,
    buoyResult?.fetchedAt,
  ].filter((t): t is number => t != null);

  const lastUpdated = timestamps.length > 0 ? Math.min(...timestamps) : null;

  return {
    windSpeed: forecastResult?.data.windSpeed ?? null,
    windDirection: forecastResult?.data.windDirection ?? null,
    waterTemp: buoyResult?.data.waterTemp ?? null,
    sunset: sunsetResult?.data ?? null,
    lastUpdated,
  };
}

/**
 * Invalidate all cached weather data for given coordinates.
 * Used by the manual refresh endpoint.
 */
export function invalidateWeatherCache(lat: number, lon: number): void {
  cache.invalidate(lat, lon);
}
