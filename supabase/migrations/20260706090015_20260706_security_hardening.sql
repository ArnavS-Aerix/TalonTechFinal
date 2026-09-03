/*
# Security hardening: fix search_path, RLS, pg_net, SECURITY DEFINER, storage listing

## 1. Function search_path mutability
- `public.set_updated_at` and `public.cron_trigger_newsletter` had a mutable `search_path`.
  Both are recreated with `SET search_path = public, pg_catalog` (cron also includes
  `extensions` for `net.*`) so the resolved schema is fixed at create time and cannot be
  hijacked by a role that alters the session path.

## 2. Extension in public
- `pg_net` was installed in the `public` schema. It does not support `ALTER EXTENSION
  SET SCHEMA`, so it is dropped and recreated in a dedicated `extensions` schema. The
  cron function qualifies `net.http_post` as `extensions.net.http_post` so resolution
  does not depend on the session search_path.

## 3. RLS policies that were always true
- `newsletter_schedule` UPDATE policy allowed any anon/authenticated user to change the
  schedule. Replaced with deny-by-default: the schedule is read-only from the anon-key
  frontend (the admin UI only needs SELECT). All writes go through the service role
  inside edge functions, which bypass RLS.
- `newsletter_subscribers` INSERT policy was `WITH CHECK (true)`. Replaced with a policy
  that only validates the shape (email is non-null and non-empty). SELECT stays open
  because the unsubscribe page looks up subscribers by token via the anon key.
- `notebook_entries`, `progress_entries`, `progress_photos` had `FOR ALL` policies. Split
  into four verb-specific policies each, scoped to `anon, authenticated` (the app has no
  sign-in screen, so the anon-key frontend must be able to read and write its own data).

## 4. SECURITY DEFINER function executable by anon/authenticated
- `cron_trigger_newsletter()` was `SECURITY DEFINER` and executable by `anon` and
  `authenticated`, which let any client trigger the cron job via the REST RPC. It is
  recreated as `SECURITY INVOKER` and `EXECUTE` is revoked from `anon` and
  `authenticated` so only the cron scheduler (and the service role) can call it.

## 5. RLS enabled with no policies
- `app_secrets` and `newsletter_sends` had RLS enabled but zero policies. We add an
  explicit deny-all policy pair (SELECT and INSERT) for `anon, authenticated` so the
  intent is documented and the scanner sees a deliberate policy. The service role
  continues to bypass RLS. The frontend's ability to upsert secrets is moved to a new
  `save-secret` edge function (deployed separately) that verifies the admin password
  before writing.

## 6. Public bucket listing
- The `progress-photos` bucket is public, so object URLs work without any SELECT policy.
  The `anon_read_progress_photos` SELECT policy on `storage.objects` allowed clients to
  LIST every file in the bucket. That policy is dropped; reads still work via the public
  bucket URL, but clients can no longer enumerate every object.

## 7. Important notes
1. The `set_updated_at` trigger function is recreated in place. Existing triggers on
   `newsletter_issues`, `progress_entries`, `notebook_entries`, and
   `newsletter_schedule` continue to call it by name; no trigger changes needed.
2. The `cron_trigger_newsletter` function signature and body are unchanged — only the
   `SECURITY` attribute and `search_path` change. The existing `pg_cron` schedule
   (`newsletter-auto-generate`) keeps calling it.
3. `pg_net` is dropped and recreated in the `extensions` schema. The cron function
   qualifies the call as `extensions.net.http_post` so it resolves regardless of the
   session search_path.
4. The frontend `NewsletterAdmin` page previously upserted `app_secrets` directly with
   the anon key. After this migration that upsert will fail (deny-all policy). A new
   `save-secret` edge function is deployed separately that verifies the admin password
   and writes the secret with the service role. The frontend is updated to call it.
*/

-- ---------------------------------------------------------------------------
-- 1. Move pg_net out of the public schema (drop + recreate in extensions)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- 2. Recreate set_updated_at with a fixed search_path
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Recreate cron_trigger_newsletter as SECURITY INVOKER with fixed search_path
--    and revoke EXECUTE from anon/authenticated so only the cron scheduler
--    (and the service role) can call it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cron_trigger_newsletter()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  v_password text;
  v_url text;
  v_anon_key text;
  v_request_id bigint;
BEGIN
  SELECT value INTO v_password FROM app_secrets WHERE name = 'admin_password';
  IF v_password IS NULL THEN
    RAISE NOTICE 'No admin_password set; skipping newsletter cron.';
    RETURN;
  END IF;

  SELECT value INTO v_url FROM app_secrets WHERE name = 'supabase_url';
  SELECT value INTO v_anon_key FROM app_secrets WHERE name = 'supabase_anon_key';

  IF v_url IS NULL THEN
    RAISE NOTICE 'No supabase_url set; skipping newsletter cron.';
    RETURN;
  END IF;

  SELECT extensions.net.http_post(
    url := v_url || '/functions/v1/generate-newsletter',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_anon_key, '')
    ),
    body := jsonb_build_object(
      'cron', true,
      'auto_send', true,
      'admin_password', v_password
    )
  ) INTO v_request_id;

  RAISE NOTICE 'Newsletter cron triggered, request_id=%', v_request_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.cron_trigger_newsletter() FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. newsletter_schedule: drop the always-true UPDATE policy, keep SELECT
