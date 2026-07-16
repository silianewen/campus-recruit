-- 0003_seed_questions.sql — seed positions and skill test question bank
-- Run AFTER 0002_storage.sql.
-- Mirrors src/lib/questions-skill.ts — keep in sync if you edit questions there.

-- =========================================================================
-- Positions
-- =========================================================================
INSERT INTO positions (id, title, description) VALUES
  ('frontend', '前端工程师',  'React / Vue / 移动端 H5'),
  ('backend',  '后端工程师',  'Java / Go / 数据库与中间件'),
  ('data',     '数据分析师',  'SQL / Python / 业务分析'),
  ('product',  '产品经理',    '需求调研 / 推动落地 / 数据驱动')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- Skill questions (5 per position × 4 positions = 20)
-- =========================================================================
INSERT INTO questions_skill (id, position_id, question, options, answer) VALUES
  ('fe-1', 'frontend',
   '下面哪个 CSS 属性会脱离文档流？',
   '[{"key":"A","text":"position: static"},{"key":"B","text":"position: relative"},{"key":"C","text":"position: absolute"},{"key":"D","text":"display: inline-block"}]',
   'C'),

  ('fe-2', 'frontend',
   'React 中，以下哪个 Hook 用于副作用？',
   '[{"key":"A","text":"useState"},{"key":"B","text":"useEffect"},{"key":"C","text":"useMemo"},{"key":"D","text":"useRef"}]',
   'B'),

  ('fe-3', 'frontend',
   '关于 HTTP 状态码 401 和 403 的区别，正确的是？',
   '[{"key":"A","text":"两者等价，都表示未授权"},{"key":"B","text":"401 未认证，403 已认证但无权限"},{"key":"C","text":"401 客户端错误，403 服务端错误"},{"key":"D","text":"401 临时错误，403 永久错误"}]',
   'B'),

  ('fe-4', 'frontend',
   '以下哪个不是 JavaScript 的基本类型？',
   '[{"key":"A","text":"string"},{"key":"B","text":"number"},{"key":"C","text":"array"},{"key":"D","text":"boolean"}]',
   'C'),

  ('fe-5', 'frontend',
   '关于浏览器跨域，下列说法错误的是？',
   '[{"key":"A","text":"CORS 是一种标准跨域方案"},{"key":"B","text":"JSONP 只能发起 GET 请求"},{"key":"C","text":"跨域是浏览器安全策略，与服务端无关"},{"key":"D","text":"所有跨域请求都会被浏览器拦截"}]',
   'D'),

  ('be-1', 'backend',
   '关于数据库索引，下列说法错误的是？',
   '[{"key":"A","text":"B+ 树索引适合范围查询"},{"key":"B","text":"哈希索引适合等值查询"},{"key":"C","text":"索引越多越好"},{"key":"D","text":"主键自动建立唯一索引"}]',
   'C'),

  ('be-2', 'backend',
   'TCP 三次握手中，第二次握手发送的是？',
   '[{"key":"A","text":"SYN"},{"key":"B","text":"SYN + ACK"},{"key":"C","text":"ACK"},{"key":"D","text":"FIN"}]',
   'B'),

  ('be-3', 'backend',
   '下列哪种情况会导致事务回滚？',
   '[{"key":"A","text":"执行 COMMIT"},{"key":"B","text":"执行 ROLLBACK"},{"key":"C","text":"连接断开"},{"key":"D","text":"B 和 C 都会"}]',
   'D'),

  ('be-4', 'backend',
   'RESTful API 中，创建一个新资源应该用？',
   '[{"key":"A","text":"GET /users"},{"key":"B","text":"POST /users"},{"key":"C","text":"PUT /users"},{"key":"D","text":"DELETE /users"}]',
   'B'),

  ('be-5', 'backend',
   '关于进程与线程，下列说法正确的是？',
   '[{"key":"A","text":"线程是资源分配的最小单位"},{"key":"B","text":"进程是 CPU 调度的最小单位"},{"key":"C","text":"同一进程的线程共享内存"},{"key":"D","text":"线程之间完全独立"}]',
   'C'),

  ('da-1', 'data',
   'SQL 中，去重使用哪个关键字？',
   '[{"key":"A","text":"UNIQUE"},{"key":"B","text":"DISTINCT"},{"key":"C","text":"GROUP"},{"key":"D","text":"DEDUPE"}]',
   'B'),

  ('da-2', 'data',
   '关于假设检验，P 值越小说明？',
   '[{"key":"A","text":"原假设越可信"},{"key":"B","text":"拒绝原假设的证据越强"},{"key":"C","text":"样本量越大"},{"key":"D","text":"数据越准确"}]',
   'B'),

  ('da-3', 'data',
   '在 pandas 中，处理缺失值最常用的方法是？',
   '[{"key":"A","text":"df.remove_na()"},{"key":"B","text":"df.fillna() / df.dropna()"},{"key":"C","text":"df.clean()"},{"key":"D","text":"df.delete_null()"}]',
   'B'),

  ('da-4', 'data',
   '下面哪个不是监督学习算法？',
   '[{"key":"A","text":"线性回归"},{"key":"B","text":"决策树"},{"key":"C","text":"K-means"},{"key":"D","text":"SVM"}]',
   'C'),

  ('da-5', 'data',
   'A/B 测试中，实验组和对照组应保持？',
   '[{"key":"A","text":"样本量差异很大"},{"key":"B","text":"唯一变量不同，其余一致"},{"key":"C","text":"用户特征完全相同"},{"key":"D","text":"时间窗口错开"}]',
   'B'),

  ('pr-1', 'product',
   'MVP 的含义是？',
   '[{"key":"A","text":"Most Valuable Player"},{"key":"B","text":"Minimum Viable Product"},{"key":"C","text":"Maximum Value Plan"},{"key":"D","text":"Market Validation Phase"}]',
   'B'),

  ('pr-2', 'product',
   'PRD 文档的核心目的是？',
   '[{"key":"A","text":"记录开发进度"},{"key":"B","text":"清晰定义产品需求与边界"},{"key":"C","text":"做市场调研"},{"key":"D","text":"代替 UI 设计稿"}]',
   'B'),

  ('pr-3', 'product',
   '用户画像（Persona）不包括以下哪个维度？',
   '[{"key":"A","text":"人口特征"},{"key":"B","text":"行为习惯"},{"key":"C","text":"心理诉求"},{"key":"D","text":"公司层级"}]',
   'D'),

  ('pr-4', 'product',
   '在产品迭代中，"北极星指标"的作用是？',
   '[{"key":"A","text":"考核单个功能的表现"},{"key":"B","text":"对齐团队长期目标"},{"key":"C","text":"替代 OKR"},{"key":"D","text":"衡量利润率"}]',
   'B'),

  ('pr-5', 'product',
   '关于需求优先级排序，RICE 框架中 R 指？',
   '[{"key":"A","text":"Risk"},{"key":"B","text":"Reach"},{"key":"C","text":"Revenue"},{"key":"D","text":"Retention"}]',
   'B')
ON CONFLICT (id) DO NOTHING;