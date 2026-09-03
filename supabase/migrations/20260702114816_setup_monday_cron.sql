-- Enable pg_cron and pg_net extensions for scheduled auto-send
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop any existing job so we can recreate cleanly
DO $$
BEGIN
  PERFORM cron.unschedule('newsletter-auto-generate');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Seed supabase_url and supabase_anon_key into app_secrets if not present.
-- The cron function reads these to call the edge function via pg_net.
INSERT INTO app_secrets (name, value) VALUES
  ('supabase_url', 'https://dyicrbnqayunhwofmzij.supabase.co'),
  ('supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aWNyYm5xYXl1bmh3b2ZtemlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODgzNTYsImV4cCI6MjA5Nzk2NDM1Nn0.9ocdIp0ZdUeT6l083PXZ2f1MNaSTPZFE-wRTwdB4EWo')
ON CONFLICT (name) DO NOTHING;

-- The cron trigger: reads admin_password + supabase_url + anon key from app_secrets,
-- then POSTs to the generate-newsletter edge function with cron=true, auto_send=true.
CREATE OR REPLACE FUNCTION cron_trigger_newsletter()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

  SELECT net.http_post(
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

-- Schedule: every Monday at 09:00 UTC (cron: minute 0, hour 9, day-of-week 1=Monday)
SELECT cron.schedule(
  'newsletter-auto-generate',
  '0 9 * * 1',
  $$SELECT cron_trigger_newsletter();$$
);