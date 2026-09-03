/*
# Create sponsors table and sponsor-logos storage bucket

## Purpose
Lets the admin add real sponsors (name, logo image, website link) from the Admin Center.
These show up in the SponsorsCarousel on the homepage instead of the placeholder slides.

## 1. New Table: sponsors
- `id` (uuid, primary key)
- `name` (text, not null) — sponsor company name
- `logo_path` (text) — storage path in the sponsor-logos bucket
- `website` (text) — clickable link for the sponsor
- `sort_order` (int, default 0) — manual ordering
- `created_at` (timestamptz)

## 2. Storage Bucket: sponsor-logos
- Public bucket for sponsor logo images

## 3. Security
- RLS enabled on sponsors with full CRUD for anon/authenticated (no-auth app)
- Storage policies: public read, anon/authenticated insert + delete
*/

CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_path text,
  website text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sponsors" ON public.sponsors;
CREATE POLICY "anon_select_sponsors" ON public.sponsors
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sponsors" ON public.sponsors;
CREATE POLICY "anon_insert_sponsors" ON public.sponsors
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sponsors" ON public.sponsors;
CREATE POLICY "anon_update_sponsors" ON public.sponsors
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sponsors" ON public.sponsors;
CREATE POLICY "anon_delete_sponsors" ON public.sponsors
  FOR DELETE TO anon, authenticated USING (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsor-logos', 'sponsor-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, anon/authenticated insert + delete
DROP POLICY IF EXISTS "anon_read_sponsor_logos" ON storage.objects;
CREATE POLICY "anon_read_sponsor_logos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'sponsor-logos');

DROP POLICY IF EXISTS "anon_insert_sponsor_logos" ON storage.objects;
CREATE POLICY "anon_insert_sponsor_logos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'sponsor-logos');

DROP POLICY IF EXISTS "anon_delete_sponsor_logos" ON storage.objects;
CREATE POLICY "anon_delete_sponsor_logos" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'sponsor-logos');
