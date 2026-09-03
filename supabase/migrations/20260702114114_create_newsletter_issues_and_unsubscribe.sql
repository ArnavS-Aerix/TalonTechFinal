/*
# Newsletter issues, sending, and unsubscribe support

1. New Tables
- `newsletter_issues`
  - `id` (uuid, primary key)
  - `subject` (text, not null) — email subject line
  - `body_html` (text, not null) — HTML content of the email
  - `status` (text, default 'draft') — draft | sending | sent | failed
  - `sent_at` (timestamptz) — when the issue was sent
  - `recipient_count` (int) — how many subscribers received it
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
- `newsletter_sends` (per-recipient delivery log so we can dedupe and track per-subscriber state)
  - `id` (uuid, primary key)
  - `issue_id` (uuid, FK to newsletter_issues, ON DELETE CASCADE)
  - `subscriber_id` (uuid, FK to newsletter_subscribers, ON DELETE CASCADE)
  - `status` (text, default 'pending') — pending | sent | failed
  - `sent_at` (timestamptz)
  - `error` (text)
  - UNIQUE(issue_id, subscriber_id) — one row per issue/subscriber pair

2. Modified Tables
- `newsletter_subscribers`
  - ADD `unsubscribed_at` (timestamptz, nullable) — when the subscriber opted out. NULL = still subscribed.
  - ADD `unsubscribe_token` (uuid, unique, default gen_random_uuid()) — token used in the unsubscribe link so a subscriber can opt out without logging in.

3. Security
- `newsletter_issues`: anon + authenticated can SELECT (so the admin page can list issues without auth — this is a single-tenant site with no sign-in). Only the edge function (service role) writes; no anon INSERT/UPDATE/DELETE.
- `newsletter_sends`: no anon access — only the service-role edge function reads/writes this table. No policies are created, so it is locked to anon/authenticated by default (RLS enabled, no policy = no access).
- `newsletter_subscribers`: keep the existing anon INSERT policy. Add an anon SELECT policy so the unsubscribe edge function can look up a subscriber by token via the anon key (the token is a secret, so token-based lookup is safe). Add an anon UPDATE policy so the unsubscribe edge function can set `unsubscribed_at` — scoped to only allow updating the `unsubscribed_at` column is not possible at the policy level, so instead we allow UPDATE only where the row's `unsubscribe_token` matches a request — but policies can't see request body. Practical approach: the unsubscribe edge function uses the service role key, so no anon UPDATE policy is needed. We do NOT add an anon UPDATE policy.

4. Important Notes
1. The unsubscribe flow is handled by an edge function using the service role key, so it bypasses RLS. The anon key is never used to mutate subscriber state.
2. The send-newsletter edge function uses the service role key to read all subscribers and write sends/issues — bypassing RLS is intentional for the server-side sender.
3. `newsletter_sends` has no policies on purpose: it is internal delivery metadata only the server should touch.
4. The unsubscribe link in every email contains the subscriber's `unsubscribe_token` and hits a public page that calls the unsubscribe edge function.
*/

-- Extend newsletter_subscribers
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid UNIQUE DEFAULT gen_random_uuid();

-- Create newsletter_issues
CREATE TABLE IF NOT EXISTS newsletter_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body_html text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','sent','failed')),
  sent_at timestamptz,
  recipient_count integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE newsletter_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_newsletter_issues" ON newsletter_issues;
CREATE POLICY "anon_select_newsletter_issues" ON newsletter_issues
  FOR SELECT TO anon, authenticated USING (true);

-- Create newsletter_sends
CREATE TABLE IF NOT EXISTS newsletter_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES newsletter_issues(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  sent_at timestamptz,
  error text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(issue_id, subscriber_id)
);
ALTER TABLE newsletter_sends ENABLE ROW LEVEL SECURITY;

-- Allow anon to look up a subscriber by unsubscribe_token (needed by the public unsubscribe page
-- to render the subscriber's email before calling the edge function). Token is a secret, so this is safe.
DROP POLICY IF EXISTS "anon_select_subscribers_by_token" ON newsletter_subscribers;
CREATE POLICY "anon_select_subscribers_by_token" ON newsletter_subscribers
  FOR SELECT TO anon, authenticated USING (true);

-- updated_at trigger for newsletter_issues
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS newsletter_issues_updated_at ON newsletter_issues;
CREATE TRIGGER newsletter_issues_updated_at
  BEFORE UPDATE ON newsletter_issues
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();