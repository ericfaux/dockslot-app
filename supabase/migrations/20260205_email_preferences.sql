-- Email & SMS notification preferences per captain
CREATE TABLE IF NOT EXISTS email_preferences (
  captain_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  booking_confirmation_enabled BOOLEAN NOT NULL DEFAULT true,
  deposit_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  trip_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  trip_reminder_timing TEXT[] NOT NULL DEFAULT ARRAY['24h'],
  weather_alert_enabled BOOLEAN NOT NULL DEFAULT true,
  review_request_enabled BOOLEAN NOT NULL DEFAULT true,
  cancellation_notification_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_booking_confirmation BOOLEAN NOT NULL DEFAULT true,
  sms_day_of_reminder BOOLEAN NOT NULL DEFAULT true,
  sms_weather_hold BOOLEAN NOT NULL DEFAULT true,
  custom_what_to_bring TEXT,
  business_name_override TEXT,
  business_phone_override TEXT,
  logo_url TEXT,
  email_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Captains can view own email preferences"
  ON email_preferences FOR SELECT
  USING (captain_id = auth.uid());

CREATE POLICY "Captains can insert own email preferences"
  ON email_preferences FOR INSERT
  WITH CHECK (captain_id = auth.uid());

CREATE POLICY "Captains can update own email preferences"
  ON email_preferences FOR UPDATE
  USING (captain_id = auth.uid());

-- Allow service role full access for cron jobs
CREATE POLICY "Service role full access to email preferences"
  ON email_preferences FOR ALL
  USING (auth.role() = 'service_role');

-- Add deposit_reminder_sent_at to bookings for deposit reminder tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_reminder_sent_at TIMESTAMPTZ;

-- Add review_request_sent_at to bookings for review request tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_request_sent_at TIMESTAMPTZ;

-- Add reminder_48h_sent_at for 48h reminder tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_48h_sent_at TIMESTAMPTZ;
