# 校招平台 · Campus Recruit

一个零成本、可一周交付的校招投递 MVP：扫码投递 → 简历入库 → HR 后台 → 面试通知（站内）→ 数据看板 → 性格测评 + 专业测试。

> 原始方案见 [PLAN.md](./PLAN.md)。安全设计取舍见 [docs/security.md](./docs/security.md)。

## 技术栈

- **前端**：Vite + React 19 + TypeScript + Tailwind v4 + React Router
- **后端 / 数据库 / 文件存储**：Supabase（Postgres + Storage + REST）
- **看板**：ECharts 5（按需懒加载）
- **部署**：Vercel
- **月成本**：< 10 元（短信占大头，本 MVP 已切到站内通知 → ~0）

## 页面路由

| 路径 | 谁用 | 用途 |
|---|---|---|
| `/` | 所有人 | 首页：岗位卡片 + 测评入口 + HR 后台链接 |
| `/upload/:positionId` | 学生 | 上传简历（姓名、手机、专业、学校、文件） |
| `/success/:submissionId` | 学生 | 投递成功确认页 |
| `/status` | 学生 | 输入手机号查投递 + 通知 + 测评 |
| `/personality` | 学生 | 20 题 MBTI 风格性格测评 |
| `/skill-test/:positionId` | 学生 | 5 题岗位专业测试 |
| `/dashboard` | HR（密码门） | 简历列表 + 筛选 + 改状态 + 发通知 |
| `/stats` | HR（密码门） | ECharts：各岗位投递数 + 专业 Top 10 分布 |

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

# 3. 初始化数据库（Supabase 项目里执行）
#    supabase/migrations/0001_init.sql
#    supabase/migrations/0002_storage.sql
#    supabase/migrations/0003_seed_questions.sql
#    按顺序在 Supabase SQL Editor 跑

# 4. 启动 dev server
npm run dev
# → http://localhost:5173
```

## 脚本

```bash
npm run dev       # 启动开发服务器
npm run build     # 生产构建（含 tsc 严格类型检查）
npm run preview   # 本地预览生产构建
npm run lint      # oxlint
```

## 部署到 Vercel

```bash
# 一次性：在 Vercel 网页端新建项目，关联 GitHub 仓库
# 然后把以下环境变量填到 Vercel Project → Settings → Environment Variables：
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_ANON_KEY
#   VITE_HR_PASSWORD
#
# 之后每次 git push main → Vercel 自动构建 + 部署
```

CLI 方式（可选）：
```bash
npm i -g vercel
vercel login
vercel link
vercel env add VITE_SUPABASE_URL        # 交互输入值
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_HR_PASSWORD
vercel --prod
```

## 数据模型（速查）

```
positions          4 个岗位（frontend / backend / data / product）
resumes            简历文件元数据
submissions        投递（关联 resume + position + 状态机）
notifications      HR → 学生的站内通知（按 phone 寻址）
personality_results MBTI 测试结果（scores + 4 字母类型）
skill_results      专业测试成绩（score / total / answers）
questions_skill    专业题库（按 position 分类，4 岗位 × 5 题）
```

完整 schema 在 `supabase/migrations/0001_init.sql`。ER 图暂略。

## 已知 MVP 取舍

详见 [docs/security.md](./docs/security.md)：

- **RLS 关闭**：学生匿名提交，HR 是唯一可信用户，Phase 2 加 Supabase Auth 再开
- **Storage 公开**：MVP 演示用，上线前要切换到签名 URL
- **HR 密码门**：用 `VITE_HR_PASSWORD` 环境变量，不要硬编码

## 路径说明

本项目所有命令和文件路径基于 `C:\study\campus_recruitment\`（最初方案中写的 `d:\study\recruitment\` 已纠正）。