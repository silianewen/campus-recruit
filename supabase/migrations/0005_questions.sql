-- 0005_questions.sql — seed professional test question bank.
-- Run AFTER 0005_positions_per_company.sql.
-- One shared 5-question set per unique title slug; jobs with the same title
-- across companies (e.g. 会计专员 at 4 companies) reuse the same questions.
-- User can edit/add questions freely in Supabase Table Editor afterwards.

-- =========================================================================
-- Helper: each block below uses CROSS JOIN to fan out one question set
-- across all positions whose ID ends with that title slug.
-- Pattern: WHERE p.id LIKE '%-<slug>'
-- =========================================================================

-- 1) 会计专员
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-accounting-specialist-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, '下列哪一项不属于会计的基本职能？', '[{"key":"A","text":"会计核算"},{"key":"B","text":"会计监督"},{"key":"C","text":"参与经营决策"},{"key":"D","text":"会计预测"}]', 'C'),
  (2, '资产负债表反映的是：', '[{"key":"A","text":"某一时期的经营成果"},{"key":"B","text":"某一日期的财务状况"},{"key":"C","text":"某一时期的现金流量"},{"key":"D","text":"某一日期的利润"}]', 'B'),
  (3, '原始凭证按取得来源不同，可分为：', '[{"key":"A","text":"自制凭证和外来凭证"},{"key":"B","text":"单式凭证和复式凭证"},{"key":"C","text":"一次凭证和累计凭证"},{"key":"D","text":"收付凭证和转账凭证"}]', 'A'),
  (4, '会计核算的基本前提不包括：', '[{"key":"A","text":"会计主体"},{"key":"B","text":"持续经营"},{"key":"C","text":"会计分期"},{"key":"D","text":"重要性"}]', 'D'),
  (5, '"资产 = 负债 + 所有者权益"主要体现在哪张报表中？', '[{"key":"A","text":"利润表"},{"key":"B","text":"资产负债表"},{"key":"C","text":"现金流量表"},{"key":"D","text":"所有者权益变动表"}]', 'B')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-accounting-specialist';

-- 2) 人力资源专员
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-hr-specialist-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, '"人岗匹配"主要关注：', '[{"key":"A","text":"学历匹配"},{"key":"B","text":"能力、素质与岗位要求匹配"},{"key":"C","text":"薪酬匹配"},{"key":"D","text":"户籍匹配"}]', 'B'),
  (2, 'KPI 设计遵循 SMART 原则，其中 S 指：', '[{"key":"A","text":"Specific（具体的）"},{"key":"B","text":"Smart"},{"key":"C","text":"Sustainable"},{"key":"D","text":"Strategic"}]', 'A'),
  (3, '培训需求分析的方法不包括：', '[{"key":"A","text":"任务分析"},{"key":"B","text":"绩效分析"},{"key":"C","text":"人员分析"},{"key":"D","text":"财务分析"}]', 'D'),
  (4, '劳动合同试用期最长不得超过：', '[{"key":"A","text":"1 个月"},{"key":"B","text":"3 个月"},{"key":"C","text":"6 个月"},{"key":"D","text":"12 个月"}]', 'C'),
  (5, '下列哪项不属于员工关系管理范畴？', '[{"key":"A","text":"劳动合同管理"},{"key":"B","text":"劳动争议处理"},{"key":"C","text":"员工离职面谈"},{"key":"D","text":"市场薪酬调研"}]', 'D')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-hr-specialist';

