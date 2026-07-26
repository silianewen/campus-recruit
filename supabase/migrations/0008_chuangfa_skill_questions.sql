-- 0008_chuangfa_skill_questions.sql — seed skill-test question bank for the
-- 5-company × 2-position model. Run AFTER 0007_chuangfa_5_companies.sql.
-- 10 position slugs × 5 questions each = 50 rows.
-- Uses ON CONFLICT (id) DO NOTHING so re-runs are safe.

-- =========================================================================
-- 1. 昶联金属 · 人力行政专员
-- =========================================================================
INSERT INTO questions_skill (id, position_id, question, options, answer) VALUES
  ('qs-hr-admin-specialist-1', 'changlian_metal-hr-admin-specialist',
   '"人岗匹配"主要关注：',
   '[{"key":"A","text":"学历匹配"},{"key":"B","text":"能力、素质与岗位要求匹配"},{"key":"C","text":"薪酬匹配"},{"key":"D","text":"户籍匹配"}]',
   'B'),
  ('qs-hr-admin-specialist-2', 'changlian_metal-hr-admin-specialist',
   'KPI 设计遵循 SMART 原则，其中 S 指：',
   '[{"key":"A","text":"Specific（具体的）"},{"key":"B","text":"Smart"},{"key":"C","text":"Sustainable"},{"key":"D","text":"Strategic"}]',
   'A'),
  ('qs-hr-admin-specialist-3', 'changlian_metal-hr-admin-specialist',
   '劳动合同试用期最长不得超过：',
   '[{"key":"A","text":"1 个月"},{"key":"B","text":"3 个月"},{"key":"C","text":"6 个月"},{"key":"D","text":"12 个月"}]',
   'C'),
  ('qs-hr-admin-specialist-4', 'changlian_metal-hr-admin-specialist',
   '下列哪项不属于员工关系管理范畴？',
   '[{"key":"A","text":"劳动合同管理"},{"key":"B","text":"劳动争议处理"},{"key":"C","text":"员工离职面谈"},{"key":"D","text":"市场薪酬调研"}]',
   'D'),
  ('qs-hr-admin-specialist-5', 'changlian_metal-hr-admin-specialist',
   '招聘漏斗中转化率最低的环节通常是：',
   '[{"key":"A","text":"简历筛选"},{"key":"B","text":"初筛电话"},{"key":"C","text":"终面"},{"key":"D","text":"Offer 谈判"}]',
   'C')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 2. 昶联金属 · 采购专员
-- =========================================================================
INSERT INTO questions_skill (id, position_id, question, options, answer) VALUES
  ('qs-procurement-specialist-1', 'changlian_metal-procurement-specialist',
   '采购订单（PO）的核心要素不包括：',
   '[{"key":"A","text":"供应商与物料编码"},{"key":"B","text":"数量与单价"},{"key":"C","text":"交货期"},{"key":"D","text":"员工考勤"}]',
   'D'),
  ('qs-procurement-specialist-2', 'changlian_metal-procurement-specialist',
   '关于"准时制（JIT）"采购，正确的是：',
   '[{"key":"A","text":"提前大量备货以防断供"},{"key":"B","text":"按需小批量、缩短交付周期、降低库存"},{"key":"C","text":"只采购最便宜的材料"},{"key":"D","text":"只与一家供应商合作"}]',
   'B'),
  ('qs-procurement-specialist-3', 'changlian_metal-procurement-specialist',
   '供应商评估的常见维度不包括：',
   '[{"key":"A","text":"质量"},{"key":"B","text":"交期"},{"key":"C","text":"价格"},{"key":"D","text":"供应商员工的姓名"}]',
   'D'),
  ('qs-procurement-specialist-4', 'changlian_metal-procurement-specialist',
   '到货后发现数量短缺，正确的处理是：',
   '[{"key":"A","text":"直接入库，下月对账"},{"key":"B","text":"填写收货异常单并通知采购与供应商"},{"key":"C","text":"拒收整批货物"},{"key":"D","text":"自行补足数量"}]',
   'B'),
  ('qs-procurement-specialist-5', 'changlian_metal-procurement-specialist',
   '采购合同中最常见的付款方式是：',
   '[{"key":"A","text":"货到付款"},{"key":"B","text":"月结 30/60 天"},{"key":"C","text":"货前全款"},{"key":"D","text":"货后 1 年"}]',
   'B')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 3. 中南机诚 · 机械助理工程师
