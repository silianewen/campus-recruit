-- 0010_closes_at.sql — soft deadline for position submissions.
-- Run AFTER 0009_hr_rbac.sql. Idempotent.

ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS closes_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_positions_closes_at ON positions(closes_at);
