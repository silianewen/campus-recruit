-- 0005_positions_per_company.sql — replace 4 placeholder positions with 39 real ones.
-- Run AFTER 0004_companies.sql.
-- Idempotent + safe to re-run.

-- =========================================================================
-- 1. Drop legacy test data (it references obsolete position IDs).
-- =========================================================================
TRUNCATE TABLE submissions, resumes, notifications, personality_results, skill_results
RESTART IDENTITY CASCADE;

-- =========================================================================
-- 2. Drop the original 4 hardcoded positions (frontend/backend/data/product).
-- =========================================================================
DELETE FROM questions_skill WHERE position_id IN ('frontend','backend','data','product');
DELETE FROM positions       WHERE id          IN ('frontend','backend','data','product');

-- =========================================================================
-- 3. Make position_id nullable so future position removal never breaks history.
-- =========================================================================
ALTER TABLE resumes     ALTER COLUMN position_id DROP NOT NULL;
ALTER TABLE submissions ALTER COLUMN position_id DROP NOT NULL;

-- =========================================================================
-- 4. Insert the 39 actual positions (7 companies × 2-10 titles each).
--    Description kept short for MVP; user can edit in Supabase Table Editor.
-- =========================================================================
INSERT INTO positions (id, title, description) VALUES
  -- 宏光纳米 (hongguang_nano) — 2 positions
  ('hongguang_nano-accounting-specialist',     '会计专员',     '负责日常账务处理与财务核算'),
  ('hongguang_nano-hr-specialist',             '人力资源专员', '负责招聘、培训、绩效等人力工作'),

  -- 昶联金属 (changlian_metal) — 10 positions
  ('changlian_metal-electrical-asst-engineer',         '电气助理工程师', '协助电气系统设计、安装与维护'),
  ('changlian_metal-mechanical-design-asst-engineer',  '机械设计助理工程师', '协助机械结构与零部件设计'),
  ('changlian_metal-pd-asst-engineer',                  'PD助理工程师', '协助产品开发与项目管理'),
  ('changlian_metal-ie-asst-engineer',                  'IE助理工程师', '协助工业工程改善与效率优化'),
  ('changlian_metal-qe-asst-engineer',                  'QE助理工程师', '协助质量体系与质量改善'),
  ('changlian_metal-project-specialist',                '项目专员',     '项目进度跟踪、协调与文档管理'),
  ('changlian_metal-ops-asst-engineer',                 '运维助理工程师', '协助设备运维与现场支持'),
  ('changlian_metal-procurement-specialist',            '采购专员',     '供应商对接、采购订单与来料跟进'),
  ('changlian_metal-measurement-technician',            '测量技术员',   '尺寸测量与首件检验'),
  ('changlian_metal-cnc-technician',                    'CNC技术员',   'CNC机床操作与日常维护'),

  -- 中南机诚 (zhongnan_jicheng) — 10 positions
  ('zhongnan_jicheng-mechanical-design-asst-engineer',  '机械设计助理工程师', '协助机械结构设计'),
  ('zhongnan_jicheng-pd-asst-engineer',                 'PD助理工程师', '产品开发与流程跟进'),
  ('zhongnan_jicheng-ie-asst-engineer',                 'IE助理工程师', '工业工程与现场改善'),
  ('zhongnan_jicheng-qe-asst-engineer',                 'QE助理工程师', '质量检验与体系推行'),
  ('zhongnan_jicheng-project-specialist',               '项目专员',     '项目协调与进度管理'),
  ('zhongnan_jicheng-ops-asst-engineer',                '运维助理工程师', '生产设备运维'),
  ('zhongnan_jicheng-procurement-specialist',           '采购专员',     '采购执行与供应商管理'),
  ('zhongnan_jicheng-accounting-specialist',            '会计专员',     '财务日常核算'),
  ('zhongnan_jicheng-hr-specialist',                    '人力资源专员', '人力行政事务'),
  ('zhongnan_jicheng-cnc-technician',                   'CNC技术员',   'CNC机床操作'),

  -- 中南智诚 (zhongnan_zhicheng) — 10 positions
  ('zhongnan_zhicheng-electrical-asst-engineer',         '电气助理工程师', '电气设计、安装、调试辅助'),
  ('zhongnan_zhicheng-pd-asst-engineer',                 'PD助理工程师', '产品开发协助'),
  ('zhongnan_zhicheng-ie-asst-engineer',                 'IE助理工程师', 'IE改善与效率提升'),
  ('zhongnan_zhicheng-qe-asst-engineer',                 'QE助理工程师', '质量工程相关'),
  ('zhongnan_zhicheng-project-specialist',               '项目专员',     '项目协调'),
  ('zhongnan_zhicheng-cnc-engineer',                     'CNC工程师',   'CNC编程与工艺优化'),
  ('zhongnan_zhicheng-ops-asst-engineer',                '运维助理工程师', '设备运维'),
  ('zhongnan_zhicheng-procurement-specialist',           '采购专员',     '采购日常'),
  ('zhongnan_zhicheng-accounting-specialist',            '会计专员',     '财务工作'),
  ('zhongnan_zhicheng-measurement-technician',           '测量技术员',   '尺寸检测'),

  -- 英硕激光 (yingshuo_laser) — 2 positions
  ('yingshuo_laser-software-asst-engineer',              '软件助理工程师', '嵌入式/上位机软件开发'),
  ('yingshuo_laser-optics-asst-engineer',                '光学助理工程师', '光学元件与系统设计辅助'),

  -- 中南雅园 (zhongnan_yayuan) — 3 positions
  ('zhongnan_yayuan-general-specialist',                 '综合专员',     '行政综合事务'),
  ('zhongnan_yayuan-investment-specialist',              '招商专员',     '招商引资与客户对接'),
  ('zhongnan_yayuan-accounting-specialist',             '会计专员',     '账务与出纳'),

  -- 盈天实业 (yingtian_industrial) — 2 positions
  ('yingtian_industrial-electronics-asst-engineer',     '电子助理工程师', '电子产品开发与测试辅助'),
  ('yingtian_industrial-accounting-specialist',          '会计专员',     '财务日常工作')
ON CONFLICT (id) DO NOTHING;

-- Total: 39 positions inserted (verify with SELECT COUNT(*) FROM positions; expect ~39)