-- =========================================================================
INSERT INTO questions_skill (id, position_id, question, options, answer) VALUES
  ('qs-mechanical-asst-engineer-1', 'zhongnan_jicheng-mechanical-asst-engineer',
   '机械图纸中最常用的投影法是：',
   '[{"key":"A","text":"第一角投影"},{"key":"B","text":"第三角投影"},{"key":"C","text":"斜二测"},{"key":"D","text":"透视投影"}]',
   'A'),
  ('qs-mechanical-asst-engineer-2', 'zhongnan_jicheng-mechanical-asst-engineer',
   '公差配合中 H7/h6 表示：',
   '[{"key":"A","text":"过盈配合"},{"key":"B","text":"过渡配合"},{"key":"C","text":"间隙配合"},{"key":"D","text":"过盈过渡"}]',
   'C'),
  ('qs-mechanical-asst-engineer-3', 'zhongnan_jicheng-mechanical-asst-engineer',
   'SolidWorks 出工程图时通常导出哪种格式？',
   '[{"key":"A","text":"PDF"},{"key":"B","text":"DWG/DXF"},{"key":"C","text":"JPG"},{"key":"D","text":"MP4"}]',
   'B'),
  ('qs-mechanical-asst-engineer-4', 'zhongnan_jicheng-mechanical-asst-engineer',
   '常见的不锈钢牌号 304 主要含哪种元素最高？',
   '[{"key":"A","text":"碳"},{"key":"B","text":"铬 + 镍"},{"key":"C","text":"锰"},{"key":"D","text":"钛"}]',
   'B'),
  ('qs-mechanical-asst-engineer-5', 'zhongnan_jicheng-mechanical-asst-engineer',
   'GD&T 中位置度公差前通常加哪个符号？',
   '[{"key":"A","text":"⊕"},{"key":"B","text":"⊥"},{"key":"C","text":"○"},{"key":"D","text":"⌖"}]',
   'A')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 4. 中南机诚 · PD助理工程师
-- =========================================================================
INSERT INTO questions_skill (id, position_id, question, options, answer) VALUES
  ('qs-pd-asst-engineer-1', 'zhongnan_jicheng-pd-asst-engineer',
   'PD（Product Development）助理的核心职责通常不包括：',
   '[{"key":"A","text":"BOM 维护"},{"key":"B","text":"项目进度跟踪"},{"key":"C","text":"车间设备维修"},{"key":"D","text":"样品试制跟进"}]',
   'C'),
  ('qs-pd-asst-engineer-2', 'zhongnan_jicheng-pd-asst-engineer',
   'APQP 阶段中"试生产"对应哪个阶段？',
   '[{"key":"A","text":"Phase 1 计划"},{"key":"B","text":"Phase 2 设计开发"},{"key":"C","text":"Phase 3 过程开发"},{"key":"D","text":"Phase 4 产品验证"}]',
   'D'),
  ('qs-pd-asst-engineer-3', 'zhongnan_jicheng-pd-asst-engineer',
   'BOM（Bill of Materials）通常分为：',
   '[{"key":"A","text":"EBOM / MBOM / SBOM"},{"key":"B","text":"只一种"},{"key":"C","text":"按颜色分"},{"key":"D","text":"按员工分"}]',
   'A'),
  ('qs-pd-asst-engineer-4', 'zhongnan_jicheng-pd-asst-engineer',
   'PPAP 通常需要提交给：',
   '[{"key":"A","text":"客户"},{"key":"B","text":"公司食堂"},{"key":"C","text":"保洁公司"},{"key":"D","text":"财务部"}]',
   'A'),
  ('qs-pd-asst-engineer-5', 'zhongnan_jicheng-pd-asst-engineer',
   '关于 ECN（工程变更通知），正确的是：',
   '[{"key":"A","text":"无需任何人批准即可生效"},{"key":"B","text":"必须经评审、批准、受控发放"},{"key":"C","text":"只口头通知即可"},{"key":"D","text":"只发给采购"}]',
   'B')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 5. 中南智诚 · 项目专员
