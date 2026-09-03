/*
# Create site_photos table, site_settings table, and hero-images storage bucket

## Purpose
1. Lets the admin upload photos that appear in the "Build Season Progress" carousel on the homepage.
2. Lets the admin customize the hero section background — either a solid color or a background image.
3. Creates a public storage bucket for hero background images.

## 1. New Table: site_photos
- `id` (uuid, primary key)
- `photo_path` (text, not null) — storage path in the progress-photos bucket
- `caption` (text) — optional caption for the photo
- `sort_order` (int, default 0) — manual ordering
- `created_at` (timestamptz)

## 2. New Table: site_settings
- `id` (int, primary key, always 1) — singleton row for site-wide settings
- `hero_bg_type` (text, default 'color') — 'color' or 'image'
- `hero_bg_color` (text, default '#0a1628') — hex color when type is 'color'
- `hero_bg_image_path` (text) — storage path in hero-images bucket when type is 'image'
- `updated_at` (timestamptz)

## 3. Storage Bucket: hero-images
- Public bucket for hero background images

## 4. Security
- RLS enabled on both tables with full CRUD for anon/authenticated (no-auth app)
- Storage policies: public read, anon/authenticated insert + delete on hero-images
*/

-- site_photos table
CREATE TABLE IF NOT EXISTS public.site_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_path text NOT NULL,
  caption text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_site_photos" ON public.site_photos;
CREATE POLICY "anon_select_site_photos" ON public.site_photos
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_site_photos" ON public.site_photos;
CREATE POLICY "anon_insert_site_photos" ON public.site_photos
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_site_photos" ON public.site_photos;
CREATE POLICY "anon_update_site_photos" ON public.site_photos
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_site_photos" ON public.site_photos;
CREATE POLICY "anon_delete_site_photos" ON public.site_photos
  FOR DELETE TO anon, authenticated USING (true);

-- site_settings table (singleton)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id int PRIMARY KEY DEFAULT 1,
  hero_bg_type text NOT NULL DEFAULT 'color',
  hero_bg_color text NOT NULL DEFAULT '#0a1628',
  hero_bg_image_path text,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_site_settings" ON public.site_settings;
CREATE POLICY "anon_select_site_settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_site_settings" ON public.site_settings;
CREATE POLICY "anon_insert_site_settings" ON public.site_settings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_site_settings" ON public.site_settings;
CREATE POLICY "anon_update_site_settings" ON public.site_settings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Insert default singleton row
INSERT INTO public.site_settings (id, hero_bg_type, hero_bg_color)
VALUES (1, 'color', '#0a1628')
ON CONFLICT (id) DO NOTHING;

-- hero-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_hero_images" ON storage.objects;
CREATE POLICY "anon_read_hero_images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'hero-images');

DROP POLICY IF EXISTS "anon_insert_hero_images" ON storage.objects;
CREATE POLICY "anon_insert_hero_images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'hero-images');

DROP POLICY IF EXISTS "anon_delete_hero_images" ON storage.objects;
CREATE POLICY "anon_delete_hero_images" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'hero-images');
