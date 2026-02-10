-- Add is_active column for soft delete (archive) support on trip_types
-- Archived trip types remain in the database for referential integrity
-- but are hidden from booking flows and public-facing pages.

ALTER TABLE trip_types
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Index for efficient filtering of active trip types
CREATE INDEX IF NOT EXISTS idx_trip_types_owner_active
  ON trip_types (owner_id, is_active)
  WHERE is_active = true;