-- 3) 电气助理工程师
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-electrical-asst-engineer-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, '三相交流电相电压 220V 时，线电压为：', '[{"key":"A","text":"220V"},{"key":"B","text":"311V"},{"key":"C","text":"380V"},{"key":"D","text":"110V"}]', 'C'),
  (2, '接地电阻通常要求：', '[{"key":"A","text":"不大于 4Ω"},{"key":"B","text":"不大于 10Ω"},{"key":"C","text":"不大于 50Ω"},{"key":"D","text":"越大越好"}]', 'B'),
  (3, 'PLC 英文全称是：', '[{"key":"A","text":"Programmable Logic Controller"},{"key":"B","text":"Power Line Cable"},{"key":"C","text":"Programmable Loop Circuit"},{"key":"D","text":"Pulse Light Control"}]', 'A'),
  (4, '低压电器额定电压一般不超过：', '[{"key":"A","text":"220V"},{"key":"B","text":"380V"},{"key":"C","text":"1000V"},{"key":"D","text":"5000V"}]', 'C'),
  (5, '下列哪种电机调速方式效率最高？', '[{"key":"A","text":"变频调速"},{"key":"B","text":"改变定子电压"},{"key":"C","text":"改变转子电阻"},{"key":"D","text":"机械变速箱"}]', 'A')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-electrical-asst-engineer';

-- 4) 机械设计助理工程师
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-mechanical-design-asst-engineer-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, '机械零件最常用的公差配合制是：', '[{"key":"A","text":"基轴制"},{"key":"B","text":"基孔制"},{"key":"C","text":"混合制"},{"key":"D","text":"任意制"}]', 'B'),
  (2, '下列哪种加工方法精度最高？', '[{"key":"A","text":"车削"},{"key":"B","text":"铣削"},{"key":"C","text":"磨削"},{"key":"D","text":"钳工"}]', 'C'),
  (3, '公差代号 IT 表示：', '[{"key":"A","text":"基本偏差"},{"key":"B","text":"标准公差"},{"key":"C","text":"配合公差"},{"key":"D","text":"形位公差"}]', 'B'),
  (4, '工程材料中，密度最小的是：', '[{"key":"A","text":"钢"},{"key":"B","text":"铝"},{"key":"C","text":"镁"},{"key":"D","text":"钛"}]', 'C'),
  (5, 'Creo/Pro-E 主要用于：', '[{"key":"A","text":"电路设计"},{"key":"B","text":"3D 机械建模"},{"key":"C","text":"财务核算"},{"key":"D","text":"流程仿真"}]', 'B')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-mechanical-design-asst-engineer';

-- 5) PD 助理工程师
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-pd-asst-engineer-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, 'PD 通常指：', '[{"key":"A","text":"Product Development（产品开发）"},{"key":"B","text":"Process Design"},{"key":"C","text":"Project Delivery"},{"key":"D","text":"Product Design"}]', 'A'),
  (2, '产品开发流程中，EVT 阶段主要做：', '[{"key":"A","text":"工程验证测试"},{"key":"B","text":"小批量验证"},{"key":"C","text":"量产验证"},{"key":"D","text":"市场验证"}]', 'A'),
  (3, 'BOM 表的中文是：', '[{"key":"A","text":"物料清单"},{"key":"B","text":"工艺清单"},{"key":"C","text":"设备清单"},{"key":"D","text":"质量清单"}]', 'A'),
  (4, '产品开发中的 ECN 指：', '[{"key":"A","text":"工程变更通知"},{"key":"B","text":"设备校准通知"},{"key":"C","text":"质量异常通知"},{"key":"D","text":"培训通知"}]', 'A'),
  (5, '产品生命周期通常分为：', '[{"key":"A","text":"2 阶段"},{"key":"B","text":"4 阶段"},{"key":"C","text":"5 阶段"},{"key":"D","text":"6 阶段"}]', 'B')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-pd-asst-engineer';

-- 6) IE 助理工程师
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-ie-asst-engineer-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, 'IE 的核心目标是：', '[{"key":"A","text":"提高效率、消除浪费"},{"key":"B","text":"增加库存"},{"key":"C","text":"扩大厂房"},{"key":"D","text":"增加人员"}]', 'A'),
  (2, '"标准工时"通常包含：', '[{"key":"A","text":"正常时间 + 放宽时间"},{"key":"B","text":"只算加工时间"},{"key":"C","text":"只算休息时间"},{"key":"D","text":"只算检验时间"}]', 'A'),
  (3, '产线平衡率越高代表：', '[{"key":"A","text":"浪费越多"},{"key":"B","text":"产线效率越高"},{"key":"C","text":"人员越多"},{"key":"D","text":"库存越多"}]', 'B'),
  (4, '5S 中的"整顿"对应：', '[{"key":"A","text":"Seiri"},{"key":"B","text":"Seiton"},{"key":"C","text":"Seiso"},{"key":"D","text":"Seiketsu"}]', 'B'),
  (5, 'IE 改善的"七大浪费"中不包括：', '[{"key":"A","text":"等待的浪费"},{"key":"B","text":"动作的浪费"},{"key":"C","text":"库存的浪费"},{"key":"D","text":"加班的浪费"}]', 'D')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-ie-asst-engineer';

