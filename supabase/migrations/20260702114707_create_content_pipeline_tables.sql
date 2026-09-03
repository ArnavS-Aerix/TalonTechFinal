/*
# Content pipeline: progress entries, notebook entries, photos, and schedule

1. New Tables
- `progress_entries`
  - id, title, body (text — markdown/plain), category (build/competition/outreach/fundraising/other),
  - week_of (date — the Monday of the week this entry describes), reported (bool default false — set true when included in a sent issue),
  - created_at, updated_at
- `notebook_entries`
  - id, title, body (text — the raw engineering notebook text), entry_date (date),
  - reported (bool default false), created_at, updated_at
- `progress_photos`
  - id, progress_entry_id (FK, nullable — a photo can be standalone), storage_path (text — path in the progress-photos bucket),
  - caption (text), created_at
- `newsletter_schedule`
  - id (singleton — we only ever use row 1), auto_send (bool default false), day_of_week (int 0-6, 0=Sunday),
  - send_time (time, default 09:00), last_sent_at (timestamptz), updated_at
- `newsletter_issues` — ADD COLUMN source (text, nullable) to record how the issue was created: 'manual' | 'generated' | 'auto'

2. Security
- progress_entries, notebook_entries, progress_photos: anon + authenticated can SELECT and INSERT (public content submission — the site has no auth). UPDATE/DELETE allowed for anon+authenticated so the admin page can manage entries without a login. This matches the existing pattern on sponsorships/donations.
- newsletter_schedule: anon + authenticated can SELECT (the admin page reads it). UPDATE allowed for anon+authenticated (the admin page toggles auto-send). No INSERT/DELETE needed — the singleton row is seeded by this migration.
- newsletter_issues.source: no extra policy needed — covered by existing issue policies.

3. Seed
- Insert one newsletter_schedule row (auto_send=false, day_of_week=1 (Monday), send_time=09:00).
*/

-- progress_entries
CREATE TABLE IF NOT EXISTS progress_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'build' CHECK (category IN ('build','competition','outreach','fundraising','other')),
  week_of date NOT NULL DEFAULT date_trunc('week', now())::date,
  reported boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_progress_entries" ON progress_entries;
CREATE POLICY "anon_all_progress_entries" ON progress_entries
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- notebook_entries
CREATE TABLE IF NOT EXISTS notebook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  entry_date date NOT NULL DEFAULT now()::date,
  reported boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE notebook_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_notebook_entries" ON notebook_entries;
CREATE POLICY "anon_all_notebook_entries" ON notebook_entries
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- progress_photos
CREATE TABLE IF NOT EXISTS progress_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_entry_id uuid REFERENCES progress_entries(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_progress_photos" ON progress_photos;
CREATE POLICY "anon_all_progress_photos" ON progress_photos
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- newsletter_schedule (singleton)
CREATE TABLE IF NOT EXISTS newsletter_schedule (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  auto_send boolean NOT NULL DEFAULT false,
  day_of_week int NOT NULL DEFAULT 1 CHECK (day_of_week >= 0 AND day_of_week <= 6),
  send_time time NOT NULL DEFAULT '09:00',
  last_sent_at timestamptz,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE newsletter_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_schedule" ON newsletter_schedule;
CREATE POLICY "anon_select_schedule" ON newsletter_schedule
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_update_schedule" ON newsletter_schedule;
CREATE POLICY "anon_update_schedule" ON newsletter_schedule
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO newsletter_schedule (id, auto_send, day_of_week, send_time)
VALUES (1, false, 1, '09:00')
ON CONFLICT (id) DO NOTHING;

-- Add source column to newsletter_issues
ALTER TABLE newsletter_issues ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE newsletter_issues ADD CONSTRAINT newsletter_issues_source_check
  CHECK (source IS NULL OR source IN ('manual','generated','auto'));

-- updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS progress_entries_updated_at ON progress_entries;
CREATE TRIGGER progress_entries_updated_at BEFORE UPDATE ON progress_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS notebook_entries_updated_at ON notebook_entries;
CREATE TRIGGER notebook_entries_updated_at BEFORE UPDATE ON notebook_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS newsletter_schedule_updated_at ON newsletter_schedule;
CREATE TRIGGER newsletter_schedule_updated_at BEFORE UPDATE ON newsletter_schedule
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();