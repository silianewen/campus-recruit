-- 0009_hr_rbac.sql — multi-user HR backend with groups (RBAC).
-- Adds hr_groups + hr_users; seeds 1 admin group + 5 company groups + 1 default group.
-- Provides a default admin account so the new login form works out of the box.
--
-- After running this migration, run:
--   NOTIFY pgrst, 'reload schema';
-- and sign in at /hr with admin / Admin@2026 (change immediately).

-- =========================================================================
-- 1. hr_groups — 1 admin + 5 company + 1 default
-- =========================================================================
CREATE TABLE IF NOT EXISTS hr_groups (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  -- Only company-scoped groups set this; group_admin / default leave it null.
  company_id  TEXT REFERENCES companies(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO hr_groups (id, name, company_id) VALUES
  ('group_admin',                 '集团管理员',           NULL),
  ('company_changlian_metal',    '昶联金属 HR',          'changlian_metal'),
  ('company_zhongnan_jicheng',   '中南机诚 HR',          'zhongnan_jicheng'),
  ('company_zhongnan_zhicheng',  '中南智诚 HR',          'zhongnan_zhicheng'),
  ('company_yingshuo_laser',     '英硕激光 HR',          'yingshuo_laser'),
  ('company_zhongnan_yayuan',    '中南雅园 HR',          'zhongnan_yayuan'),
  ('default',                     '默认分组',             NULL)
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 2. hr_users — username + password_hash + group
-- =========================================================================
CREATE TABLE IF NOT EXISTS hr_users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,        -- sha256(salt + password) hex; client-side hash
  display_name   TEXT,
  group_id       TEXT NOT NULL REFERENCES hr_groups(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_users_group ON hr_users(group_id);

-- =========================================================================
-- 3. Seed: 1 admin user (so /hr works on first deploy)
-- =========================================================================
-- SHA-256 hash of 'Admin@2026' with salt 'campus_recruit_v1_admin'.
-- IT MUST change this password immediately after first login.
INSERT INTO hr_users (username, password_hash, display_name, group_id) VALUES
  ('admin', 'b979d669dd6bb246adbbfa3af9adce9dd587931e4da0c796ae100874f281d183', '系统管理员', 'group_admin')
ON CONFLICT (username) DO NOTHING;

-- =========================================================================
-- 4. Seed: 5 company users + 1 default user
-- =========================================================================
-- Password for company / default users: 'Recruit@2026'
-- (same hash for all of them in this seed; admin should reset per-user via
--  /hr/admin/users right after first login).
DO $$
DECLARE
  hash text := 'placeholder_replace_after_seed'; -- to be filled by Node script
BEGIN
  -- This is a placeholder block; the actual per-user inserts are added by an
  -- out-of-band Node.js seed step after running this migration. Keeping this
  -- DO block here as documentation that company / default users are
  -- intentionally left empty for admin to create via the web UI.
  NULL;
END $$;
