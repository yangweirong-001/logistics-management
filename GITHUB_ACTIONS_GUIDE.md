# 🔐 GitHub Actions 自动部署配置指南

## 📋 概述

本项目已配置 GitHub Actions 自动部署，每次推送代码到 `main` 分支后，会自动：
1. 构建项目
2. 运行测试（可选）
3. 部署到 Vercel

---

## ⚙️ 配置步骤

### 步骤 1：获取 Vercel Token

1. 访问 Vercel Dashboard：https://vercel.com/dashboard
2. 点击右上角头像 → **Settings**
3. 左侧菜单选择 **Tokens**
4. 点击 **Create Token**
5. 填写信息：
   - **Name**：`GitHub Actions`
   - **Expiration**：选择有效期（推荐 90 days 或 1 year）
6. 点击 **Create**
7. **复制 Token**（只显示一次！）

---

### 步骤 2：获取 Vercel Org ID 和 Project ID（可选）

如果使用 `deploy.yml`（完整版），需要这两个 ID：

#### 获取 Org ID

1. 访问 Vercel Dashboard
2. 点击右上角头像 → **Settings**
3. 在页面中找到 **General** 标签
4. 找到 **Team ID**，这就是 Org ID

#### 获取 Project ID

1. 访问 Vercel Dashboard
2. 进入 `logistics-management` 项目
3. 点击 **Settings** → **General**
4. 在页面中找到 **Project ID**

---

### 步骤 3：在 GitHub 配置 Secrets

1. 访问 GitHub 仓库：https://github.com/yangweirong-001/logistics-management
2. 点击 **Settings** 标签
3. 左侧菜单选择 **Secrets and variables** → **Actions**
4. 点击 **New repository secret**

#### 添加 Vercel Token

- **Name**: `VERCEL_TOKEN`
- **Secret**: 粘贴步骤 1 复制的 Token
- 点击 **Add secret**

#### 添加 Org ID（可选）

- **Name**: `VERCEL_ORG_ID`
- **Secret**: 粘贴步骤 2 获取的 Org ID
- 点击 **Add secret**

#### 添加 Project ID（可选）

- **Name**: `VERCEL_PROJECT_ID`
- **Secret**: 粘贴步骤 2 获取的 Project ID
- 点击 **Add secret**

---

## 🚀 使用方法

### 推荐：使用简化版（只需 Vercel Token）

项目提供了两个 workflow 文件：

1. **deploy-simple.yml**（推荐）
   - 只需配置 `VERCEL_TOKEN`
   - 使用 Vercel CLI 自动部署
   - 更简单易用

2. **deploy.yml**（高级）
   - 需要配置 `VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID`
   - 使用 Vercel API 部署
   - 更可控

---

### 推送代码触发部署

配置完成后，每次推送代码到 `main` 分支都会自动触发部署：

```bash
git add .
git commit -m "chore: 更新功能"
git push origin main
```

推送成功后：
1. GitHub Actions 会自动运行
2. 构建项目
3. 部署到 Vercel
4. 部署完成后会显示访问地址

---

## 📊 查看部署状态

### 方法 1：在 GitHub 查看

1. 访问 GitHub 仓库
2. 点击 **Actions** 标签
3. 可以看到所有的 workflow 运行记录
4. 点击具体的 workflow 查看详细日志

### 方法 2：在 Vercel 查看

1. 访问 Vercel Dashboard
2. 进入 `logistics-management` 项目
3. 点击 **Deployments** 标签
4. 查看部署历史和状态

---

## 🔧 工作流说明

### deploy-simple.yml（简化版）

```yaml
触发条件：推送到 main 分支
步骤：
1. 检出代码
2. 设置 Node.js 20
3. 安装 pnpm
4. 安装依赖
5. 运行测试（可选）
6. 构建项目
7. 安装 Vercel CLI
8. 部署到 Vercel
9. 通知部署完成
```

### deploy.yml（完整版）

```yaml
触发条件：推送到 main 分支
步骤：
1. 检出代码
2. 设置 Node.js 20
3. 安装 pnpm
4. 安装依赖
5. 构建项目
6. 部署到 Vercel（使用 API）
7. 输出部署 URL
```

---

## ❓ 常见问题

### Q1：GitHub Actions 失败，提示 "VERCEL_TOKEN not found"

**解决方法**：
1. 检查 GitHub Secrets 是否正确配置
2. 确认 Secret 名称是 `VERCEL_TOKEN`（区分大小写）
3. 重新添加 Secret

### Q2：部署成功但访问不了

**检查项**：
1. Vercel Token 是否有足够权限
2. 环境变量是否正确配置
3. Supabase 连接是否正常
4. 查看 Vercel 部署日志

### Q3：如何跳过自动部署？

**方法 1**：推送到其他分支
```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```

**方法 2**：在提交信息中添加 `[skip ci]`
```bash
git commit -m "chore: 更新文档 [skip ci]"
git push origin main
```

### Q4：如何手动触发部署？

**方法 1**：在 GitHub Actions 页面手动触发
1. 访问 GitHub 仓库 → Actions
2. 选择 workflow
3. 点击 "Run workflow"

**方法 2**：使用 Vercel Deploy Hook
1. 在 Vercel 创建 Deploy Hook
2. 使用 curl 触发
```bash
curl -X POST https://api.vercel.com/v1/integrations/deploy/xxx/xxx
```

---

## 📱 自动化流程

```
推送代码
  ↓
GitHub Actions 检测到推送
  ↓
自动运行 workflow
  ↓
安装依赖
  ↓
构建项目
  ↓
部署到 Vercel
  ↓
部署完成
  ↓
访问应用
```

---

## 🎯 优势

✅ **完全自动化**：推送代码后自动部署，无需手动操作
✅ **免费使用**：GitHub Actions 公开仓库免费使用
✅ **快速部署**：通常 1-3 分钟完成部署
✅ **历史记录**：保存所有部署记录，方便回滚
✅ **错误通知**：部署失败会自动发送通知

---

## 📞 获取帮助

如有问题，请：
1. 查看 GitHub Actions 日志
2. 查看 Vercel 部署日志
3. 检查 GitHub Secrets 配置
4. 联系技术支持

---

**祝你使用愉快！** 🚀
