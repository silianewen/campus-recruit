# 部署到 CloudBase 完整手册（不需要编程）

如果"国内能打开校招平台"对你重要，这本手册会帮你从 0 部署到上线。所有步骤你或你认识的任何人都能完成，不需要编程经验。

## 📋 你需要准备的

1. **你的身份证**（实名认证用，10 分钟搞定）
2. **腾讯云账号**（手机号注册，免费）
3. **30 分钟连续时间**（中间要等几次）

不需要：信用卡、付费、备案、营业执照、公司配合。

---

## 一、注册 + 实名认证（5 分钟）

### 1. 注册腾讯云
1. 打开 https://cloud.tencent.com/register
2. 用手机号 + 验证码注册
3. 选"个人"账号

### 2. 实名认证（个人）
1. 登录后，访问 https://console.cloud.tencent.com/developer/auth
2. 选"个人认证"
3. 填姓名 + 身份证号
4. 用微信扫一扫完成活体认证
5. 等 5-10 秒，认证通过

---

## 二、开通 CloudBase（云开发）服务（2 分钟）

1. 访问 https://console.cloud.tencent.com/tcb
2. 如果弹"立即开通"，点它
3. 同意服务协议
4. 进入 CloudBase 控制台

---

## 三、创建环境 `campus-recruit-prod`（3 分钟）

1. 在 CloudBase 控制台，点 **"创建新环境"** 或 **"+ 新建环境"**
2. 填写：
   - **环境名称**：`campus-recruit-prod`（必须一字不差）
   - **地域**：选 **上海（ap-shanghai）**
   - **套餐**：默认（基础版 / 个人版）
3. 点 **"确定/创建"**
4. 等 30 秒，环境创建完成
5. **复制"环境 ID"**（一串字符，类似 `campus-recruit-prod-12345abcde`）—— 后面要用
6. **保存好这个 ID！**

> 💡 **如果看不到"创建新环境"按钮**：访问 https://console.cloud.tencent.com/tcb/env/create 这个 URL 直接到创建页。

---

## 四、授权（首次创建会弹，自动点同意）

CloudBase 会请求多个服务（EKS、TKE、CBS 等）的访问权限。**全部同意**，这是必要的。

---

## 五、开通静态网站托管（1 分钟）

1. 进入 `campus-recruit-prod` 环境
2. 左侧菜单 → 找到 **"静态网站托管"** 或 **"Hosting"**
3. 点 **"开通"**
4. 开通后会显示**默认域名**（如 `campus-recruit-prod-12345abcde-12539678.tcloudbaseapp.com`）
5. **复制这个默认域名**

---

## 六、创建云存储 bucket `resumes`（1 分钟）

1. 左侧菜单 → 找到 **"云存储"** 或 **"Storage"**
2. 点 **"开通"**（如果没开）
3. 创建 bucket：
   - 名称：**`resumes`**（必须一字不差）
   - 权限：**私有读写** ← 重要，不要选"公有读"
4. 点创建

---

## 七、部署代码（需要电脑 + 命令行）

> ⚠️ **如果你完全不熟命令行**：找任何会用电脑的人（朋友、同事）帮你 30 分钟。只需要他们执行命令。

### 7.1 安装 Node.js（如果电脑没有）

打开 https://nodejs.org/zh-cn → 下载 LTS 版本 → 一路"下一步"安装。

### 7.2 下载代码

打开 PowerShell 或 cmd：

```bash
cd C:\
git clone https://github.com/silianewen/campus-recruit.git
cd campus-recruit
npm install
```

### 7.3 安装 CloudBase CLI

```bash
npm install -g @cloudbase/cli
```

### 7.4 登录

```bash
tcb login
```

会弹浏览器，授权你刚才注册的腾讯云账号。

### 7.5 设置环境 ID

```powershell
# Windows PowerShell:
$env:CLOUDBASE_ENV_ID="campus-recruit-prod-你的ID"

# Windows cmd:
set CLOUDBASE_ENV_ID=campus-recruit-prod-你的ID
```

把"你的 ID"替换成第三步复制的那串。

### 7.6 部署云函数（API 后端）

```bash
npm run deploy:fn
```

等 30-60 秒，看到 `deploy successfully` 即可。