-- =========================================================================
INSERT INTO questions_skill (id, position_id, question, options, answer) VALUES
  ('qs-project-specialist-1', 'zhongnan_zhicheng-project-specialist',
   'WBS（工作分解结构）的主要作用是：',
   '[{"key":"A","text":"拆任务到可管理颗粒度"},{"key":"B","text":"决定工资"},{"key":"C","text":"采购物料"},{"key":"D","text":"设计产品"}]',
   'A'),
  ('qs-project-specialist-2', 'zhongnan_zhicheng-project-specialist',
   '关键路径法（CPM）用于：',
   '[{"key":"A","text":"识别决定项目最短工期的任务链"},{"key":"B","text":"统计员工出勤"},{"key":"C","text":"采购物料"},{"key":"D","text":"画图"}]',
   'A'),
  ('qs-project-specialist-3', 'zhongnan_zhicheng-project-specialist',
   '甘特图主要展示：',
   '[{"key":"A","text":"任务时间安排与依赖"},{"key":"B","text":"公司组织结构"},{"key":"C","text":"财务报表"},{"key":"D","text":"销售漏斗"}]',
   'A'),
  ('qs-project-specialist-4', 'zhongnan_zhicheng-project-specialist',
   '项目变更控制的核心是：',
   '[{"key":"A","text":"不加控制"},{"key":"B","text":"评估影响 + 审批 + 记录"},{"key":"C","text":"只口头通知"},{"key":"D","text":"直接执行"}]',
   'B'),
  ('qs-project-specialist-5', 'zhongnan_zhicheng-project-specialist',
   '常见项目阶段划分包括：',
   '[{"key":"A","text":"启动 / 规划 / 执行 / 收尾"},{"key":"B","text":"只"开发"一阶段"},{"key":"C","text":"没有阶段"},{"key":"D","text":"只看心情"}]',
   'A')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 6. 中南智诚 · QE助理工程师
-- =========================================================================
INSERT INTO questions_skill (id, position_id, question, options, answer) VALUES
  ('qs-qe-asst-engineer-1', 'zhongnan_zhicheng-qe-asst-engineer',
   'FMEA 是哪种分析的缩写？',
   '[{"key":"A","text":"故障模式与影响分析"},{"key":"B","text":"市场分析"},{"key":"C","text":"财务分析"},{"key":"D","text":"人员分析"}]',
   'A'),
  ('qs-qe-asst-engineer-2', 'zhongnan_zhicheng-qe-asst-engineer',
   'SPC（统计过程控制）常用的图是：',
   '[{"key":"A","text":"控制图（Xbar-R）"},{"key":"B","text":"饼图"},{"key":"C","text":"甘特图"},{"key":"D","text":"组织架构图"}]',
   'A'),
  ('qs-qe-asst-engineer-3', 'zhongnan_zhicheng-qe-asst-engineer',
   '首件检验通常发生在：',
   '[{"key":"A","text":"批量生产前或换线后"},{"key":"B","text":"每天下班前"},{"key":"C","text":"只在年终"},{"key":"D","text":"只在客户来访"}]',
   'A'),
  ('qs-qe-asst-engineer-4', 'zhongnan_zhicheng-qe-asst-engineer',
   'Cpk ≥ 1.33 通常意味着：',
   '[{"key":"A","text":"过程能力良好"},{"key":"B","text":"过程能力不足"},{"key":"C","text":"与过程无关"},{"key":"D","text":"代表成本"}]',
   'A'),
  ('qs-qe-asst-engineer-5', 'zhongnan_zhicheng-qe-asst-engineer',
   'ISO 9001 是哪种体系的标准？',
   '[{"key":"A","text":"质量管理体系"},{"key":"B","text":"财务体系"},{"key":"C","text":"营销体系"},{"key":"D","text":"招聘体系"}]',
   'A')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 7. 英硕激光 · 软件助理工程师
