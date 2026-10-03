-- Add public read policy for progress-photos bucket
DROP POLICY IF EXISTS "anon_read_progress_photos" ON storage.objects;
CREATE POLICY "anon_read_progress_photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'progress-photos');
