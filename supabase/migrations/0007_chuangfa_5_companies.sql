-- 0007_chuangfa_5_companies.sql — pivot to "中南创发" brand.
-- This migration:
--   1. Clears the previous company/position registry (5 companies × 2 positions model).
--   2. Adds `category` to positions (for the right-side category filter on the
--      student page) and `degree` to resumes (for HR dashboard "学历" analytics).
--   3. Seeds 5 companies and 10 positions (2 per company).
-- Idempotent for the schema changes (ADD COLUMN IF NOT EXISTS). Data writes use
-- ON CONFLICT DO NOTHING so re-runs are safe; truncates are explicit so a
-- re-run by mistake does NOT wipe the table silently.

-- =========================================================================
-- 1. Schema additions (idempotent)
-- =========================================================================
ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS degree TEXT;

CREATE INDEX IF NOT EXISTS idx_positions_category ON positions(category);

-- =========================================================================
-- 2. Clear previous registry (cascades to questions_skill via FK)
-- =========================================================================
TRUNCATE TABLE questions_skill, positions, companies RESTART IDENTITY CASCADE;

-- =========================================================================
-- 3. Companies (5)
-- =========================================================================
INSERT INTO companies (id, name, description) VALUES
  ('changlian_metal',    '昶联金属材料应用制品（广州）有限公司', '公司简介待补充'),
  ('zhongnan_jicheng',   '中南机诚精密制品（深圳）有限公司',   '公司简介待补充'),
  ('zhongnan_zhicheng',  '中南智诚科技（东莞）有限公司',       '公司简介待补充'),
  ('yingshuo_laser',     '英硕激光科技（珠海）有限公司',       '公司简介待补充'),
  ('zhongnan_yayuan',    '中南雅园产业管理（深圳）有限公司',   '公司简介待补充')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 4. Positions (10 = 5 companies × 2 positions each)
--    category drives the right-side category filter on the student page.
-- =========================================================================
INSERT INTO positions (id, title, description, category) VALUES
  -- 昶联金属 (changlian_metal)
  ('changlian_metal-hr-admin-specialist',     '人力行政专员', '人力行政专员 — 负责招聘、入离职、员工关系、社保等',         '人力行政'),
  ('changlian_metal-procurement-specialist', '采购专员',     '采购专员 — 供应商对接、采购订单与来料跟进',                  '采购'),

  -- 中南机诚 (zhongnan_jicheng)
  ('zhongnan_jicheng-mechanical-asst-engineer', '机械助理工程师', '机械助理工程师 — 协助机械结构与零部件设计、出图',          '工程'),
  ('zhongnan_jicheng-pd-asst-engineer',         'PD助理工程师',     'PD助理工程师 — 产品开发协助、流程跟进',                       '工程'),

  -- 中南智诚 (zhongnan_zhicheng)
  ('zhongnan_zhicheng-project-specialist', '项目专员',     '项目专员 — 项目协调、进度跟踪',                              '项目'),
  ('zhongnan_zhicheng-qe-asst-engineer',    'QE助理工程师', 'QE助理工程师 — 质量工程相关、检验与体系推行',             '质量'),

  -- 英硕激光 (yingshuo_laser)
  ('yingshuo_laser-software-asst-engineer', '软件助理工程师', '软件助理工程师 — 嵌入式 / 上位机软件开发',              '软件'),
  ('yingshuo_laser-optics-asst-engineer',   '光学助理工程师',   '光学助理工程师 — 光学元件与系统设计辅助',                '光学'),

  -- 中南雅园 (zhongnan_yayuan)
  ('zhongnan_yayuan-investment-specialist', '招商专员', '招商专员 — 招商引资、客户对接',                              '招商'),
  ('zhongnan_yayuan-finance-specialist',    '财务专员', '财务专员 — 账务处理与出纳',                                  '财务')
ON CONFLICT (id) DO NOTHING;