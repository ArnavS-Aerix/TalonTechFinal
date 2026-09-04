-- Add funds_raised and fundraising_goal to site_settings
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS funds_raised numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fundraising_goal numeric NOT NULL DEFAULT 10000;

-- Set initial values
UPDATE site_settings
  SET funds_raised = 2700, fundraising_goal = 10000
  WHERE id = 1 AND funds_raised = 0;
