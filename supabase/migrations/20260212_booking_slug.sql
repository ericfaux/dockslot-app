-- Rename slug to booking_slug for clarity
ALTER TABLE profiles RENAME COLUMN slug TO booking_slug;

-- Drop old index and create new one
DROP INDEX IF EXISTS idx_profiles_slug;
CREATE INDEX IF NOT EXISTS idx_profiles_booking_slug ON profiles(booking_slug);

-- Update column comment
COMMENT ON COLUMN profiles.booking_slug IS 'URL-friendly slug for booking page (e.g., "erics-boats"). 3-50 chars, lowercase alphanumeric + hyphens, unique.';

-- Add check constraint for format validation
-- Allows: lowercase alphanumeric + hyphens, no leading/trailing/consecutive hyphens, 3-50 chars
ALTER TABLE profiles ADD CONSTRAINT chk_booking_slug_format CHECK (
  booking_slug IS NULL OR (
    length(booking_slug) >= 3 AND
    length(booking_slug) <= 50 AND
    booking_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  )
);

-- Truncate any existing slugs that exceed 50 chars (unlikely but safe)
UPDATE profiles
SET booking_slug = left(booking_slug, 50)
WHERE booking_slug IS NOT NULL AND length(booking_slug) > 50;

-- Fix any existing slugs that might have trailing hyphens after truncation
UPDATE profiles
SET booking_slug = regexp_replace(booking_slug, '-+$', '')
WHERE booking_slug IS NOT NULL AND booking_slug ~ '-+$';

-- Update the slug generation function to use booking_slug
CREATE OR REPLACE FUNCTION generate_booking_slug(business_name_param TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Convert to lowercase, remove special chars (keep alphanumeric, spaces, hyphens)
  base_slug := lower(regexp_replace(business_name_param, '[^a-zA-Z0-9\s-]', '', 'g'));
  -- Replace spaces with hyphens
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  -- Collapse multiple hyphens
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  -- Trim leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  -- Enforce max 50 chars
  base_slug := left(base_slug, 50);
  -- Trim trailing hyphen after truncation
  base_slug := trim(trailing '-' from base_slug);

  -- Enforce minimum 3 chars
  IF length(base_slug) < 3 THEN
    base_slug := base_slug || '-charter';
    base_slug := left(base_slug, 50);
  END IF;

  final_slug := base_slug;

  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE booking_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := left(base_slug, 50 - length(counter::text) - 1) || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate booking slugs for any profiles that still don't have one
UPDATE profiles
SET booking_slug = generate_booking_slug(business_name)
WHERE booking_slug IS NULL AND business_name IS NOT NULL;