-- 7) QE 助理工程师
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-qe-asst-engineer-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, 'ISO 9001 是哪种体系？', '[{"key":"A","text":"环境管理体系"},{"key":"B","text":"质量管理体系"},{"key":"C","text":"安全管理体系"},{"key":"D","text":"信息安全管理体系"}]', 'B'),
  (2, 'FMEA 中文是：', '[{"key":"A","text":"失效模式与影响分析"},{"key":"B","text":"流程改进方法"},{"key":"C","text":"质量检查表"},{"key":"D","text":"供应商审核"}]', 'A'),
  (3, 'SPC 的含义是：', '[{"key":"A","text":"统计过程控制"},{"key":"B","text":"设备保养"},{"key":"C","text":"标准作业"},{"key":"D","text":"变更管理"}]', 'A'),
  (4, 'PPM 在质量中表示：', '[{"key":"A","text":"百万分之一不良率"},{"key":"B","text":"每分钟件数"},{"key":"C","text":"压力单位"},{"key":"D","text":"采购付款条件"}]', 'A'),
  (5, '下列哪类问题属于"严重缺陷"？', '[{"key":"A","text":"外观色差轻微"},{"key":"B","text":"关键尺寸超差"},{"key":"C","text":"说明书错字"},{"key":"D","text":"包装略变形"}]', 'B')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-qe-asst-engineer';

-- 8) 项目专员
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-project-specialist-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, '项目管理"铁三角"指：', '[{"key":"A","text":"范围/时间/成本"},{"key":"B","text":"质量/进度/人员"},{"key":"C","text":"采购/财务/HR"},{"key":"D","text":"设计/制造/测试"}]', 'A'),
  (2, '甘特图主要用于：', '[{"key":"A","text":"时间进度安排"},{"key":"B","text":"财务核算"},{"key":"C","text":"质量分析"},{"key":"D","text":"人事招聘"}]', 'A'),
  (3, '项目里程碑指：', '[{"key":"A","text":"关键节点"},{"key":"B","text":"付款节点"},{"key":"C","text":"人员变动"},{"key":"D","text":"风险事件"}]', 'A'),
  (4, 'WBS 的中文是：', '[{"key":"A","text":"工作分解结构"},{"key":"B","text":"物料清单"},{"key":"C","text":"质量检查表"},{"key":"D","text":"变更日志"}]', 'A'),
  (5, '项目变更的最佳处理方式是：', '[{"key":"A","text":"口头通知"},{"key":"B","text":"走变更流程并留记录"},{"key":"C","text":"直接执行"},{"key":"D","text":"隐瞒不报"}]', 'B')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-project-specialist';

-- 9) 运维助理工程师
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-ops-asst-engineer-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, '设备 TPM 指：', '[{"key":"A","text":"全员生产维护"},{"key":"B","text":"质量检验"},{"key":"C","text":"库存管理"},{"key":"D","text":"工艺改进"}]', 'A'),
  (2, '"点检"主要目的是：', '[{"key":"A","text":"日常检查并记录设备状态"},{"key":"B","text":"更换零件"},{"key":"C","text":"外送维修"},{"key":"D","text":"报废"}]', 'A'),
  (3, '设备故障率最高阶段通常在：', '[{"key":"A","text":"初期磨合期"},{"key":"B","text":"稳定运行期"},{"key":"C","text":"损耗故障期"},{"key":"D","text":"闲置期"}]', 'C'),
  (4, '下列哪种润滑方式最常见？', '[{"key":"A","text":"集中润滑"},{"key":"B","text":"手工加油"},{"key":"C","text":"飞溅润滑"},{"key":"D","text":"油雾润滑"}]', 'B'),
  (5, 'OEE 是衡量：', '[{"key":"A","text":"设备综合效率"},{"key":"B","text":"员工绩效"},{"key":"C","text":"库存周转"},{"key":"D","text":"质量缺陷率"}]', 'A')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-ops-asst-engineer';

