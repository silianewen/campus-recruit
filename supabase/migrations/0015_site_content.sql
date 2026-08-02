-- 0015_site_content.sql — single-row table for site-wide copy that the user
-- wants to edit without touching code (currently: 集团简介).
--
-- Why a table (not a single row in `companies`)? Because the group intro is
-- not really "about the company" — it's marketing copy on the public Home
-- page. Keeping it separate lets the user add more site-wide fields later
-- (footer, slogan, terms-of-service link, ...) without touching the
-- companies schema.
--
-- To update the group intro:
--   UPDATE site_content SET group_intro = '新简介' WHERE id = 'singleton';
--
-- Idempotent: INSERT ... ON CONFLICT DO NOTHING.

CREATE TABLE IF NOT EXISTS site_content (
  id           TEXT PRIMARY KEY,
  group_intro  TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO site_content (id, group_intro) VALUES
  ('singleton', NULL)
ON CONFLICT (id) DO NOTHING;