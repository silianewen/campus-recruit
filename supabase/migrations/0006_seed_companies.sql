-- 0006_seed_companies.sql — seed the 7 hiring companies
-- Run AFTER 0004_companies.sql (which only creates the table).
-- Idempotent (uses ON CONFLICT) — safe to re-run.
--
-- This migration exists because the original 0004 marked the INSERT as a
-- "manual step" in a comment, which was never executed. Encoding it as
-- a real migration prevents the next deployment from re-hitting the
-- empty-table problem.

INSERT INTO companies (id, name, description) VALUES
  ('hongguang_nano',      '宏光纳米科技（深圳）有限公司',     '纳米科技'),
  ('changlian_metal',     '昶联金属材料应用制品（广州）有限公司', '金属材料制品'),
  ('zhongnan_jicheng',    '中南机诚精密制品（深圳）有限公司',   '精密制造'),
  ('zhongnan_zhicheng',   '中南智诚科技（东莞）有限公司',       '科技制造'),
  ('yingshuo_laser',      '英硕激光科技（珠海）有限公司',       '激光科技'),
  ('zhongnan_yayuan',     '中南雅园产业管理（深圳）有限公司',   '产业园区管理'),
  ('yingtian_industrial', '盈天实业（深圳）有限公司',           '电子实业')
ON CONFLICT (id) DO NOTHING;
