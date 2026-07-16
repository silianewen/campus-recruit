# 校招平台 MVP 搭建方案（Claude 全程执行版）

## Context

你是校招负责人，**以个人身份**做这件事。公司零资源支持、你零编程基础、希望**完全由 AI 完成开发 + 部署**，目标 1 周左右交付可上线运行的 MVP + 进阶 + 性格/专业测评。工作目录 `d:\study\recruitment` 为空。

### 功能范围（已确认）
- ✅ MVP 5 项：扫码投递页、二维码、简历入库、投递确认页、招聘官后台
- ✅ 进阶 A3（精简 2 图）：投递数 + 专业分布
- ✅ 进阶 A4：面试通知 + 学生状态查询
- ✅ 亮点 2 项：性格测评、专业能力测试
- ❌ 不做：AI 简历解析、智能匹配、扫码热力/来源渠道、其它亮点

### 时间预期（完全由 Claude 做）
**1 周内完成全部开发 + 部署 + 自测**。比之前一个月方案快 4 倍，原因是 AI 不需要"学 Cursor / 调代码 / 重试"这些人工缓冲。

---

## 一、技术栈（精简版）

```
前端          →  Vercel 托管 + React + Tailwind（Claude 直接写）
后端          →  Supabase（数据库 + 文件存储 + API）
部署          →  Vercel CLI（Claude 用你的 GitHub 账号自动 push + 部署）
短信          →  腾讯云短信（按条计费，几乎免费）
数据看板      →  ECharts（2 张图）
测评          →  纯前端 HTML + JS（题库 + 计分逻辑，零 API 调用）
```

**月成本**：Vercel 0 + Supabase 免费额度内 0 + 短信几分钱 ≈ **接近 0**

---

## 二、需要你提供的凭证（最关键卡点）

| # | 需要的凭证 | 用途 | 怎么给 |
|---|---|---|---|
| 1 | **GitHub 账号 + Personal Access Token** | 代码托管 + Vercel 部署入口 | 在 github.com/settings/tokens 生成，粘贴给我 |
| 2 | **Vercel 账号 + Token** | 一键部署前端 | 在 vercel.com/account/tokens 生成 |
| 3 | **Supabase 项目 URL + anon key + service_role key** | 数据库 + 文件存储 | 注册 supabase.com 后在项目设置里复制 |
| 4 | **腾讯云短信**（可选，A4 用） | 面试通知 | 实名 + 创建签名 + 模板审核 1 天 |

**说明**：
- 1–3 是必须的，否则只能产出本地代码
- 4 可选，前期不用短信也能演示（A4 可改成"邮件通知"或"HR 后台手动发"）
- 也可以全部不提供 → 我只产出**完整可运行的代码包 + 启动脚本**，你自己一键跑

**三种协作模式**（请你选一个）：

### 模式 A：全托管上线（最省心）
你提供 1–3 的凭证 → Claude 在 Vercel + Supabase 上**直接部署上线**，给你一个可访问的 URL。
- 时间：1 周
- 产出：可直接打开使用的网站 + 演示视频

### 模式 B：本地一键启动（折中）
你不提供云凭证 → Claude 产出**完整代码 + 一键启动脚本**，你在自己电脑跑（`双击 start.bat` 即可）。
- 时间：1 周内完成代码交付
- 产出：本地可用的网站（电脑不开机时别人访问不到）

### 模式 C：纯代码包（最简单）
你只想拿代码 → Claude 产出**完整代码 + README + 部署指南**，你找时间再部署。
- 时间：3–5 天
- 产出：完整源代码 + 文档

---

## 三、实施计划（Claude 全程执行）

### Day 1：搭骨架
- Claude 创建项目目录、初始化 Git、推送到 GitHub
- Claude 注册/登录 Supabase（用你提供的 key），建 `resumes` 表 + Storage bucket
- Claude 写第一个 Cursor prompt 并生成代码骨架

### Day 2：MVP 上线
- 扫码上传页（前端 + 后端）
- 简历入库逻辑
- 招聘官后台（表格 + 筛选 + 下载 + 状态修改）
- 投递确认页
- 部署到 Vercel（模式 A）或本地启动（模式 B）

