-- 0017_site_content_privacy_policy.sql — store the privacy policy body
-- the user must consent to before submitting a resume. Drives the
-- /privacy route and the consent-checkbox gate on /upload.
--
-- To populate:
--   UPDATE site_content
--      SET privacy_policy = '你的完整隐私政策正文。多段直接换行。'
--    WHERE id = 'singleton';
--
-- Idempotent.

ALTER TABLE site_content
  ADD COLUMN IF NOT EXISTS privacy_policy TEXT;