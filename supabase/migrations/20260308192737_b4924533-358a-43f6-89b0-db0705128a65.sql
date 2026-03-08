-- Add UPDATE policy for storage objects (needed for resumable/chunked uploads)
CREATE POLICY "Authenticated users can update own uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resources' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'resources' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add DELETE policy so users can replace failed uploads
CREATE POLICY "Authenticated users can delete own uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resources' AND (storage.foldername(name))[1] = auth.uid()::text);