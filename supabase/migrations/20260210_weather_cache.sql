-- Migration: Create weather_cache table for NOAA data caching
-- Persists weather API responses across serverless cold starts
-- Accessed via service role client (no RLS needed)

CREATE TABLE IF NOT EXISTS weather_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ttl_seconds INTEGER NOT NULL DEFAULT 300
);

-- Index for cleanup of stale entries
CREATE INDEX IF NOT EXISTS idx_weather_cache_fetched_at ON weather_cache(fetched_at);
