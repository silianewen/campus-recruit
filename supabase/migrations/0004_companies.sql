-- 0004_companies.sql — multi-company support
-- Idempotent: safe to re-run.

-- =========================================================================
-- COMPANIES — the 7 hiring companies (alibaba, tencent, etc.)
-- =========================================================================
CREATE TABLE IF NOT EXISTS companies (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- Add company_id column to existing tables.
-- Nullable for now — backfill runs once user provides the company list.
-- =========================================================================
ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES companies(id);

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES companies(id);

CREATE INDEX IF NOT EXISTS idx_resumes_company     ON resumes(company_id);
CREATE INDEX IF NOT EXISTS idx_submissions_company ON submissions(company_id);

-- =========================================================================
-- (Manual step after this migration runs)
-- 1. Open Supabase → SQL Editor → new query → paste the seed INSERTs the
--    user provides (7 rows into companies), run.
-- 2. Open scripts/seed-test-data.mjs logic (run once) to assign company_id
--    to existing 50 records.
-- =========================================================================