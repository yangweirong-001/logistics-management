# 🎯 自动部署 - 完整配置指南

## 📋 概述

本项目现在支持 **完全自动化的部署流程**：

```
推送代码 → GitHub Actions 自动构建 → 自动部署到 Vercel → 部署完成
```

你只需要推送代码，剩下的都会自动完成！

---

## 🚀 快速开始（3 分钟配置）

### 步骤 1：获取 Vercel Token（1 分钟）

1. 访问：https://vercel.com/dashboard
2. 点击右上角头像 → **Settings**
3. 左侧菜单选择 **Tokens**
4. 点击 **Create Token**
5. 填写：
   - **Name**: `GitHub Actions`
   - **Expiration**: 选择 90 days
6. 点击 **Create**
7. **复制 Token**（只显示一次！）

### 步骤 2：配置 GitHub Secrets（1 分钟）

1. 访问：https://github.com/yangweirong-001/logistics-management/settings/secrets/actions
2. 点击 **New repository secret**
3. 填写：
   - **Name**: `VERCEL_TOKEN`
   - **Secret**: 粘贴步骤 1 的 Token
4. 点击 **Add secret**

### 步骤 3：测试自动部署（1 分钟）

```bash
# 克隆项目
git clone https://github.com/yangweirong-001/logistics-management.git
cd logistics-management

# 运行自动部署脚本
bash auto-deploy.sh  # Mac/Linux
# 或双击 auto-deploy.bat  # Windows
```

**脚本会自动完成**：
- ✅ 检查代码
- ✅ 安装依赖
- ✅ 构建项目
- ✅ 推送到 GitHub
- ✅ 触发 GitHub Actions 自动部署

---

## 📊 部署流程

### 完整流程

```
1. 你推送代码
   ↓
2. GitHub 检测到推送
   ↓
3. GitHub Actions 自动运行
   ↓
4. 安装依赖（pnpm install）
   ↓
5. 构建项目（pnpm build）
   ↓
6. 部署到 Vercel
   ↓
7. 部署完成！
```

### 时间估算

- **GitHub Actions 运行**: 1-2 分钟
- **Vercel 部署**: 1-2 分钟
- **总计**: 2-4 分钟

---

## 📱 查看部署状态

### 方法 1：GitHub Actions（推荐）

1. 访问：https://github.com/yangweirong-001/logistics-management/actions
2. 可以看到所有的 workflow 运行记录
3. 点击具体的 workflow 查看详细日志

### 方法 2：Vercel Dashboard

1. 访问：https://vercel.com/dashboard
2. 进入 `logistics-management` 项目
3. 点击 **Deployments** 标签

---

## 🛠️ 工具说明

### 1. 自动部署脚本

#### Windows 用户：`auto-deploy.bat`
- 双击运行
- 自动完成所有部署步骤
- 中文界面，简单易懂

#### Mac/Linux 用户：`auto-deploy.sh`
- 运行：`bash auto-deploy.sh`
- 自动完成所有部署步骤
- 彩色输出，清晰明了

### 2. GitHub Actions Workflow

项目包含两个 workflow 文件：

#### `deploy-simple.yml`（推荐，使用）
- ✅ 只需配置 `VERCEL_TOKEN`
- ✅ 使用 Vercel CLI 自动部署
- ✅ 简单易用，适合新手

#### `deploy.yml`（高级，可选）
- 需要配置 `VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID`
- 使用 Vercel API 部署
- 更可控，适合高级用户

---

## 🎯 使用场景

### 场景 1：日常开发

```bash
# 修改代码
# ...

# 运行自动部署脚本
bash auto-deploy.sh

# 等待 2-4 分钟，部署完成！
```

### 场景 2：快速修复 Bug

```bash
# 修复 Bug
# ...

# 提交并推送
git add .
git commit -m "fix: 修复 bug"
git push origin main

# GitHub Actions 自动部署，无需手动操作
```

### 场景 3：多人协作

```bash
# 团队成员 A 提交代码
git push origin main

# 团队成员 B 拉取并查看
git pull origin main

# GitHub Actions 自动部署，所有成员都能看到最新版本
```

---

## ❓ 常见问题

### Q1：GitHub Actions 失败，提示 "VERCEL_TOKEN not found"

**原因**：GitHub Secrets 未配置或配置错误

**解决方法**：
1. 检查 GitHub Secrets 是否正确配置
2. 确认 Secret 名称是 `VERCEL_TOKEN`（区分大小写）
3. 重新添加 Secret

### Q2：部署成功但访问不了

**检查项**：
1. Vercel 环境变量是否正确配置
2. Supabase 连接是否正常
3. 查看 Vercel 部署日志

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
1. 访问：https://github.com/yangweirong-001/logistics-management/actions
2. 选择 workflow
3. 点击 "Run workflow"

**方法 2**：使用 Vercel Deploy Hook
1. 在 Vercel 创建 Deploy Hook
2. 使用 curl 触发

### Q5：脚本运行失败怎么办？

**检查项**：
1. Node.js 和 pnpm 是否正确安装
2. Git 是否正确配置
3. 是否有足够的权限

**解决方法**：
```bash
# 检查 Node.js
node --version

# 检查 pnpm
pnpm --version

# 检查 Git
git --version
```

---

## 🔧 高级配置

### 配置 Org ID 和 Project ID（可选）

如果需要更精确的控制，可以配置 Org ID 和 Project ID：

1. **获取 Org ID**
   - 访问：https://vercel.com/dashboard/settings
   - 找到 **Team ID**

2. **获取 Project ID**
   - 访问 Vercel Dashboard
   - 进入项目 → Settings → General
   - 找到 **Project ID**

3. **配置 GitHub Secrets**
   - `VERCEL_ORG_ID`: 你的 Org ID
   - `VERCEL_PROJECT_ID`: 你的 Project ID

4. **切换到完整版 workflow**
   - 修改 `.github/workflows/deploy.yml` 使用完整版

---

## 📚 相关文档

- [GitHub Actions 官方文档](https://docs.github.com/cn/actions)
- [Vercel 部署文档](https://vercel.com/docs)
- [项目 README](./README.md)
- [快速开始指南](./QUICKSTART.md)
- [GitHub Actions 配置指南](./GITHUB_ACTIONS_GUIDE.md)

---

## 🎉 配置完成！

现在你可以：

✅ 推送代码后自动部署
✅ 查看部署状态
✅ 回滚到历史版本
✅ 团队协作开发

**祝你使用愉快！** 🚀
