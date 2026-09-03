/*
# Create sponsorships and donations tables

1. New Tables
- `sponsorships`
  - `id` (uuid, primary key)
  - `company_name` (text, not null)
  - `contact_name` (text, not null)
  - `email` (text, not null)
  - `phone` (text)
  - `tier` (text, not null) - Bronze, Silver, Gold, or Platinum
  - `amount` (numeric, not null)
  - `message` (text)
  - `logo_url` (text)
  - `website` (text)
  - `created_at` (timestamptz)
- `donations`
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `email` (text, not null)
  - `phone` (text)
  - `amount` (numeric, not null)
  - `message` (text)
  - `is_anonymous` (boolean, default false)
  - `created_at` (timestamptz)
2. Security
- Enable RLS on both tables.
- Allow anon and authenticated users to create submissions (no auth required for this public-facing site).
*/

CREATE TABLE IF NOT EXISTS sponsorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  tier text NOT NULL CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  amount numeric NOT NULL CHECK (amount >= 0),
  message text,
  logo_url text,
  website text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  amount numeric NOT NULL CHECK (amount >= 0),
  message text,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_sponsorships" ON sponsorships;
CREATE POLICY "anon_insert_sponsorships" ON sponsorships FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_sponsorships" ON sponsorships;
CREATE POLICY "anon_select_sponsorships" ON sponsorships FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_donations" ON donations;
CREATE POLICY "anon_insert_donations" ON donations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_donations" ON donations;
CREATE POLICY "anon_select_donations" ON donations FOR SELECT
  TO anon, authenticated USING (true);