-- 10) 采购专员
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-procurement-specialist-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, '"询价"对应英文：', '[{"key":"A","text":"RFQ"},{"key":"B","text":"PO"},{"key":"C","text":"SOP"},{"key":"D","text":"BOM"}]', 'A'),
  (2, '"采购订单"英文缩写：', '[{"key":"A","text":"PO"},{"key":"B","text":"SO"},{"key":"C","text":"INV"},{"key":"D","text":"GR"}]', 'A'),
  (3, '供应商评审主要关注：', '[{"key":"A","text":"质量/交付/价格/服务"},{"key":"B","text":"只看价格"},{"key":"C","text":"只看规模"},{"key":"D","text":"只看距离"}]', 'A'),
  (4, 'VMI 指：', '[{"key":"A","text":"供应商管理库存"},{"key":"B","text":"物流管理"},{"key":"C","text":"采购审批"},{"key":"D","text":"价格评估"}]', 'A'),
  (5, 'JIT 采购的核心是：', '[{"key":"A","text":"准时制、减少库存"},{"key":"B","text":"大批量采购"},{"key":"C","text":"只看价格"},{"key":"D","text":"只看品牌"}]', 'A')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-procurement-specialist';

-- 11) 测量技术员
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-measurement-technician-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, '游标卡尺读数精度常见为：', '[{"key":"A","text":"0.01 mm / 0.02 mm"},{"key":"B","text":"1 mm"},{"key":"C","text":"0.1 mm"},{"key":"D","text":"0.001 mm"}]', 'B'),
  (2, '三坐标测量仪主要测量：', '[{"key":"A","text":"温度"},{"key":"B","text":"几何尺寸与形位"},{"key":"C","text":"颜色"},{"key":"D","text":"重量"}]', 'B'),
  (3, '首件检验通常在：', '[{"key":"A","text":"批量生产开始时"},{"key":"B","text":"生产结束后"},{"key":"C","text":"每周末"},{"key":"D","text":"设备故障时"}]', 'A'),
  (4, '千分尺（螺旋测微器）精度为：', '[{"key":"A","text":"0.1 mm"},{"key":"B","text":"0.01 mm"},{"key":"C","text":"0.001 mm"},{"key":"D","text":"0.05 mm"}]', 'B'),
  (5, '"基准"在测量中的含义：', '[{"key":"A","text":"参考标准"},{"key":"B","text":"随机点"},{"key":"C","text":"任意面"},{"key":"D","text":"颜色标记"}]', 'A')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-measurement-technician';

-- 12) CNC 技术员
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-cnc-technician-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, 'CNC 加工中心常用的代码：', '[{"key":"A","text":"G 代码"},{"key":"B","text":"C++"},{"key":"C","text":"Java"},{"key":"D","text":"Python"}]', 'A'),
  (2, 'G00 指令通常表示：', '[{"key":"A","text":"快速定位"},{"key":"B","text":"直线插补"},{"key":"C","text":"圆弧插补"},{"key":"D","text":"暂停"}]', 'A'),
  (3, '刀具补偿主要作用：', '[{"key":"A","text":"补偿刀具磨损/几何误差"},{"key":"B","text":"改变颜色"},{"key":"C","text":"降低温度"},{"key":"D","text":"加快网络"}]', 'A'),
  (4, 'CNC 操作中应优先注意：', '[{"key":"A","text":"安全防护"},{"key":"B","text":"装饰"},{"key":"C","text":"广告投放"},{"key":"D","text":"音乐播放"}]', 'A'),
  (5, '铝件加工建议使用：', '[{"key":"A","text":"专用铝用刀具与切削液"},{"key":"B","text":"通用钢件刀具"},{"key":"C","text":"任何刀具均可"},{"key":"D","text":"木加工刀具"}]', 'A')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-cnc-technician';

