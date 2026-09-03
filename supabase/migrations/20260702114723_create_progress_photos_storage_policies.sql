-- Storage policies for the progress-photos bucket (public read, anon+auth upload)
-- The bucket itself is public, so reads are open. We add an INSERT policy so the
-- anon client can upload from the Content Studio page.

DROP POLICY IF EXISTS "anon_upload_progress_photos" ON storage.objects;
CREATE POLICY "anon_upload_progress_photos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'progress-photos');

DROP POLICY IF EXISTS "anon_read_progress_photos" ON storage.objects;
CREATE POLICY "anon_read_progress_photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'progress-photos');

DROP POLICY IF EXISTS "anon_delete_progress_photos" ON storage.objects;
CREATE POLICY "anon_delete_progress_photos" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'progress-photos');