-- 0013_company_short_name.sql — add a `short_name` column so the user can
-- rename a company + its abbreviation in ONE SQL statement:
--
--   UPDATE companies
--      SET name = 'AA金属（广州）有限公司',
--          short_name = 'AA',
--          description = NULL
--    WHERE id = 'changlian_metal';
--
-- The UI reads short_name from this column. If NULL, the SPA falls back to
-- the legacy SHORT_NAMES table in src/lib/companies.ts (which is hard-coded
-- and tied to source code). Once the user is happy with the new short_names
-- we can drop the fallback — but it stays until then so the project still
-- works on Supabase even before this migration is run.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS short_name TEXT;

-- Seed initial values for the 5 known companies. Re-runs are safe — the
-- UPDATE is idempotent because the column doesn't exist in the row, then
-- gets set, and re-running sets the same value.
UPDATE companies SET short_name = '昶联'     WHERE id = 'changlian_metal';
UPDATE companies SET short_name = '中南机诚' WHERE id = 'zhongnan_jicheng';
UPDATE companies SET short_name = '中南智诚' WHERE id = 'zhongnan_zhicheng';
UPDATE companies SET short_name = '英硕激光' WHERE id = 'yingshuo_laser';
UPDATE companies SET short_name = '中南雅园' WHERE id = 'zhongnan_yayuan';