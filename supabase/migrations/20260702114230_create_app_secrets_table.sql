/*
# Create app_secrets table for edge function secrets

1. New Tables
- `app_secrets`
  - `name` (text, primary key) — secret name, e.g. "resend_api_key", "admin_password"
  - `value` (text, not null) — the secret value
  - `updated_at` (timestamptz, default now())
2. Security
- RLS ENABLED, NO policies. This means anon and authenticated roles have ZERO access. Only the service role (used by edge functions) can read/write this table.
- This is the correct pattern for storing third-party API keys and admin passwords when the MCP secret-management tools are not available.
3. Important Notes
1. Edge functions read secrets from this table using the SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
2. The frontend NEVER has access to this table — the anon key returns no rows.
4. Seed data
- Inserts `resend_api_key` and `admin_password` rows. These are overwritten by the deployer after this migration runs.
*/

CREATE TABLE IF NOT EXISTS app_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;

-- No policies: only the service role can access this table.

INSERT INTO app_secrets (name, value) VALUES
  ('resend_api_key', 'PLACEHOLDER_REPLACE_ME'),
  ('admin_password', 'PLACEHOLDER_REPLACE_ME')
ON CONFLICT (name) DO NOTHING;