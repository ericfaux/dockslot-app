/**
 * Weather-specific caching layer with Supabase persistence
 *
 * Two-tier cache:
 * - L1: In-memory (process-local, instant, lost on cold start)
 * - L2: Supabase weather_cache table (shared across instances, persists)
 *
 * TTLs:
 * - Forecast (wind/conditions): 5 minutes
 * - Buoy (water temperature): 5 minutes
 * - Sunset: 24 hours
 * - Marine conditions (alerts/forecast): 5 minutes
 *
 * When data is stale, returns cached data immediately and refreshes
 * in the background. If an API call fails, returns the last cached
 * value as fallback.
 */

import { checkMarineConditions, type MarineWeatherConditions } from './noaa';
import { getBuoyData } from './buoy';
import SunCalc from 'suncalc';
import { formatInTimeZone } from 'date-fns-tz';
import { createSupabaseServiceClient } from '@/utils/supabase/service';

// TTL constants (milliseconds)
export const FORECAST_TTL = 5 * 60 * 1000;       // 5 minutes
export const BUOY_TTL = 5 * 60 * 1000;           // 5 minutes
export const SUNSET_TTL = 24 * 60 * 60 * 1000;   // 24 hours
export const CONDITIONS_TTL = 5 * 60 * 1000;     // 5 minutes
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

// ═══════════════════════════════════════════════════════════════════════════
// L1: In-memory cache (process-local, fast, ephemeral)
// ═══════════════════════════════════════════════════════════════════════════

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlMs: number, fetchedAt?: number): void {
    this.store.set(key, {
      data,
      fetchedAt: fetchedAt ?? Date.now(),
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

  invalidate(coordKey: string): void {
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

const l1Cache = new InMemoryCache();

// Periodic cleanup every 10 minutes
if (typeof global !== 'undefined') {
  setInterval(() => l1Cache.cleanup(), 600000);
}

// ═══════════════════════════════════════════════════════════════════════════
// L2: Supabase cache (persistent, shared across instances)
// ═══════════════════════════════════════════════════════════════════════════

async function getL2<T>(key: string): Promise<{ data: T; fetchedAt: number } | null> {
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from('weather_cache')
      .select('data, fetched_at')
      .eq('cache_key', key)
      .single();

    if (error || !data) return null;

    const fetchedAt = new Date(data.fetched_at).getTime();
    const age = Date.now() - fetchedAt;

    if (age > MAX_STALE_AGE) return null;

    return { data: data.data as T, fetchedAt };
  } catch {
    return null;
  }
}

async function setL2<T>(key: string, value: T, ttlMs: number): Promise<void> {
  try {
    const supabase = createSupabaseServiceClient();
    await supabase
      .from('weather_cache')
      .upsert(
        {
          cache_key: key,
          data: value as unknown,
          fetched_at: new Date().toISOString(),
          ttl_seconds: Math.round(ttlMs / 1000),
        },
        { onConflict: 'cache_key' },
      );
  } catch (error) {
    console.error('Failed to write weather cache to Supabase:', error);
  }
}

async function deleteL2(coordKey: string): Promise<void> {
  try {
    const supabase = createSupabaseServiceClient();
    await supabase
      .from('weather_cache')
      .delete()
      .like('cache_key', `%${coordKey}%`);
  } catch (error) {
    console.error('Failed to delete weather cache from Supabase:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Two-tier cache-then-fetch helper
// ═══════════════════════════════════════════════════════════════════════════

interface ForecastResult {
  windSpeed: number | null;
  windDirection: string | null;
}

interface BuoyResult {
  waterTemp: number | null;
}

async function getOrFetch<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>,
): Promise<{ data: T; fetchedAt: number } | null> {
  // ── L1 check (in-memory) ──
  const l1 = l1Cache.get<T>(key);
  if (l1 && !l1.isStale) {
    return { data: l1.data, fetchedAt: l1.fetchedAt };
  }

  // ── L2 check (Supabase) when L1 misses ──
  let staleData: { data: T; fetchedAt: number } | null =
    l1 ? { data: l1.data, fetchedAt: l1.fetchedAt } : null;

  if (!l1) {
    const l2 = await getL2<T>(key);
    if (l2) {
      const age = Date.now() - l2.fetchedAt;
      // Populate L1 from L2
      l1Cache.set(key, l2.data, ttl, l2.fetchedAt);

      if (age <= ttl) {
        // L2 is fresh
        return l2;
      }
      // L2 is stale but usable as fallback
      staleData = l2;
    }
  }

  // ── Stale data available → return immediately, refresh in background ──
  if (staleData) {
    if (!refreshing.has(key)) {
      refreshing.add(key);
      fetchFn()
        .then(async (data) => {
          l1Cache.set(key, data, ttl);
          await setL2(key, data, ttl);
        })
        .catch((err) => console.error(`Background refresh failed for ${key}:`, err))
        .finally(() => refreshing.delete(key));
    }
    return staleData;
  }

  // ── No cache at all → fetch synchronously ──
  try {
    const data = await fetchFn();
    l1Cache.set(key, data, ttl);
    // Write to L2 without blocking the response
    setL2(key, data, ttl).catch((err) =>
      console.error('Failed to write L2 cache:', err),
    );
    return { data, fetchedAt: Date.now() };
  } catch (error) {
    console.error(`Failed to fetch ${key}:`, error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Data fetchers (call external NOAA APIs)
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get weather data with two-tier caching (in-memory + Supabase).
 * Returns cached data immediately when available, even if stale.
 */
export async function getCachedWeatherData(
  lat: number,
  lon: number,
  timezone: string,
): Promise<WeatherData> {
  const coordKey = `${lat}:${lon}`;
  const forecastKey = `forecast:${coordKey}`;
  const buoyKey = `buoy:${coordKey}`;
  const sunsetKey = `sunset:${coordKey}`;

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
 * Get cached marine conditions (alerts, forecast, recommendation).
 * Used by the weather check API endpoint.
 */
export async function getCachedMarineConditions(
  lat: number,
  lon: number,
): Promise<{ conditions: MarineWeatherConditions; fetchedAt: number } | null> {
  const key = `conditions:${lat}:${lon}`;
  const result = await getOrFetch<MarineWeatherConditions>(
    key,
    CONDITIONS_TTL,
    () => checkMarineConditions(lat, lon, new Date()),
  );
  if (!result) return null;
  return { conditions: result.data, fetchedAt: result.fetchedAt };
}

/**
 * Invalidate all cached weather data for given coordinates.
 * Clears both in-memory (L1) and Supabase (L2) caches.
 * Used by the manual refresh endpoint.
 */
export async function invalidateWeatherCache(lat: number, lon: number): Promise<void> {
  const coordKey = `${lat}:${lon}`;
  l1Cache.invalidate(coordKey);
  await deleteL2(coordKey);
}
