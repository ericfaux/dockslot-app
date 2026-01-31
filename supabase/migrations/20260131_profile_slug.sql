-- Add slug field to profiles for public URLs
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS tagline VARCHAR(200);

-- Create index on slug for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);

-- Comments
COMMENT ON COLUMN profiles.slug IS 'URL-friendly slug for public profile (e.g., "joes-charters")';
COMMENT ON COLUMN profiles.tagline IS 'Short tagline shown on public profile';

-- Function to generate slug from business name
CREATE OR REPLACE FUNCTION generate_profile_slug(business_name_param TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(business_name_param, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing profiles without one
UPDATE profiles
SET slug = generate_profile_slug(business_name)
WHERE slug IS NULL AND business_name IS NOT NULL;
