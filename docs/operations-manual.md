# 中南创发校招投递平台 — 操作说明书

> 最后更新：2026-07-19 · 适用版本：commit `72e6986`
>
> 本文档从三个角色视角说明系统的使用与维护：**学生**（投递者） · **IT 运维**（部署 / 数据库 / 安全） · **HR**（管理后台）。
>
> 系统访问 URL：https://campusrecruitment.vercel.app

---

## 目录

1. [学生视角](#1-学生视角)
2. [IT 运维视角](#2-it-运维视角)
3. [HR 视角](#3-hr-视角)
4. [附录：常用 SQL](#4-附录常用-sql)

---

## 1. 学生视角

### 1.1 总览

学生**无需注册账号**——所有功能匿名使用，**手机号 + 上传文件**即完成投递。投递后通过 **手机号查询** 跟踪进度和 HR 通知。

### 1.2 访问入口

- **官网**（电脑上）：https://campusrecruitment.vercel.app
- **二维码**（手机扫码）：HR 后台首页有当前部署 URL 的二维码可下载并打印贴到海报上

### 1.3 完整流程

```
[1. 浏览首页] → [2. 选公司] → [3. 投递简历] → [4. 性格测评] → [5. 专业测试]
     ↓
[8. 投递状态查询] ← [7. HR 通知] ← [6. 等 HR 处理]
```

#### 步骤 1：浏览首页

打开首页 https://campusrecruitment.vercel.app

**页面元素**：
- 顶部："中"logo（左上）· **中南创发校招投递平台** + 副标题（居中）· 主题切换（右上）
- **中南创发集团简介** section（占位"集团简介待补充"，等 IT 替换）
- **5 家公司卡片**（每张可点击）：
  - 昶联金属材料应用制品（广州）有限公司 · 2 个岗位
  - 中南机诚精密制品（深圳）有限公司 · 2 个岗位
  - 中南智诚科技（东莞）有限公司 · 2 个岗位
  - 英硕激光科技（珠海）有限公司 · 2 个岗位
  - 中南雅园产业管理（深圳）有限公司 · 2 个岗位
  - 每张卡片显示：名称 / 简介 / "X 个岗位"
- 底部 3 个入口：性格测评 / 专业能力测试 / 我的投递状态
- 角落 🛠 中南创发校招HR管理后台（仅对知道密码的 HR 可见）

#### 步骤 2：选公司 → 选岗位

点击某家公司卡片 → 跳到 `/companies/<company-id>` 公司详情页：

- 顶部："← 返回投递首页" + 公司简称（昶联 / 中南机诚 / 中南智诚 / 英硕激光 / 中南雅园）+ 主题切换
- 大 logo + 公司全名 + 公司简介
- **岗位网格**：每张卡片显示该公司的某岗位（类别 + 标题）

点击岗位卡片 → 进入 `/upload?company=X&position=Y` 投递表单。

#### 步骤 3：投递简历（/upload）

表单字段：

| 字段 | 必填 | 说明 |
|---|---|---|
| 姓名 | ✓ | 中文姓名 |
| 手机号 | ✓ | 11 位手机号，作为后续查询账号 |
| 专业 | ✓ | 例：计算机科学与技术 |
| 学校 | ✓ | 例：清华大学 |
| **学历** | ✓ | 大专 / 本科 / 硕士 / 博士 / 其他 |
| 简历文件 | ✓ | PDF 或 Word，≤10MB |

提交后跳到 `/success/<submission-id>`，提示"已收到你的简历"。

> ⚠️ **不能重复投递同公司同岗位**：同手机号 + 同公司 + 同岗位会被拒。不同公司同岗位可以投递。

#### 步骤 4：性格测评（/personality，49 题 MBTI 风格）

入口：首页底部 **🧠 性格测评** 卡 · 投递成功页**蓝色框**内链接 · 状态查询页内

流程：
1. 输入手机号 → 开始
2. 49 道二选一题目（约 8 分钟）
3. 系统自动算分、保存到 `personality_results` 表
4. 看到 **4 字母 MBTI 类型** + 性格描述 + 维度分数（E/I, S/N, T/F, J/P 各 /5）

HR 后台会在 HRList 看到该学生的 MBTI。

#### 步骤 5：专业能力测试（/skill-test，按公司）

入口：首页底部 **💼 专业能力测试** 卡 · 投递成功页**蓝色框**内链接

新版的流程（最近更新）：
1. 进 `/skill-test` → 顶部有 **"按公司筛选"** 下拉（默认"全部公司"）
2. 看到 5 家公司的岗位分组列表，每家下面挂 2 个岗位
3. 点击某岗位 → 跳到 `/skill-test?company=X&position=Y` → 进入答题
4. 输入手机号 → 开始
5. 该岗位 5 道题（每题 4 选项）
6. 提交即打分（X/5）+ 保存到 `skill_results` 表

#### 步骤 6-7：等 HR 处理 / 收到通知

HR 在 `/hr/list` 改状态、发面试通知后：
- 通知按手机号塞到 `notifications` 表
- 学生可通过 `/status` 查询

#### 步骤 8：投递状态查询（/status）

入口：首页底部 **📬 我的投递状态**

流程：
1. 输入手机号 → 查询
2. 显示 4 个区块：
   - **📨 HR 通知**（未读的标"🔔"）
   - **📄 我的投递**（每条含公司 / 岗位 / 学校（学历）/ 专业 / 状态）
   - **🧠 性格测评**（MBTI 类型 + 时间）
   - **💼 专业能力测试**（分数 X/5 + 时间）

### 1.4 暗色主题

- 任意页面右上 ☀/🌙 按钮切换
- 偏好存 `localStorage.theme`（key = `'theme'`）
- 首屏加载前通过内嵌脚本读取设置 → **无闪烁**
- 仅本机生效，不会同步到其他设备

### 1.5 学生常见问题

| 问题 | 解决 |
|---|---|
| 忘记是否投递过 | `/status` 输入手机号查 |
| 重复投递被拒 | 同公司同岗位已投递；需换公司或换岗位 |
| 性格测评重做 | `/personality` 重新答题即可；HR 看到的是最新一次 |
| 专业测试重做 | `/skill-test` 重选岗位重做 |
| 提交后没收到 HR 通知 | 让 HR 改状态后发面试通知（`/hr/list` 点"通知"按钮） |

---

## 2. IT 运维视角

### 2.1 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vite 8 + React 19 + TypeScript + Tailwind v4 + React Router 7 |
| 图表 | ECharts 5（懒加载） |
| 后端 | Supabase（Postgres + Storage + RLS-off-MVP） |
| 二维码 | `qrcode` npm 包 |
| 部署 | Vercel（自动从 `main` 部署） |
| 版本控制 | GitHub `silianewen/campus-recruit` |
| 估算月成本 | < 10 元（接近 0） |

### 2.2 项目结构速查

```
c:/study/campus_recruitment/
├── src/
│   ├── App.tsx              ← 8 路由（/、/companies/:id、/upload、/hr、/hr/list、/hr/dashboard、/personality、/skill-test、/status、/success/:id）
│   ├── pages/               ← 9 页面
│   ├── components/          ← Page / AsyncView / ConfigBanner / EChart / QrDownload / ThemeToggle
│   ├── hooks/               ← useAsync / useTheme
│   ├── lib/                 ← supabase / loaders / types / errors / companies / positions + 2 题库
│   └── index.css            ← @custom-variant dark（Tailwind v4 class 策略）
├── supabase/migrations/      ← 6 个 SQL（0001 init → 0007 5 家公司 + 0008 题库）
├── docs/                    ← 本文件 + security / ppt-screenshots / demo-script
├── openspec/                ← 已归档的 change + 主 specs
├── scripts/                 ← PowerShell 设环境 + seed 测试数据脚本
├── .claude/                 ← Claude Code 配置（用户级）
├── vite.config.ts
├── tailwind.config / index.css
└── package.json
```

### 2.3 本地开发

```bash
# 1. 安装
cd c:/study/campus_recruitment
npm install

# 2. 环境变量（自己填，不入 git）
cp .env.local.example .env.local
# 编辑 .env.local：
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...
#   VITE_HR_PASSWORD=（HR 后台登录密码）

# 可选：用交互脚本设置（值不进对话历史）
powershell -ExecutionPolicy Bypass -File scripts/set-env-secure.ps1

# 3. 启动
npm run dev          # http://localhost:5173
npm run build        # tsc + 生产构建
```

### 2.4 数据库（Supabase）

**7 张表**：
- `companies` — 公司主表（id、name、description、logo_url）
- `positions` — 岗位（id `{companyId}-{slug}`、title、description、**category**）
- `resumes` — 学生简历 + 文件元数据（**新增 degree / 学历**）
- `submissions` — 投递记录 + 状态机
- `notifications` — 站内通知（按 phone 寻址）
- `personality_results` — MBTI 测试结果
- `skill_results` — 专业测试成绩

**1 个 Storage 桶**：
- `resumes`（公开读 + 公开写）

#### 已跑的 migrations（按顺序）

1. `0001_init.sql` — 7 张核心表 + 索引
2. `0002_storage.sql` — `resumes` bucket + 公开策略
3. `0003_seed_questions.sql` — 老 4 岗位 20 题
4. `0004_companies.sql` — 给 resumes / submissions 加 `company_id` 列
5. `0005_positions_per_company.sql` — 清空 + 重新种 39 个老岗位
6. `0005_questions.sql` — 18 套老题
7. **`0006_seed_companies.sql`** — 7 家公司种入
8. **`0007_chuangfa_5_companies.sql`** — pivot 到"中南创发"：清空 + 加 `positions.category` + `resumes.degree` + 5 家公司 + 10 个岗位
9. **`0008_chuangfa_skill_questions.sql`** — 50 道专业题

**⚠️ 重新跑任何 `0005_*` 都会 `TRUNCATE` 全部数据。** 7/8/9 是 idempotent，安全重跑。

#### 跑完 migrations 必做的一步

每次改了 schema（`ALTER TABLE`），PostgREST 缓存不会自动更新，**必须**运行：

```sql
NOTIFY pgrst, 'reload schema';
```

或在 Supabase Dashboard → **Settings → API** → **"Reload schema"** 按钮。

### 2.5 部署（Vercel）

#### 一次性：关联 GitHub

1. https://vercel.com/dashboard
2. **Add New Project** → Import `silianewen/campus-recruitment`
3. 框架：Vite（自动检测）· **Root Directory** 留空
4. **Environment Variables**（⚠️ 在第一次 deploy 之前填好，否则 build 会失败）：
   ```
   VITE_SUPABASE_URL        = https://<ref>.supabase.co
   VITE_SUPABASE_ANON_KEY   = eyJhbGc...
   VITE_HR_PASSWORD        = <自己想一个>
   ```
5. Deploy — 之后 `git push` 到 `main` 即自动部署

#### 后续：常规改动

```bash
# 1. 本地 build 验证
npm run build

# 2. commit + push
git add -A
git commit -m "<msg>"     # Claude 自动 commit
git push                  # Vercel 自动构建 + 部署

# 3. 等 1-2 分钟，访问 URL 验证
```

### 2.6 密钥管理（重要）

| 密钥 | 存放位置 | 谁能看到 |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local`（本地）+ Vercel env（生产） | 仅开发者 |
| `VITE_SUPABASE_ANON_KEY` | 同上 | 公开也只暴露 anon 权限级别 |
| `VITE_HR_PASSWORD` | 同上 | 注意：会进前端 bundle，DevTools 可见 ⚠️ |
| `github_campus_recruitment` (GitHub PAT) | Windows env var | 不发对话 |
| `vercel_campus_recruitment` (Vercel Token) | Windows env var | 不发对话 |

**注意 VITE_HR_PASSWORD 是客户端可见的**——MVP 阶段不要紧，**上线前必须用 Supabase Auth** 替换。

### 2.7 维护操作

#### 添加一家新公司

```sql
INSERT INTO companies (id, name, description) VALUES
  ('new_company_id', '新公司全名', '简介');
```

然后在该公司的页面 → 新建岗位：
```sql
INSERT INTO positions (id, title, description, category) VALUES
  ('new_company_id-position-slug', '岗位中文名', '描述', '类别');
```

#### 修改公司名 / 简介

```sql
UPDATE companies SET name = '新名字', description = '新简介' WHERE id = 'xxx';
```

**改完前端立即生效**（不用 rebuild）——刷新浏览器即可。

#### 添加专业题

```sql
INSERT INTO questions_skill (id, position_id, question, options, answer) VALUES
  ('new-key-1', 'changlian_metal-procurement-specialist', '新题目', '[{"key":"A","text":"选项1"},...]', 'A');
```

#### 修改 HR 密码

Vercel Dashboard → Project → Settings → Environment Variables → 修改 `VITE_HR_PASSWORD` → 重新 deploy。

或者修改 `.env.local`（本地）+ 跑 `scripts/set-env-secure.ps1`（交互式，本地用）。

### 2.8 常见故障

| 现象 | 原因 | 修法 |
|---|---|---|
| 首页"加载失败：[object Object]" | PostgREST 没看到 `companies` 表 | `NOTIFY pgrst, 'reload schema'` |
| 上传报错 `column submissions_1.company_id does not exist` | 同上 | 同上 |
| Vercel 部署后页面空白 | env 变量没填 / URL 是 dashboard 不是 API | 填 VITE_SUPABASE_URL = `https://<ref>.supabase.co`，不要 dashboard URL |
| HR 后台登录提示"密码错" | `VITE_HR_PASSWORD` 没设 | 设上，重启 dev / 重 deploy |
| 学生投递同公司同岗位失败 | 预期内的去重 | 换公司 / 换岗位即可 |
| 性格测评不显示结果 | `useAsync` 的 `personality_results` 插入权限 | 检查 RLS（我们 intentionally 关了 RLS） |
| 题库加载空 | `questions_skill` 没种该 position_id | 跑 `0008_chuangfa_skill_questions.sql` |

### 2.9 监控 + 备份

- **上线前必做**：Supabase Pro 才支持每日自动 backup；当前 Free tier 请**手动 export**
  ```
  Settings → Database → Backups → "Schedule a time"
  ```
  建议每周一次 pg_dump

### 2.10 升级路径（生产化 checklist）

```
☐ 加 Supabase Auth（替换 VITE_HR_PASSWORD 客户端密码）
☐ 启用 RLS + 写策略
☐ Storage 桶切换为 signed URL
☐ 部署到自定义域名 + HTTPS（Vercel 已默认）
☐ 加 rate limiting（HR 登录防爆破）
☐ 加 audit log（关键操作记录）
☐ 加监控（Sentry / Vercel Analytics）
```

---

## 3. HR 视角

### 3.1 访问 HR 后台

- **URL**：https://campusrecruitment.vercel.app/hr
- **密码**：`VITE_HR_PASSWORD`（IT 设的，问 IT 要；当前本地环境 = `siliane0609`）
- **推荐入口**：首页底部"🛠 中南创发校招HR管理后台"链接

### 3.2 HR 后台布局

```
[HR 后台登录页]
  - 顶部 左："中"logo + "← 返回投递首页" + 主题切换
  - 中央 标题"中南创发校招HR管理后台"
  - 中央 密码框 + "进入"按钮

  ↓ 密码正确

[HR 后台 /hr 落地页]
  - 顶部 左：logo
  - 顶部 右："← 返回投递首页" + 主题切换 + "退出登录"
  - 中央 标题"中南创发校招HR管理后台"（居中）
  - 子标题"简历投递 · 通知 · 数据看板"
  - 卡片 1：📲 学生投递页面二维码（可下载 PNG 打印贴海报）
  - 卡片 2：📋 投递简历列表（按钮）→ 跳 /hr/list
  - 卡片 3：📊 数据看板（按钮）→ 跳 /hr/dashboard

  ↓ 点按钮

[/hr/list 简历列表] 或 [/hr/dashboard 数据看板]
  - 顶部 智能返回（左）+ 标题 + 主题切换（右）

[点"退出登录"]
  - 清 sessionStorage，跳回 /hr 登录页
```

### 3.3 投递简历列表（/hr/list）

#### 页面元素

**筛选栏**（一行 5 控件）：
- 🏢 应聘公司（全部 / 5 家）
- 💼 职位（全部 / 10 个岗位）
- 🏷 状态（全部 / 已投递 / 已查看 / 已约面 / 已面试 / 已 offer / 已拒绝）
- 🔍 搜索框（姓名 / 手机 / 专业）
- 🔄 刷新按钮

显示"共 X 条"。

**11 列表格**：

| 列 | 内容 | 来源 |
|---|---|---|
| 1. 姓名 | 学生名 | resumes.student_name |
| 2. 手机 | 11 位手机号 | resumes.phone |
| 3. 应聘公司 | 公司全名 | company 关联 |
| 4. 职位 | 岗位标题 | position 关联 |
| 5. 学校 | "学校全名 (学历)" 括号里显示学历 | resumes.university + degree |
| 6. 专业 | 专业名 | resumes.major |
| 7. 性格（MBTI） | 4 字母如 INTJ（无则 "—"） | personality_results join |
| 8. 专业测试结果 | "X/5"（无则 "—"） | skill_results join |
| 9. 状态 | 下拉切换（inline） | submissions.status |
| 10. 投递时间 | "2026-7-19 22:30" | submissions.created_at |
| 11. 操作 | "简历" 链接（→ Storage URL） | resumes.file_url |

#### 常见操作

**改状态**：直接点状态列的下拉：
```
[已投递 ▾] → 已查看 → 已约面 → 已面试 → 已 offer → 已拒绝
```

**打开简历**：点"简历"链接 → 在新标签打开 Storage 公开 URL → 浏览器预览/下载 PDF

**按公司筛选**：筛选下拉选某家 → 表格立即过滤

**按手机号搜某学生**：搜索框输 11 位手机号 → 回车

**刷新**：点刷新按钮重新从 DB 拉（之前的 inline 修改状态不会丢失）

### 3.4 数据看板（/hr/dashboard）

#### 5 张图

**顶部 4 个数字卡**：
- **总投递数**（当前筛选下）
- **已约面**（status = interview_scheduled 计数）
- **已 offer**（status = offered 计数）
- **公司**数

**5 张 ECharts 图**：
1. **各公司各岗位投递分布**（堆叠柱状图）— 一眼看出每家公司哪个岗位最热
2. **各职位投递数**（柱状图）— 找出最热门岗位
3. **按公司**（饼图）— 投递来源分布
4. **按学历**（饼图）— **关键**：本科 / 硕士 / 博士 / 大专 比例
5. **专业 Top 10**（饼图）— 投递者来自哪些专业

#### 暗色模式适配

图表的所有颜色（轴线、标签、扇区、柱条）会自动跟随暗色主题，无需手动切换。

### 3.5 给学生发面试通知（通过改状态 + 通知）

> 通知是**手动**流程——HR 在简历列表里改某行的状态 + 系统中转（站内通知会塞到 `notifications` 表），学生在 `/status` 用手机号查询时看到。

**完整流程**：
1. 进 `/hr/list`
2. 找到目标学生那行，看状态、MBTI、专业测试分
3. 如果决定约面：
   a. 状态列下拉 → 改"已约面"
   b. （可选）打开 `/hr/list` 行里的 "通知" 按钮——当前设计：直接在 `/hr/list` 改状态即可，通知可后续追加
   c. 学生下次访问 `/status` 输入手机号 → 看到"📨 HR 通知"区有新条目

**注意**：当前 MVP 的"通知"功能已实装（schema 有 `notifications` 表，前端 `/status` 显示），但 `/hr/list` 还没把"发通知"和"改状态"绑定到一个按钮上——HR 先手动改状态，学生侧会通过状态标签感知进度。要发具体文字通知需要 IT 加 UI。

### 3.6 维护公司 / 岗位 / 题库

HR 没有任何前端维护界面——所有数据改动通过 **Supabase Dashboard**：

#### 增加 / 修改 / 删除公司

1. 打开 https://supabase.com/dashboard → 你的项目
2. **Table Editor** → `companies` 表
3. 编辑 / 插入 / 删除行
4. **重要**：跑 `NOTIFY pgrst, 'reload schema';` 让前端拿到
5. 学生刷新浏览器即看到

#### 增加 / 修改 / 删除岗位

`positions` 表。`id` 必须是 `{companyId}-{slug}` 格式（决定它在哪个公司的页面下出现）。

#### 修改题目

`questions_skill` 表。改完同样 `NOTIFY pgrst`。

### 3.7 HR 常见问题

| 问题 | 解决 |
|---|---|
| 看不到某学生 | 他没投递 / 用了别的手机号；让他用 `/status` 确认手机号，再让你搜 |
| MBTI / 专业测试列空 | 学生还没做那两项测试；让他去 `/personality` 和 `/skill-test` 跑一次 |
| 改完状态不刷新 | 点表格上方的"刷新"按钮 |
| 状态选项想加新值 | IT 改：`ALTER TYPE` / 改 `SUBMISSION_STATUS_LABEL` + 改数据库 CHECK constraint |
| 误删了一条数据 | Supabase → Table Editor → 行级 history 可能恢复；最坏情况 IT 从备份恢复 |
| 想批量导出 | Supabase → SQL Editor：`SELECT * FROM submissions;` → 下载 CSV |

---

## 4. 附录：常用 SQL

```sql
-- ── 总体数据量 ──
SELECT 'companies' AS t, COUNT(*) FROM companies
UNION ALL SELECT 'positions', COUNT(*) FROM positions
UNION ALL SELECT 'resumes', COUNT(*) FROM resumes
UNION ALL SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'personality_results', COUNT(*) FROM personality_results
UNION ALL SELECT 'skill_results', COUNT(*) FROM skill_results
UNION ALL SELECT 'questions_skill', COUNT(*) FROM questions_skill;

-- ── 最新 50 条投递 ──
SELECT s.created_at, r.student_name, r.phone, c.name, p.title, s.status
FROM submissions s
JOIN resumes   r ON r.id = s.resume_id
JOIN companies c ON c.id = s.company_id
JOIN positions  p ON p.id = s.position_id
ORDER BY s.created_at DESC
LIMIT 50;

-- ── 各状态计数 ──
SELECT status, COUNT(*) FROM submissions GROUP BY status;

-- ── 各公司投递数 ──
SELECT c.name, COUNT(s.id) AS submissions
FROM submissions s
JOIN companies c ON c.id = s.company_id
GROUP BY c.id, c.name
ORDER BY submissions DESC;

-- ── 学历分布 ──
SELECT degree, COUNT(*) FROM resumes WHERE degree IS NOT NULL GROUP BY degree;

-- ── 专业 Top 10 ──
SELECT major, COUNT(*) AS n FROM resumes GROUP BY major ORDER BY n DESC LIMIT 10;

-- ── MBTI 分布 ──
SELECT mbti_type, COUNT(*) FROM personality_results GROUP BY mbti_type ORDER BY 2 DESC;

-- ── 专业测试平均分 ──
SELECT position_id, ROUND(AVG(score::numeric / total * 100), 1) AS avg_pct, COUNT(*)
FROM skill_results
GROUP BY position_id
ORDER BY avg_pct DESC;

-- ── 给某手机号批量加通知 ──
INSERT INTO notifications (phone, title, content, type)
VALUES ('13800138000', '面试通知', '你投递的岗位已进入面试环节，请回复确认时间。', 'interview_invite');

-- ── 刷新 schema 缓存 ──
NOTIFY pgrst, 'reload schema';
```

---

## 索引：哪里找什么

| 想找什么 | 文件 / 位置 |
|---|---|
| 学生端首页 | https://campusrecruitment.vercel.app |
| HR 后台 | https://campusrecruitment.vercel.app/hr |
| 数据库 | https://supabase.com/dashboard |
| 代码仓库 | https://github.com/silianewen/campus-recruit |
| 部署 | https://vercel.com/dashboard |
| 本地密码 | `.env.local`（gitignored） |
| 设计取舍 / 安全说明 | `docs/security.md` |
| 演示脚本（原 PLAN） | `PLAN.md` |
| OpenSpec 主 specs | `openspec/specs/{data-loaders,theme-dark-mode}/spec.md` |
