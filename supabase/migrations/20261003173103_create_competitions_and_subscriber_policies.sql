-- Competitions table
CREATE TABLE IF NOT EXISTS competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  venue text NOT NULL,
  address text,
  city text,
  state text,
  description text,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','completed','cancelled')),
  results text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_competitions" ON competitions;
CREATE POLICY "anon_all_competitions" ON competitions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS competitions_updated_at ON competitions;
CREATE TRIGGER competitions_updated_at BEFORE UPDATE ON competitions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Add SELECT/UPDATE/DELETE policies for newsletter_subscribers so admin can manage them
DROP POLICY IF EXISTS "anon_all_subscribers" ON newsletter_subscribers;
CREATE POLICY "anon_all_subscribers" ON newsletter_subscribers
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
