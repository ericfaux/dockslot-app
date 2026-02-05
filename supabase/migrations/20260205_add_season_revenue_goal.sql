-- Add season revenue goal column to profiles table
-- Allows captains to set a revenue target for the dashboard fuel gauge

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS season_revenue_goal_cents INTEGER NOT NULL DEFAULT 0;

-- 0 means "not configured" — the dashboard will show a sensible default
