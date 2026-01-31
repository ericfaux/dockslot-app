# 🚨 Database Migrations Required

Multiple builds added new database columns and tables that need to be migrated.

## Quick Apply All Migrations

Run all migration files in order in your Supabase SQL Editor:

```bash
# In order:
1. supabase/migrations/20260131_booking_notes_tags.sql
2. supabase/migrations/20260131_filter_presets.sql
3. supabase/migrations/20260131_message_templates.sql
```

Or apply them all at once:

```bash
cd dockslot-app
cat supabase/migrations/20260131_*.sql | psql $DATABASE_URL
```

---

## Build #25: Booking Notes & Tags

**File:** `supabase/migrations/20260131_booking_notes_tags.sql`

```sql
ALTER TABLE bookings 
ADD COLUMN captain_notes TEXT,
ADD COLUMN tags TEXT[] DEFAULT '{}';

CREATE INDEX idx_bookings_tags ON bookings USING GIN (tags);

COMMENT ON COLUMN bookings.captain_notes IS 'Private notes from captain about this booking (special requests, preferences, etc.)';
COMMENT ON COLUMN bookings.tags IS 'Searchable tags for categorizing bookings (VIP, first-timer, anniversary, etc.)';
```

**What This Adds:**
- Captain's private notes on bookings
- Tagging system (VIP, First Timer, Anniversary, etc.)
- GIN index for fast tag searches

---

## Build #30: Saved Filter Presets

**File:** `supabase/migrations/20260131_filter_presets.sql`

```sql
CREATE TABLE IF NOT EXISTS filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_filter_presets_owner ON filter_presets(owner_id);
CREATE UNIQUE INDEX idx_filter_presets_default ON filter_presets(owner_id) WHERE is_default = true;

COMMENT ON TABLE filter_presets IS 'Saved filter configurations for the bookings list';
COMMENT ON COLUMN filter_presets.filters IS 'JSON object containing filter state (search, tags, statuses, payment_status, date_range)';
COMMENT ON COLUMN filter_presets.is_default IS 'If true, this preset is loaded automatically on page load';
```

**What This Adds:**
- Save frequently used filter combinations
- Default preset support
- JSONB storage for flexible filter state

---

## Build #33: Message Templates

**File:** `supabase/migrations/20260131_message_templates.sql`

```sql
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  category TEXT,
  is_default BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_message_templates_owner ON message_templates(owner_id);
CREATE INDEX idx_message_templates_category ON message_templates(owner_id, category);

COMMENT ON TABLE message_templates IS 'Reusable message templates for guest communications';
COMMENT ON COLUMN message_templates.category IS 'Template category: reminder, weather, instructions, cancellation, general';
COMMENT ON COLUMN message_templates.use_count IS 'Number of times this template has been used';
COMMENT ON COLUMN message_templates.body IS 'Template body with optional placeholders: {guest_name}, {date}, {time}, {vessel}, {meeting_spot}';
```

**What This Adds:**
- Reusable message templates
- Category-based organization
- Use count tracking
- Placeholder support

---

## Verification

After running migrations, verify with:

```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('captain_notes', 'tags');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('filter_presets', 'message_templates');
```

---

## Features Ready After Migration

Once migrations are applied, these features will work:

✅ **Build #25-29:** Booking notes, tags, search, export, duplication
✅ **Build #30:** Saved filter presets
✅ **Build #31:** Bulk booking actions (uses tags)
✅ **Build #32:** Dashboard quick stats
✅ **Build #33:** Message templates system

**All other features work without migrations** (they use existing schema).
