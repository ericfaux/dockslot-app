-- Captain Branding & Visual Customization
-- Adds branding fields to profiles and trip image support to trip_types

-- Hero image URL for booking page cover photo
ALTER TABLE profiles ADD COLUMN hero_image_url text;

-- Custom tagline displayed on booking page
ALTER TABLE profiles ADD COLUMN booking_tagline text;

-- Hex color for accent/buttons on booking page (default matches Tailwind cyan-600)
ALTER TABLE profiles ADD COLUMN brand_accent_color text DEFAULT '#0891b2';

-- Trip type photo URL
ALTER TABLE trip_types ADD COLUMN image_url text;
