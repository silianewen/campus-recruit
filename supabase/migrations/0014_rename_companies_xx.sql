-- 0014_rename_companies_xx.sql — first rename to XX placeholders so the
-- database matches the UI placeholder text. Replaces the existing names
-- without touching ids (ids stay stable for URLs + FK relationships).
-- Idempotent: re-runs are safe; same value gets set.

UPDATE companies SET name = 'XX集团', short_name = 'XX集团'
  WHERE id = 'group';

UPDATE companies SET name = 'AA金属（广州）有限公司', short_name = 'AA'
  WHERE id = 'changlian_metal';
UPDATE companies SET name = 'BB精密（深圳）有限公司', short_name = 'BB'
  WHERE id = 'zhongnan_jicheng';
UPDATE companies SET name = 'CC科技（东莞）有限公司', short_name = 'CC'
  WHERE id = 'zhongnan_zhicheng';
UPDATE companies SET name = 'DD激光（珠海）有限公司', short_name = 'DD'
  WHERE id = 'yingshuo_laser';
UPDATE companies SET name = 'EE产业管理（深圳）有限公司', short_name = 'EE'
  WHERE id = 'zhongnan_yayuan';

-- Clear descriptions + logos so the placeholder UI shows clean.
UPDATE companies SET description = NULL;
UPDATE companies SET logo_url = NULL;