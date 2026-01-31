/**
 * Simple in-memory cache for weather data
 * Reduces API calls to NOAA and buoys
 * 5-minute TTL is reasonable for weather data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttlMs: number = 300000): void { // Default 5 min
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    
    if (age > entry.ttl) {
      // Expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  // Periodic cleanup of expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global singleton
export const weatherCache = new SimpleCache();

// Run cleanup every 10 minutes
if (typeof global !== 'undefined') {
  setInterval(() => weatherCache.cleanup(), 600000);
}
