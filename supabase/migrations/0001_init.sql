-- 0001_init.sql — core schema
-- Run this in Supabase SQL Editor AFTER creating the project.
-- Idempotent: safe to re-run during iteration.

-- =========================================================================
-- POSITIONS — fixed list of job openings, used for QR codes & filtering
-- =========================================================================
CREATE TABLE IF NOT EXISTS positions (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- RESUMES — one row per uploaded resume file (metadata + storage path)
-- =========================================================================
CREATE TABLE IF NOT EXISTS resumes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  phone        TEXT NOT NULL,
  email        TEXT,
  major        TEXT NOT NULL,
  university   TEXT NOT NULL,
  position_id  TEXT NOT NULL REFERENCES positions(id),
  file_url     TEXT NOT NULL,           -- public URL in Storage bucket `resumes`
  file_name    TEXT NOT NULL,
  file_size    INTEGER NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_resumes_phone     ON resumes(phone);
CREATE INDEX IF NOT EXISTS idx_resumes_position ON resumes(position_id);

-- =========================================================================
-- SUBMISSIONS — one row per (resume, position) — tracks the funnel state
-- =========================================================================
CREATE TABLE IF NOT EXISTS submissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id    UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  position_id  TEXT NOT NULL REFERENCES positions(id),
  channel      TEXT NOT NULL DEFAULT 'qr-website',
  status       TEXT NOT NULL DEFAULT 'submitted'
                 CHECK (status IN ('submitted','reviewed','interview_scheduled',
                                   'interviewed','offered','rejected')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_submissions_status   ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_position ON submissions(position_id);

-- Auto-bump updated_at on UPDATE
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_submissions_touch ON submissions;
CREATE TRIGGER trg_submissions_touch
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =========================================================================
-- NOTIFICATIONS — in-app messages addressed to a student phone
-- =========================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      TEXT NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  type       TEXT NOT NULL
               CHECK (type IN ('interview_invite','status_update','test_invite')),
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_phone ON notifications(phone);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(phone) WHERE read = FALSE;

-- =========================================================================
-- PERSONALITY_RESULTS — MBTI-style test outcomes
-- =========================================================================
CREATE TABLE IF NOT EXISTS personality_results (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      TEXT NOT NULL,
  scores     JSONB NOT NULL,            -- {E,I,S,N,T,F,J,P} integer counts
  mbti_type  TEXT NOT NULL,             -- 4-letter code, e.g. 'INTJ'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_personality_phone ON personality_results(phone);

-- =========================================================================
-- SKILL_RESULTS — professional test scores per (phone, position)
-- =========================================================================
CREATE TABLE IF NOT EXISTS skill_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL,
  position_id TEXT NOT NULL REFERENCES positions(id),
  score       INTEGER NOT NULL,
  total       INTEGER NOT NULL,
  answers     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_skill_phone      ON skill_results(phone);
CREATE INDEX IF NOT EXISTS idx_skill_position   ON skill_results(position_id);

-- =========================================================================
-- QUESTIONS_SKILL — professional test question bank, per position
-- =========================================================================
CREATE TABLE IF NOT EXISTS questions_skill (
  id          TEXT PRIMARY KEY,                  -- e.g. 'fe-1'
  position_id TEXT NOT NULL REFERENCES positions(id),
  question    TEXT NOT NULL,
  options     JSONB NOT NULL,                    -- [{key,text}]
  answer      TEXT NOT NULL                      -- correct option key
);
CREATE INDEX IF NOT EXISTS idx_questions_skill_position ON questions_skill(position_id);

-- =========================================================================
-- RLS NOTE
-- For this MVP we intentionally DO NOT enable RLS:
--   * Students submit anonymously (no auth) — anon key is used by the SPA
--   * HR is a single trusted user — will lock down later via Supabase Auth
-- Re-enable RLS before any non-demo deployment. See docs/security.md.
-- =========================================================================