-- Add storage policy for banner uploads
-- Allow authenticated users to upload their own banner images
CREATE POLICY "Users can upload their own banners"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own files in avatars bucket
CREATE POLICY "Users can update their own avatar files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own files in avatars bucket
CREATE POLICY "Users can delete their own avatar files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);