-- =========================================================================
INSERT INTO questions_skill (id, position_id, question, options, answer) VALUES
  ('qs-software-asst-engineer-1', 'yingshuo_laser-software-asst-engineer',
   'C 语言中 `const int *p` 表示：',
   '[{"key":"A","text":"指针 p 可改，*p 不可改"},{"key":"B","text":"指针 p 不可改，*p 可改"},{"key":"C","text":"两者都不可改"},{"key":"D","text":"两者都可改"}]',
   'A'),
  ('qs-software-asst-engineer-2', 'yingshuo_laser-software-asst-engineer',
   '嵌入式开发中"看门狗"的作用是：',
   '[{"key":"A","text":"监控系统异常并复位"},{"key":"B","text":"加速 CPU"},{"key":"C","text":"显示图像"},{"key":"D","text":"播放音频"}]',
   'A'),
  ('qs-software-asst-engineer-3', 'yingshuo_laser-software-asst-engineer',
   '上位机软件常用开发语言是：',
   '[{"key":"A","text":"C# / Python"},{"key":"B","text":"PHP"},{"key":"C","text":"Ruby"},{"key":"D","text":"Perl"}]',
   'A'),
  ('qs-software-asst-engineer-4', 'yingshuo_laser-software-asst-engineer',
   'UART 是哪种通信接口？',
   '[{"key":"A","text":"串口异步"},{"key":"B","text":"并行同步"},{"key":"C","text":"无线"},{"key":"D","text":"光纤"}]',
   'A'),
  ('qs-software-asst-engineer-5', 'yingshuo_laser-software-asst-engineer',
   'Git 中合并 develop 到 main 的命令是：',
   '[{"key":"A","text":"git merge develop"},{"key":"B","text":"git rebase main"},{"key":"C","text":"git push origin develop"},{"key":"D","text":"git status"}]',
   'A')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 8. 英硕激光 · 光学助理工程师
-- =========================================================================
INSERT INTO questions_skill (id, position_id, question, options, answer) VALUES
  ('qs-optics-asst-engineer-1', 'yingshuo_laser-optics-asst-engineer',
   '激光（LASER）的全称是：',
   '[{"key":"A","text":"受激辐射光放大"},{"key":"B","text":"自然光"},{"key":"C","text":"白炽光"},{"key":"D","text":"荧光"}]',
   'A'),
  ('qs-optics-asst-engineer-2', 'yingshuo_laser-optics-asst-engineer',
   '波长 532nm 的激光通常呈现：',
   '[{"key":"A","text":"绿色"},{"key":"B","text":"红色"},{"key":"C","text":"蓝色"},{"key":"D","text":"不可见"}]',
   'A'),
  ('qs-optics-asst-engineer-3', 'yingshuo_laser-optics-asst-engineer',
   '常用激光器安全等级分类标准是：',
   '[{"key":"A","text":"IEC 60825"},{"key":"B","text":"ISO 9001"},{"key":"C","text":"IEC 61131"},{"key":"D","text":"GB 150"}]',
   'A'),
  ('qs-optics-asst-engineer-4', 'yingshuo_laser-optics-asst-engineer',
   '光学镜片镀膜的主要目的是：',
   '[{"key":"A","text":"减少反射、增加透过"},{"key":"B","text":"增加重量"},{"key":"C","text":"改变颜色"},{"key":"D","text":"防摔"}]',
   'A'),
  ('qs-optics-asst-engineer-5', 'yingshuo_laser-optics-asst-engineer',
   '激光加工中常用的辅助气体是：',
   '[{"key":"A","text":"氮气 / 氧气 / 空气"},{"key":"B","text":"氢气"},{"key":"C","text":"氯气"},{"key":"D","text":"天然气"}]',
   'A')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 9. 中南雅园 · 招商专员
