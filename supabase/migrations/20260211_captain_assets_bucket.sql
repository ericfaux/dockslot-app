-- Create storage bucket for captain assets (hero images, trip photos)
-- Public bucket so images are accessible on unauthenticated booking pages

INSERT INTO storage.buckets (id, name, public)
VALUES ('captain-assets', 'captain-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Captains can upload their own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'captain-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own assets
CREATE POLICY "Captains can update their own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'captain-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own assets
CREATE POLICY "Captains can delete their own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'captain-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (booking pages are unauthenticated)
CREATE POLICY "Public read access for captain assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'captain-assets');