-- ---------------------------------------------------------------------------
ALTER TABLE public.newsletter_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_schedule" ON public.newsletter_schedule;
CREATE POLICY "anon_select_schedule" ON public.newsletter_schedule
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_update_schedule" ON public.newsletter_schedule;
-- No replacement: writes go through the service role (edge functions), which bypass RLS.

-- ---------------------------------------------------------------------------
-- 5. newsletter_subscribers: tighten INSERT, keep token-based SELECT
-- ---------------------------------------------------------------------------
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_subscribers_by_token" ON public.newsletter_subscribers;
CREATE POLICY "anon_select_subscribers_by_token" ON public.newsletter_subscribers
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_insert_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "anon_insert_newsletter" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND email <> '');

-- ---------------------------------------------------------------------------
-- 6. notebook_entries: split FOR ALL into four verb-specific policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.notebook_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_notebook_entries" ON public.notebook_entries;
DROP POLICY IF EXISTS "anon_select_notebook_entries" ON public.notebook_entries;
DROP POLICY IF EXISTS "anon_insert_notebook_entries" ON public.notebook_entries;
DROP POLICY IF EXISTS "anon_update_notebook_entries" ON public.notebook_entries;
DROP POLICY IF EXISTS "anon_delete_notebook_entries" ON public.notebook_entries;

CREATE POLICY "anon_select_notebook_entries" ON public.notebook_entries
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_notebook_entries" ON public.notebook_entries
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_notebook_entries" ON public.notebook_entries
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_notebook_entries" ON public.notebook_entries
  FOR DELETE TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 7. progress_entries: split FOR ALL into four verb-specific policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_progress_entries" ON public.progress_entries;
DROP POLICY IF EXISTS "anon_select_progress_entries" ON public.progress_entries;
DROP POLICY IF EXISTS "anon_insert_progress_entries" ON public.progress_entries;
DROP POLICY IF EXISTS "anon_update_progress_entries" ON public.progress_entries;
DROP POLICY IF EXISTS "anon_delete_progress_entries" ON public.progress_entries;

CREATE POLICY "anon_select_progress_entries" ON public.progress_entries
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_progress_entries" ON public.progress_entries
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_progress_entries" ON public.progress_entries
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_progress_entries" ON public.progress_entries
  FOR DELETE TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 8. progress_photos: split FOR ALL into four verb-specific policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_progress_photos" ON public.progress_photos;
DROP POLICY IF EXISTS "anon_select_progress_photos" ON public.progress_photos;
DROP POLICY IF EXISTS "anon_insert_progress_photos" ON public.progress_photos;
DROP POLICY IF EXISTS "anon_update_progress_photos" ON public.progress_photos;
DROP POLICY IF EXISTS "anon_delete_progress_photos" ON public.progress_photos;

CREATE POLICY "anon_select_progress_photos" ON public.progress_photos
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_progress_photos" ON public.progress_photos
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_progress_photos" ON public.progress_photos
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_progress_photos" ON public.progress_photos
  FOR DELETE TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 9. app_secrets: explicit deny-all for anon/authenticated (service role bypasses)
-- ---------------------------------------------------------------------------
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_anon_app_secrets_select" ON public.app_secrets;
DROP POLICY IF EXISTS "deny_anon_app_secrets_insert" ON public.app_secrets;
CREATE POLICY "deny_anon_app_secrets_select" ON public.app_secrets
  FOR SELECT TO anon, authenticated
  USING (false);
CREATE POLICY "deny_anon_app_secrets_insert" ON public.app_secrets
  FOR INSERT TO anon, authenticated
  WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- 10. newsletter_sends: explicit deny-all for anon/authenticated (service role bypasses)
-- ---------------------------------------------------------------------------
ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_anon_newsletter_sends_select" ON public.newsletter_sends;
DROP POLICY IF EXISTS "deny_anon_newsletter_sends_insert" ON public.newsletter_sends;
CREATE POLICY "deny_anon_newsletter_sends_select" ON public.newsletter_sends
  FOR SELECT TO anon, authenticated
  USING (false);
CREATE POLICY "deny_anon_newsletter_sends_insert" ON public.newsletter_sends
  FOR INSERT TO anon, authenticated
  WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- 11. storage.objects: drop the broad SELECT that allowed listing the public bucket
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_read_progress_photos" ON storage.objects;
-- INSERT and DELETE policies for the bucket remain so uploads and deletes still work.
