/*
# Create newsletter_subscribers table

1. New Tables
- `newsletter_subscribers`
  - `id` (uuid, primary key)
  - `email` (text, unique, not null)
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `newsletter_subscribers`.
- Allow anon + authenticated to insert (public signup form, no login required).
- No SELECT/UPDATE/DELETE for anon — only insert so the form can collect emails.
*/

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_newsletter" ON newsletter_subscribers;
CREATE POLICY "anon_insert_newsletter" ON newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);
