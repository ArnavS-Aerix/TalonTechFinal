-- FAQ table
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_faqs" ON faqs;
CREATE POLICY "anon_all_faqs" ON faqs
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL DEFAULT 'General Inquiry',
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contact" ON contact_messages;
CREATE POLICY "anon_insert_contact" ON contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_contact" ON contact_messages;
CREATE POLICY "anon_all_contact" ON contact_messages
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_contact" ON contact_messages;
CREATE POLICY "anon_update_contact" ON contact_messages
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_contact" ON contact_messages;
CREATE POLICY "anon_delete_contact" ON contact_messages
  FOR DELETE TO anon, authenticated USING (true);
