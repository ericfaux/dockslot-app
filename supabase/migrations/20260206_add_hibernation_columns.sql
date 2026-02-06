-- Add hibernation columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_hibernating boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hibernation_message text,
  ADD COLUMN IF NOT EXISTS hibernation_end_date text,
  ADD COLUMN IF NOT EXISTS hibernation_resume_time text,
  ADD COLUMN IF NOT EXISTS hibernation_show_return_date boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hibernation_allow_notifications boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hibernation_show_contact_info boolean NOT NULL DEFAULT false;