### 7.7 部署前端（学生看到的网页）

```bash
npm run deploy:client
```

等 30-60 秒。完成后会再次显示你的默认域名（第五步那个）。

### 7.8 灌入初始数据（5 家公司 + 10 岗位 + admin 账号）

在浏览器打开这个 URL（替换成你的默认域名）：

```
https://<你的默认域名>/api/admin/seed?token=SETUP2026
```

或者用 curl：

```bash
curl -X POST "https://<你的默认域名>/api/admin/seed" -H "Content-Type: application/json" -d "{\"token\":\"SETUP2026\",\"adminPassword\":\"你的admin密码\"}"
```

成功会看到：
```json
{"ok":true,"data":{"companies":5,"positions":10,"skill_questions":50,"groups":3,"admin_user":"admin"}}
```

---

## 八、配置云函数环境变量（10 分钟）

1. 访问 https://console.cloud.tencent.com/tcb
2. 进入 `campus-recruit-prod` → 左侧 **"云函数"**
3. 找到 `api` 函数 → 点进去
4. 顶部 **"函数配置"** → **"环境变量"**
5. 添加：
   - **键**：`SEED_TOKEN`，**值**：随便一串强密码（如 `MySchool2026!`），**保存**
6. （可选）也添加 `CLOUDBASE_ENV_ID` = 你的环境 ID

> 这一步**必须做**，否则 HR 登录会失败。

---

## 九、最终验证

### 测试 1：访问（关代理）

打开第五步记下的**默认域名**（如 `https://campus-recruit-prod-12345abcde-12539678.tcloudbaseapp.com`）

应该能看到 5 家公司卡片。

### 测试 2：完整流程

1. 点一家公司 → 选岗位 → 填表上传 PDF → 应该看到"投递成功"页
2. 进 `/hr` → 用户名 `admin`，密码是 7.8 步设的那个 → 进入 HR 后台
3. 后台列表能看到刚才投递的记录

### 测试 3：分享给学生/HR

把这个 URL 给他们，他们**不需要翻墙**就能打开（前提是他们的网络也没被特别限制）。

---

## 十、可能的问题

### Q1: 创建环境失败 / 看不到"创建环境"按钮
- 访问 https://console.cloud.tencent.com/tcb/env/create 直接创建页
- 或访问 https://console.cloud.tencent.com/cam 检查你账号是否有 QcloudTCBFullAccess 权限
- 如果不是主账号，找主账号授权

### Q2: tcb login 失败
- 用 `tcb login --apiKeyId <id> --apiKeySecret <secret>` 用 API 密钥登录
- API 密钥在 https://console.cloud.tencent.com/cam/capi 创建

### Q3: npm run deploy:fn 报错"找不到 api 函数"
- 检查 `cloudfunctions/api/` 目录是否有 `index.js`、`package.json`
- 检查 `cloudfunctions/api/tcb.json` 里 `triggers[0].name` 是否为 `api`

### Q4: 部署后访问显示"404"
- 检查是否配置了 SPA fallback：静态托管 → 设置 → 错误页面 → 404 时返回 `index.html`
- 否则非首页路由都会 404

### Q5: 学生提交时"投递失败"
- 检查云存储 bucket 是否叫 `resumes`
- 检查云函数日志（控制台 → 云函数 → api → 日志）

---

## 十一、下次升级要做什么

- 想换漂亮域名：买 `campus-recruit.cn`（¥50/年）→ 备案（7 天）→ Vercel / CloudBase 控制台绑定
- 想换套餐：CloudBase 个人版永久免费，已够用
- 想加微信扫码登录：暂时不支持，需要后端深度改造

---

## 总结：30 分钟操作清单

```
[ 5 min] 注册腾讯云 + 实名认证
[ 2 min] 开通 CloudBase
[ 3 min] 创建环境 campus-recruit-prod
[ 2 min] 开通静态托管 + 创建云存储 bucket
[ 5 min] npm install + tcb login
[ 2 min] 部署云函数 (deploy:fn)
[ 2 min] 部署前端 (deploy:client)
[ 5 min] 设置云函数环境变量
[ 4 min] 灌入初始数据 + 测试

合计：~30 分钟
```

完成后，所有人不翻墙就能用你的校招平台。