-- =========================================================================
INSERT INTO questions_skill (id, position_id, question, options, answer) VALUES
  ('qs-investment-specialist-1', 'zhongnan_yayuan-investment-specialist',
   '招商洽谈中"客户分级"通常基于：',
   '[{"key":"A","text":"行业 / 规模 / 落地意愿"},{"key":"B","text":"只看公司大小"},{"key":"C","text":"只看姓名笔画"},{"key":"D","text":"随机"}]',
   'A'),
  ('qs-investment-specialist-2', 'zhongnan_yayuan-investment-specialist',
   '园区招商常见 KPI 包括：',
   '[{"key":"A","text":"入驻率 / 产值 / 税收贡献"},{"key":"B","text":"员工人数"},{"key":"C","text":"食堂满意度"},{"key":"D","text":"停车场容量"}]',
   'A'),
  ('qs-investment-specialist-3', 'zhongnan_yayuan-investment-specialist',
   '关于"产业政策"，正确的是：',
   '[{"key":"A","text":"了解当地补贴与税收优惠对招商至关重要"},{"key":"B","text":"与招商无关"},{"key":"C","text":"只看政策不看企业"},{"key":"D","text":"政策会自动变化"}]',
   'A'),
  ('qs-investment-specialist-4', 'zhongnan_yayuan-investment-specialist',
   '签订意向书的目的是：',
   '[{"key":"A","text":"锁定合作意向，再走正式合同"},{"key":"B","text":"取代正式合同"},{"key":"C","text":"仅作备忘"},{"key":"D","text":"给律师看"}]',
   'A'),
  ('qs-investment-specialist-5', 'zhongnan_yayuan-investment-specialist',
   '招商拜访开场 30 秒最重要的目标是：',
   '[{"key":"A","text":"让对方愿意继续听下去"},{"key":"B","text":"直接报价"},{"key":"C","text":"批评对手"},{"key":"D","text":"玩手机"}]',
   'A')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 10. 中南雅园 · 财务专员
-- =========================================================================
INSERT INTO questions_skill (id, position_id, question, options, answer) VALUES
  ('qs-finance-specialist-1', 'zhongnan_yayuan-finance-specialist',
   '下列哪一项不属于会计的基本职能？',
   '[{"key":"A","text":"会计核算"},{"key":"B","text":"会计监督"},{"key":"C","text":"参与经营决策"},{"key":"D","text":"会计预测"}]',
   'C'),
  ('qs-finance-specialist-2', 'zhongnan_yayuan-finance-specialist',
   '"资产 = 负债 + 所有者权益"主要体现在哪张报表中？',
   '[{"key":"A","text":"利润表"},{"key":"B","text":"资产负债表"},{"key":"C","text":"现金流量表"},{"key":"D","text":"所有者权益变动表"}]',
   'B'),
  ('qs-finance-specialist-3', 'zhongnan_yayuan-finance-specialist',
   '原始凭证按取得来源不同，可分为：',
   '[{"key":"A","text":"自制凭证和外来凭证"},{"key":"B","text":"单式凭证和复式凭证"},{"key":"C","text":"一次凭证和累计凭证"},{"key":"D","text":"收付凭证和转账凭证"}]',
   'A'),
  ('qs-finance-specialist-4', 'zhongnan_yayuan-finance-specialist',
   '会计核算的基本前提不包括：',
   '[{"key":"A","text":"会计主体"},{"key":"B","text":"持续经营"},{"key":"C","text":"会计分期"},{"key":"D","text":"重要性"}]',
   'D'),
  ('qs-finance-specialist-5', 'zhongnan_yayuan-finance-specialist',
   '现金日记账通常由谁登记？',
   '[{"key":"A","text":"出纳"},{"key":"B","text":"销售"},{"key":"C","text":"保洁"},{"key":"D","text":"客户"}]',
   'A')
ON CONFLICT (id) DO NOTHING;