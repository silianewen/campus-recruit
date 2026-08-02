-- 0016_site_content_group_logo.sql — drive the group logo from the
-- database too, so it follows the same "edit via SQL, no code change"
-- workflow as the company logos.
--
-- To set the group logo:
--   UPDATE site_content SET group_logo_url = '/logos/group.png' WHERE id = 'singleton';
--
-- To clear (revert to placeholder):
--   UPDATE site_content SET group_logo_url = NULL WHERE id = 'singleton';
--
-- Idempotent: ADD COLUMN IF NOT EXISTS keeps re-runs safe.

ALTER TABLE site_content
  ADD COLUMN IF NOT EXISTS group_logo_url TEXT;