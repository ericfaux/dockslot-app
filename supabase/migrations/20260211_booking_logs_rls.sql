-- Add RLS policies for booking_logs table
-- RLS is already enabled but no policies exist, blocking all non-service-role operations
-- This caused error 42501 when captains tried to create bookings via the admin UI

-- Captains can insert logs for their own bookings
CREATE POLICY "Captains can insert booking logs"
  ON booking_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND bookings.captain_id = auth.uid()
    )
  );

-- Captains can view logs for their own bookings (used by timeline/activity log)
CREATE POLICY "Captains can view booking logs"
  ON booking_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND bookings.captain_id = auth.uid()
    )
  );
