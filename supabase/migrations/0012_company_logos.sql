-- 0012_company_logos.sql — point companies.logo_url to the logos that ship
-- with the frontend bundle under /public/logos/.
--
-- The 6 PNG files (group, changlian_metal, zhongnan_jicheng, zhongnan_zhicheng,
-- yingshuo_laser, zhongnan_yayuan) are committed alongside the frontend code
-- and served from the Vercel CDN at /logos/<id>.png.
--
-- Idempotent: safe to re-run.

UPDATE companies SET logo_url = '/logos/group.png'             WHERE id = 'group';
UPDATE companies SET logo_url = '/logos/changlian_metal.png'   WHERE id = 'changlian_metal';
UPDATE companies SET logo_url = '/logos/zhongnan_jicheng.png'  WHERE id = 'zhongnan_jicheng';
UPDATE companies SET logo_url = '/logos/zhongnan_zhicheng.png' WHERE id = 'zhongnan_zhicheng';
UPDATE companies SET logo_url = '/logos/yingshuo_laser.png'    WHERE id = 'yingshuo_laser';
UPDATE companies SET logo_url = '/logos/zhongnan_yayuan.png'   WHERE id = 'zhongnan_yayuan';