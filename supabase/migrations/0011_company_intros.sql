-- 0011_company_intros.sql — populate companies.description with the real
-- intro text written by the team in /introduction_file.txt (2026-07-28).
-- The Home page and CompanyDetail page both read companies.description.
--
-- The existing "changlian_metal" id maps to the "昶联" prefix, etc. Per the
-- short-name table in src/lib/companies.ts:
--
--   changlian_metal    → 昶联
--   zhongnan_jicheng   → 中南机诚
--   zhongnan_zhicheng  → 中南智诚
--   yingshuo_laser     → 英硕激光
--   zhongnan_yayuan    → 中南雅园
--
-- Note: the existing companies table has only ONE column for description
-- (single company); the "集团介绍" paragraph above the company cards on
-- Home is sourced from a separate copy in src/pages/Home.tsx. See the
-- accompanying code change that hard-codes the group intro there.

UPDATE companies SET description = $changlian$昶联公司位于广州南沙区，业务涵盖金属粉末注射成型（MIM），镁/铝合金射出成型，金属增材制造（MAM），热等静压（HIP），锻压及冲压等金属材料制品，锂电池正极材料，纳米铜材料，聚乙烯醇缩丁醛脂（PVB）膜等，产品销往全球30个国家和地区，是全球大型的金属粉末注射成型生产与粉末冶金工艺拓展基地。$changlian$
  WHERE id = 'changlian_metal';

UPDATE companies SET description = $jicheng$中南机诚位于深圳龙岗平湖，总建筑面积约3万平方米。现有员工1000多人，拥有各种高新生产设备1500多台，在金属加工领域具有领先技术和雄厚的实力。中南机诚拥有多元化业务结构，包括传统手表、智能手表、可穿戴设备、消费类电子、车载外饰件及内饰件、半导体阀体等高端产品的金属零部件加工业务。$jicheng$
  WHERE id = 'zhongnan_jicheng';

UPDATE companies SET description = $zhicheng$中南智诚位于东莞谢岗，占地5万平方米，专注于金属加工领域，立足于精密加工与智能制造领域，致力于为客户提供高标准、高品质的整体解决方案。通过不断引进先进设备与技术，建设现代化生产车间，形成从研发设计到加工制造的全流程服务体系。$zhicheng$
  WHERE id = 'zhongnan_zhicheng';

UPDATE companies SET description = $yingshuo$英硕激光位于珠海香洲区，公司主营先进激光设备的研发、生产和销售，产品主要为半导体与高速PCB结合（IC载板）的激光钻孔设备，广泛应用于人工智能、通信设备、数据中心等领域的关键技术解决方案。$yingshuo$
  WHERE id = 'yingshuo_laser';

UPDATE companies SET description = $yayuan$The Rows 中南雅园位于深圳龙岗坂田，公司专注于生态园区运营，是以研发、设计、生产、展示等功能为一体的智能产业园区，同时提供运动+艺术+社交的优质人居。$yayuan$
  WHERE id = 'zhongnan_yayuan';