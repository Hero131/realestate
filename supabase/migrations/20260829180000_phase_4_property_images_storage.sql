-- Phase 4: Supabase Storage bucket + RLS for property images

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY property_images_storage_public_read
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');

CREATE POLICY property_images_storage_insert_own
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (SELECT private.current_broker_id()::text)
);

CREATE POLICY property_images_storage_update_own
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (SELECT private.current_broker_id()::text)
)
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (SELECT private.current_broker_id()::text)
);

CREATE POLICY property_images_storage_delete_own
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (SELECT private.current_broker_id()::text)
);
