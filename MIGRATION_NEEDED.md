# 🚨 Database Migration Required

**Build #25** added new columns to the `bookings` table.

## To Apply Migration:

Run this SQL in your Supabase SQL Editor:

```sql
-- Add notes and tags to bookings table
ALTER TABLE bookings 
ADD COLUMN captain_notes TEXT,
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create index for tag searches
CREATE INDEX idx_bookings_tags ON bookings USING GIN (tags);

-- Add comment
COMMENT ON COLUMN bookings.captain_notes IS 'Private notes from captain about this booking (special requests, preferences, etc.)';
COMMENT ON COLUMN bookings.tags IS 'Searchable tags for categorizing bookings (VIP, first-timer, anniversary, etc.)';
```

Or run the migration file:
```bash
cd dockslot-app
psql $DATABASE_URL < supabase/migrations/20260131_booking_notes_tags.sql
```

## What This Adds:
- Captain's private notes on bookings
- Tagging system (VIP, First Timer, Anniversary, etc.)
- Searchable/filterable organization
- Better trip preparation

The UI is already deployed and ready to use once the migration runs! ✅
