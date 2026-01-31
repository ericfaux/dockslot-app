-- Add reminder_sent_at column to bookings table
-- Tracks when the 24-hour trip reminder was sent

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient cron job queries
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_lookup
ON bookings (scheduled_start, status, reminder_sent_at)
WHERE status IN ('confirmed', 'rescheduled') AND reminder_sent_at IS NULL;

-- Add comment
COMMENT ON COLUMN bookings.reminder_sent_at IS 'Timestamp when 24-hour trip reminder email was sent';
