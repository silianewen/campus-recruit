# 校招平台 · Campus Recruit

一个零成本、可一周交付的校招投递 MVP：扫码投递 → 简历入库 → HR 后台 → 面试通知（站内）→ 数据看板 → 性格测评 + 专业测试。

> 原始方案见 [PLAN.md](./PLAN.md)。安全设计取舍见 [docs/security.md](./docs/security.md)。当前规格变更和迭代计划见 [openspec/changes](./openspec/changes)。

## 技术栈

- **前端**：Vite + React 19 + TypeScript + Tailwind v4（暗黑主题）+ React Router
- **后端 / 数据库 / 文件存储**：Supabase（Postgres + Storage + REST），**所有 HR 可编辑数据（公司 / 岗位 / 题库）都以 Supabase 为唯一权威**
- **看板**：ECharts 5（按需懒加载，深色模式适配）
- **部署**：Vercel
- **月成本**：< 10 元（短信占大头，本 MVP 已切到站内通知 → ~0）

## 页面路由

| 路径 | 谁用 | 用途 |
|---|---|---|
| `/` | 所有人 | 首页：公司选择 → 岗位选择 + 测评入口 + HR 入口（footer 小字） |
| `/upload?company=&position=` | 学生 | 上传简历（姓名、手机、专业、学校、文件） |
| `/upload/:positionId` | 学生 | 旧 URL 兜底 |
| `/success/:submissionId` | 学生 | 投递成功确认页 + 跳转测评 |
| `/status` | 学生 | 输入手机号查投递 + 通知 + 测评 |
| `/personality` | 学生 | 20 题 MBTI 风格性格测评 |
| `/skill-test?company=&position=` | 学生 | 5 题岗位专业测试 |
| `/skill-test/:positionId` | 学生 | 旧 URL 兜底 |
| `/dashboard` | HR（密码门） | 简历列表 + 筛选 + 改状态 + 发通知 + MBTI/分数列 |
| `/stats` | HR（密码门） | ECharts：各岗位投递数 + 专业 Top 10 分布 |

## 功能特性

- **暗黑主题**：右上角 ☀️/🌙 按钮切换，偏好持久化在 `localStorage`（`theme` key）；首屏内嵌脚本防止切换闪烁
- **数据驱动**：公司 / 岗位 / 题库全部从 Supabase 实时拉取，HR 在 Supabase 网页改完无需重新部署
- **重复投递防护**：同手机号 + 同公司 + 同岗位 仅可投一次；同岗位不同公司可投
- **HR 通知 → 学生侧自动可见**：站内通知按手机号寻址
- **MBTI + 专业测试列**：HR 后台每行显示该学生最近一次性格 MBTI 和专业测试分数

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（不要提交 .env.local）
cp .env.local.example .env.local
# 编辑 .env.local，填入：
#   VITE_SUPABASE_URL=
#   VITE_SUPABASE_ANON_KEY=
#   VITE_HR_PASSWORD=        ← 你自己设一个，HR 登录用

# 3. 初始化数据库（Supabase 项目里依次执行）
#    supabase/migrations/0001_init.sql          -- 7 张表 + 索引 + 触发器
#    supabase/migrations/0002_storage.sql       -- resumes bucket + 公开读写策略
#    supabase/migrations/0003_seed_questions.sql
#    supabase/migrations/0004_companies.sql     -- 添加 company_id 列
#    supabase/migrations/0005_positions_per_company.sql
#    supabase/migrations/0005_questions.sql    -- 专业题库种子（按职位 fanned-out）

# 4. （一次性）让 PostgREST 看到刚加的 company_id 列
#    在 Supabase SQL Editor 跑：
#    NOTIFY pgrst, 'reload schema';

# 5. 启动 dev server
npm run dev
# → http://localhost:5173
```

## 安全初始化环境变量（推荐）

把 `.env.local` 改用本地交互式脚本，避免任何 key 出现在对话 / 文件里：

```powershell
cd "c:\study\campus_recruitment"
powershell -ExecutionPolicy Bypass -File scripts\set-env-secure.ps1
```

终端会交互问 3 个值（**值只在终端输入，不经过任何对话或文件**）。

## 脚本

```bash
npm run dev                  # 启动开发服务器
npm run build                # 生产构建（含 tsc 严格类型检查）
npm run preview              # 本地预览生产构建
npm run lint                 # oxlint

node scripts/seed-test-data.mjs   # 注入 50 条测试数据 + backfill company_id
```

## 部署到 Vercel

```bash
# 一次性：在 Vercel 网页端新建项目，关联 GitHub 仓库 silianewen/campus-recruit
# 然后把以下环境变量填到 Vercel Project → Settings → Environment Variables：
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_ANON_KEY
#   VITE_HR_PASSWORD
#
# 之后每次 git push main → Vercel 自动构建 + 部署
```

不推荐 CLI 部署（需要把 VERCEL_TOKEN 通过环境变量注入）。

## 数据模型（速查）

```
companies           7 家公司（hongguang_nano, changlian_metal, ...）
positions           39 个岗位（id 形如 `<companyId>-<title-slug>`）
resumes             简历元数据 + Storage URL
submissions         投递（关联 resume + position + 状态机）
notifications       HR → 学生的站内通知（按 phone 寻址）
personality_results MBTI 测试结果（scores + 4 字母类型）
skill_results       专业测试成绩（score / total / answers）
questions_skill     专业题库（按 position_id 分类；0005 已 fan-out 到 39 个岗位）
```

完整 schema 在 `supabase/migrations/`。HR 修改公司名/岗位名/题目：在 Supabase Table Editor 直接改，刷新页面就能看到（无需重新部署）。

## 已知 MVP 取舍

详见 [docs/security.md](./docs/security.md)：

- **RLS 关闭**：学生匿名提交，HR 是唯一可信用户，Phase 2 加 Supabase Auth 再开
- **Storage 公开**：MVP 演示用，上线前要切换到签名 URL
- **HR 密码 `VITE_HR_PASSWORD`**：在客户端 bundle 里可见（DevTools 即可看），适合 demo，**上线前必须换成 Supabase Auth**

## 路径说明

本项目所有命令和文件路径基于 `C:\study\campus_recruitment\`（最初方案中写的 `d:\study\recruitment\` 已纠正）。