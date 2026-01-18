-- Migration: Create default availability trigger
-- Description: Automatically creates default availability windows when a new captain profile is created
-- This ensures new captains have availability set up immediately so their booking page works

-- ============================================================================
-- Create the trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Create 7 availability windows (one per day of the week)
  -- Default schedule:
  --   - Sunday (0): Active, 06:00-21:00
  --   - Monday (1): OFF (common off day for charter operations)
  --   - Tuesday (2) through Saturday (6): Active, 06:00-21:00
  INSERT INTO availability_windows (owner_id, day_of_week, start_time, end_time, is_active)
  VALUES
    (NEW.id, 0, '06:00:00', '21:00:00', true),  -- Sunday
    (NEW.id, 1, '06:00:00', '21:00:00', false), -- Monday (off)
    (NEW.id, 2, '06:00:00', '21:00:00', true),  -- Tuesday
    (NEW.id, 3, '06:00:00', '21:00:00', true),  -- Wednesday
    (NEW.id, 4, '06:00:00', '21:00:00', true),  -- Thursday
    (NEW.id, 5, '06:00:00', '21:00:00', true),  -- Friday
    (NEW.id, 6, '06:00:00', '21:00:00', true);  -- Saturday

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Create the trigger on profiles table
-- ============================================================================

-- Drop the trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_profile_created ON profiles;

-- Create the trigger to fire after a new profile is inserted
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_availability();

-- ============================================================================
-- Backfill: Create default availability for existing captains without any
-- ============================================================================

-- Insert default availability windows for any existing profiles that don't have any
INSERT INTO availability_windows (owner_id, day_of_week, start_time, end_time, is_active)
SELECT
  p.id,
  days.day_of_week,
  '06:00:00'::time,
  '21:00:00'::time,
  CASE WHEN days.day_of_week = 1 THEN false ELSE true END  -- Monday off, others active
FROM profiles p
CROSS JOIN (
  SELECT 0 AS day_of_week UNION ALL
  SELECT 1 UNION ALL
  SELECT 2 UNION ALL
  SELECT 3 UNION ALL
  SELECT 4 UNION ALL
  SELECT 5 UNION ALL
  SELECT 6
) days
WHERE NOT EXISTS (
  SELECT 1 FROM availability_windows aw
  WHERE aw.owner_id = p.id
)
ON CONFLICT (owner_id, day_of_week) DO NOTHING;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON FUNCTION create_default_availability() IS
  'Creates default availability windows (7 days, 6AM-9PM, Monday off) for newly registered captains';

COMMENT ON TRIGGER on_profile_created ON profiles IS
  'Automatically creates default availability when a new captain profile is inserted';
