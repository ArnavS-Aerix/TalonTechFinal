-- Replace overly permissive INSERT policies with constrained equivalents
-- that validate the row data rather than blindly allowing everything.

DROP POLICY IF EXISTS "anon_insert_sponsorships" ON sponsorships;
CREATE POLICY "anon_insert_sponsorships" ON sponsorships FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(company_name)) > 0 AND
    length(trim(contact_name)) > 0 AND
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND
    tier IN ('Bronze', 'Silver', 'Gold', 'Platinum') AND
    amount > 0
  );

DROP POLICY IF EXISTS "anon_insert_donations" ON donations;
CREATE POLICY "anon_insert_donations" ON donations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(name)) > 0 AND
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND
    amount > 0
  );
