# 物流管理系统 - 部署指南

## 🎯 快速部署（推荐）

### 方法 1：使用部署脚本（最简单）

1. **下载项目代码**
   - 从 GitHub 克隆或下载项目：`https://github.com/yangweirong-001/logistics-management.git`

2. **进入项目目录**
   ```bash
   cd logistics-management
   ```

3. **运行部署脚本**
   - Windows：打开 Git Bash 或 PowerShell，运行 `bash deploy.sh`
   - Mac/Linux：在终端运行 `bash deploy.sh`

4. **按照提示操作**
   - 脚本会自动完成：拉取代码、安装依赖、构建项目、推送到 GitHub

5. **等待 Vercel 自动部署**
   - 推送成功后，Vercel 会自动触发部署
   - 访问 Vercel Dashboard 查看部署进度

---

### 方法 2：手动部署（逐步操作）

#### 步骤 1：准备环境

1. **安装 Node.js**
   - 访问：https://nodejs.org/
   - 下载并安装 LTS 版本（推荐 20.x 或更高）

2. **安装 pnpm**
   ```bash
   npm install -g pnpm
   ```

3. **验证安装**
   ```bash
   node --version
   pnpm --version
   ```

#### 步骤 2：克隆项目

```bash
git clone https://github.com/yangweirong-001/logistics-management.git
cd logistics-management
```

#### 步骤 3：安装依赖

```bash
pnpm install
```

#### 步骤 4：本地测试（可选）

```bash
# 开发模式
pnpm dev

# 访问 http://localhost:3000
```

#### 步骤 5：构建项目

```bash
pnpm build
```

#### 步骤 6：推送到 GitHub

```bash
# 提交更改
git add .
git commit -m "chore: 更新项目"

# 推送到 GitHub
git push origin main
```

#### 步骤 7：等待 Vercel 部署

- 推送成功后，Vercel 会自动触发部署
- 访问 Vercel Dashboard 查看部署进度
- 部署完成后，通过 Vercel 提供的域名访问

---

## 🔧 环境变量配置

### 首次部署需配置 Supabase 环境变量

在 Vercel 项目设置中添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

**获取方式**：
1. 登录 Supabase：https://supabase.com/
2. 选择你的项目
3. 进入 Settings → API
4. 复制 URL、anon key 和 service_role key

---

## 📱 访问应用

部署成功后：

1. **访问 Vercel Dashboard**
   - 登录：https://vercel.com/dashboard
   - 选择 `logistics-management` 项目

2. **查看部署状态**
   - 进入 Deployments 标签
   - 查看最新部署的 Status

3. **访问应用**
   - 点击部署记录中的域名
   - 或直接访问：`https://logistics-management-xxx.vercel.app`

---

## ❓ 常见问题

### Q1：推送代码时提示认证失败

**解决方法**：
- 使用 GitHub Personal Access Token
- 生成地址：https://github.com/settings/tokens
- 使用 Token 替代密码

### Q2：Vercel 部署失败

**检查项**：
1. 环境变量是否正确配置
2. Supabase 连接是否正常
3. 构建日志中是否有错误信息

### Q3：如何重新部署

**方法 1**：推送新代码到 GitHub（自动触发）
```bash
git add .
git commit -m "chore: 更新"
git push origin main
```

**方法 2**：在 Vercel Dashboard 手动触发
- 进入 Deployments 标签
- 点击最右侧的 "..." → "Redeploy"

---

## 📞 技术支持

如有问题，请提供以下信息：
1. 错误截图
2. 操作步骤
3. 环境信息（Node.js 版本、操作系统）

---

**祝使用愉快！** 🚀
