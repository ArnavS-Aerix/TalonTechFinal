/*
# Add DELETE policies for sponsorships and donations

## Problem
The sponsorships and donations tables have RLS enabled but only INSERT and SELECT
policies. The admin center's delete buttons fail silently because no DELETE policy
exists, so RLS blocks every delete.

## Fix
Add DELETE policies for both tables scoped to `anon, authenticated` (the app has no
sign-in screen, so the anon-key frontend must be able to delete its own data).
*/

-- sponsorships: add DELETE policy
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_delete_sponsorships" ON public.sponsorships;
CREATE POLICY "anon_delete_sponsorships" ON public.sponsorships
  FOR DELETE TO anon, authenticated USING (true);

-- donations: add DELETE policy
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_delete_donations" ON public.donations;
CREATE POLICY "anon_delete_donations" ON public.donations
  FOR DELETE TO anon, authenticated USING (true);