### Day 3：二维码 + 通知 + 状态查询
- 草料二维码生成（4 个岗位）
- 面试通知功能（短信 / 或邮件 / 或 HR 后台手动）
- 学生状态查询页

### Day 4：数据看板
- ECharts 看板页（投递数柱状图 + 专业分布饼图）
- 接 Supabase 实时数据
- 部署上线

### Day 5：性格测评
- 20 道 MBTI 风格测试题（Cursor 生成）
- 计分逻辑 + 结果展示
- HR 后台查看测评结果

### Day 6：专业能力测试
- `questions` 表设计（按岗位分类）
- 测试页（前端拉题 + 答题 + 提交）
- HR 后台查看成绩

### Day 7：联调 + 压测 + 演示
- 全流程联调
- 模拟 50 份简历压测
- 录 2 分钟演示视频
- 输出汇报 PPT 素材（截图 + 数据）

---

## 四、关键文件清单（Claude 会创建）

- `d:\study\recruitment\README.md` — 项目说明 + 启动文档
- `d:\study\recruitment\package.json` — 项目依赖
- `d:\study\recruitment\vite.config.ts` — 构建配置
- `d:\study\recruitment\vercel.json` — 部署配置
- `d:\study\recruitment\src\pages\upload.tsx` — 学生扫码上传页
- `d:\study\recruitment\src\pages\success.tsx` — 投递成功确认页
- `d:\study\recruitment\src\pages\dashboard.tsx` — HR 招聘官后台
- `d:\study\recruitment\src\pages\stats.tsx` — 数据看板（2 图）
- `d:\study\recruitment\src\pages\status.tsx` — 学生状态查询页
- `d:\study\recruitment\src\pages\personality.tsx` — 性格测评页
- `d:\study\recruitment\src\pages\skill-test.tsx` — 专业能力测试页
- `d:\study\recruitment\supabase\migrations\0001_init.sql` — 数据库结构
- `d:\study\recruitment\supabase\migrations\0002_storage.sql` — Storage 配置
- `d:\study\recruitment\supabase\migrations\0003_seed_questions.sql` — 性格/专业测试题库种子数据
- `d:\study\recruitment\api\sms_notify.ts` — 短信发送函数（可选）
- `d:\study\recruitment\start.bat` / `start.sh` — 一键启动脚本（模式 B 用）

---

## 五、汇报亮点（精简后 3 个）

1. **零成本全流程数字化**：月成本 < 10 元，覆盖投递→入库→通知→查询→测评
2. **专业能力测试取代简历筛选**：从"看简历"变成"做测试"，HR 效率翻倍
3. **数据看板 + 性格测评**：2 张关键图表 + 20 题测评，汇报有数据有亮点

---

## 六、立即可做的 2 件事

### 1. 选协作模式（请在下一条消息告诉我：模式 A / B / C）
### 2. 如果选 A：开始注册以下 3 个账号
- **GitHub**（github.com）→ 创建一个空仓库 `campus-recruit`
- **Vercel**（vercel.com）→ 用 GitHub 登录，生成 Token（Account Settings → Tokens → Create）
- **Supabase**（supabase.com）→ 创建项目，复制 `URL` + `anon key` + `service_role key`

把这 3 个凭证给我（或者你想先讨论别的也可以）。

---

## 验证（Verification）

Claude 会在 Day 7 完成以下验证：

1. 手机扫码 → 上传简历 → 看到成功页 → HR 后台能查看 + 下载
2. HR 点"通知面试" → 学生收到通知（短信/邮件/站内）
3. 学生输入手机号 → 看到当前状态
4. 投递 5 份不同专业/岗位的简历 → 看板 2 张图实时更新
5. 完成性格测评 → 看到结果 + HR 后台能查
6. 选择岗位 → 完成专业测试 → HR 后台能查成绩

最终交付物：可访问的 URL + 演示视频（2 分钟）+ 汇报 PPT 截图素材