-- 13) CNC 工程师
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-cnc-engineer-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, 'CNC 编程中，子程序调用指令是：', '[{"key":"A","text":"M98"},{"key":"B","text":"M99"},{"key":"C","text":"M30"},{"key":"D","text":"G99"}]', 'A'),
  (2, '加工中心换刀指令：', '[{"key":"A","text":"M06"},{"key":"B","text":"M03"},{"key":"C","text":"M08"},{"key":"D","text":"G91"}]', 'A'),
  (3, '工艺优化中，常用工时计算方法：', '[{"key":"A","text":"标准工时 = 切削时间 + 辅助时间"},{"key":"B","text":"只看切削时间"},{"key":"C","text":"随机估算"},{"key":"D","text":"凭经验"}]', 'A'),
  (4, '刀具寿命与切削速度的关系：', '[{"key":"A","text":"速度↑寿命↓（经验曲线）"},{"key":"B","text":"速度↑寿命↑"},{"key":"C","text":"无关"},{"key":"D","text":"永远不变"}]', 'A'),
  (5, '后处理（Post Processor）作用：', '[{"key":"A","text":"把刀路转为机床能识别的 NC 代码"},{"key":"B","text":"画图"},{"key":"C","text":"打印图纸"},{"key":"D","text":"发送邮件"}]', 'A')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-cnc-engineer';

-- 14) 软件助理工程师
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-software-asst-engineer-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, 'C 语言中 `int a[10];` 的数组元素下标范围：', '[{"key":"A","text":"0~9"},{"key":"B","text":"1~10"},{"key":"C","text":"0~10"},{"key":"D","text":"1~9"}]', 'A'),
  (2, 'HTTP 默认端口：', '[{"key":"A","text":"80"},{"key":"B","text":"443"},{"key":"C","text":"22"},{"key":"D","text":"21"}]', 'A'),
  (3, '下列哪个是面向对象三大特性之一？', '[{"key":"A","text":"封装"},{"key":"B","text":"编译"},{"key":"C","text":"链接"},{"key":"D","text":"下载"}]', 'A'),
  (4, 'Git 中撤销最近一次本地提交但保留改动：', '[{"key":"A","text":"git reset --soft HEAD~1"},{"key":"B","text":"git revert HEAD"},{"key":"C","text":"git rm -rf"},{"key":"D","text":"git push -f"}]', 'A'),
  (5, 'Python 中列表与元组的区别：', '[{"key":"A","text":"列表可变、元组不可变"},{"key":"B","text":"元组可变"},{"key":"C","text":"完全一样"},{"key":"D","text":"列表只能存数字"}]', 'A')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-software-asst-engineer';

-- 15) 光学助理工程师
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-optics-asst-engineer-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, '可见光波长范围约：', '[{"key":"A","text":"380~780 nm"},{"key":"B","text":"10~100 nm"},{"key":"C","text":"1~10 mm"},{"key":"D","text":">1 m"}]', 'A'),
  (2, '激光的英文缩写：', '[{"key":"A","text":"LASER"},{"key":"B","text":"LIGHT"},{"key":"C","text":"LDR"},{"key":"D","text":"LCD"}]', 'A'),
  (3, '下列哪种透镜是凹透镜？', '[{"key":"A","text":"中心比边缘薄"},{"key":"B","text":"中心比边缘厚"},{"key":"C","text":"完全平面"},{"key":"D","text":"无所谓"}]', 'A'),
  (4, '光纤通信主要利用光的：', '[{"key":"A","text":"全反射"},{"key":"B","text":"直射"},{"key":"C","text":"散射"},{"key":"D","text":"漫反射"}]', 'A'),
  (5, '光学仪器"分辨率"主要受：', '[{"key":"A","text":"波长与数值孔径"},{"key":"B","text":"只与价格有关"},{"key":"C","text":"只看颜色"},{"key":"D","text":"不看参数"}]', 'A')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-optics-asst-engineer';

