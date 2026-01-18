-- Migration: Add unique constraint on availability_windows
-- Description: Adds a unique constraint on (owner_id, day_of_week) to support upsert operations
-- This constraint is required for the ON CONFLICT clause used in availability save operations

-- ============================================================================
-- Add unique constraint
-- ============================================================================

-- First, remove any duplicate rows that might exist (keeping the most recent)
-- This ensures we can add the unique constraint without conflicts
DELETE FROM availability_windows a
WHERE a.id NOT IN (
  SELECT DISTINCT ON (owner_id, day_of_week) id
  FROM availability_windows
  ORDER BY owner_id, day_of_week, created_at DESC
);

-- Add the unique constraint
-- Using CREATE UNIQUE INDEX which is more flexible and allows IF NOT EXISTS
CREATE UNIQUE INDEX IF NOT EXISTS availability_windows_owner_day_unique
ON availability_windows (owner_id, day_of_week);

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON INDEX availability_windows_owner_day_unique IS
  'Ensures each captain can only have one availability window per day of the week. Required for upsert operations.';