-- 16) 电子助理工程师
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-electronics-asst-engineer-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, '欧姆定律 U = ?', '[{"key":"A","text":"IR"},{"key":"B","text":"IR²"},{"key":"C","text":"I/R"},{"key":"D","text":"I+R"}]', 'A'),
  (2, '二极管主要作用：', '[{"key":"A","text":"单向导电"},{"key":"B","text":"存储电荷"},{"key":"C","text":"放大信号"},{"key":"D","text":"产生磁场"}]', 'A'),
  (3, '示波器主要测量：', '[{"key":"A","text":"电信号波形"},{"key":"B","text":"温度"},{"key":"C","text":"湿度"},{"key":"D","text":"颜色"}]', 'A'),
  (4, '"上拉电阻"作用：', '[{"key":"A","text":"确保引脚默认高电平"},{"key":"B","text":"降低电压"},{"key":"C","text":"增加电流"},{"key":"D","text":"改变颜色"}]', 'A'),
  (5, 'PCB 中 GND 表示：', '[{"key":"A","text":"地"},{"key":"B","text":"电源"},{"key":"C","text":"信号"},{"key":"D","text":"输入"}]', 'A')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-electronics-asst-engineer';

-- 17) 综合专员
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-general-specialist-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, '"综合岗位"通常指：', '[{"key":"A","text":"多职能合一的事务性工作"},{"key":"B","text":"只负责财务"},{"key":"C","text":"只负责销售"},{"key":"D","text":"只负责研发"}]', 'A'),
  (2, '会议纪要应在会后多久发出？', '[{"key":"A","text":"24 小时内"},{"key":"B","text":"一周内"},{"key":"C","text":"一个月内"},{"key":"D","text":"下个季度"}]', 'A'),
  (3, '公文写作常用的"请示"用于：', '[{"key":"A","text":"请求上级指示或批准"},{"key":"B","text":"对外宣传"},{"key":"C","text":"通知会议"},{"key":"D","text":"通报批评"}]', 'A'),
  (4, '"督办"指：', '[{"key":"A","text":"督促落实重要事项"},{"key":"B","text":"只看不办"},{"key":"C","text":"只汇报不跟踪"},{"key":"D","text":"财务报销"}]', 'A'),
  (5, '不属于办公室常用文档：', '[{"key":"A","text":"产品图纸"},{"key":"B","text":"会议纪要"},{"key":"C","text":"通知公告"},{"key":"D","text":"工作总结"}]', 'A')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-general-specialist';

-- 18) 招商专员
INSERT INTO questions_skill (id, position_id, question, options, answer)
SELECT 'qs-investment-specialist-' || g.n, p.id, g.question, g.options::jsonb, g.answer
FROM positions p
CROSS JOIN (VALUES
  (1, '招商引资第一步通常是：', '[{"key":"A","text":"客户需求识别与意向沟通"},{"key":"B","text":"直接签约"},{"key":"C","text":"开庆功会"},{"key":"D","text":"收押金"}]', 'A'),
  (2, 'KYC 在招商中指：', '[{"key":"A","text":"了解你的客户"},{"key":"B","text":"只看公司简介"},{"key":"C","text":"只看股权结构"},{"key":"D","text":"只看新闻"}]', 'A'),
  (3, '意向协议与正式合同的区别：', '[{"key":"A","text":"意向协议无强制约束、正式合同有法律约束力"},{"key":"B","text":"完全一样"},{"key":"C","text":"意向协议先付款"},{"key":"D","text":"正式合同不要签字"}]', 'A'),
  (4, '常见招商对象关注：', '[{"key":"A","text":"政策/区位/成本/配套"},{"key":"B","text":"只看价格"},{"key":"C","text":"只看品牌"},{"key":"D","text":"只看名字"}]', 'A'),
  (5, '跟进潜在客户最忌讳：', '[{"key":"A","text":"信息断档、不持续沟通"},{"key":"B","text":"每周联系"},{"key":"C","text":"及时回复"},{"key":"D","text":"主动约见"}]', 'A')
) AS g(n, question, options, answer)
WHERE p.id LIKE '%-investment-specialist';

-- Verify: SELECT COUNT(*) FROM questions_skill; should be ~90 (5 per position shared by same-title across companies, 18 unique titles).