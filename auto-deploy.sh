#!/bin/bash

# 物流管理系统 - 自动部署脚本
# 功能：自动推送代码到 GitHub，触发 GitHub Actions 自动部署
# 使用方法：bash auto-deploy.sh

set -e  # 遇到错误立即退出

echo "======================================"
echo "  🚀 物流管理系统 - 自动部署"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 步骤 1：检查是否在项目根目录
echo "📂 步骤 1：检查项目目录..."
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ 错误：请先进入项目根目录${NC}"
  exit 1
fi
echo -e "${GREEN}✅ 项目目录检查通过${NC}"
echo ""

# 步骤 2：检查 Git 仓库
echo "📦 步骤 2：检查 Git 仓库..."
if [ ! -d ".git" ]; then
  echo -e "${RED}❌ 错误：这不是一个 Git 仓库${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Git 仓库检查通过${NC}"
echo ""

# 步骤 3：检查是否有未提交的更改
echo "🔍 步骤 3：检查未提交的更改..."
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  发现未提交的更改${NC}"
  echo ""
  git status --short
  echo ""
  read -p "是否要提交这些更改？(y/n): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "请输入提交信息: " commit_message
    git add .
    git commit -m "$commit_message"
    echo -e "${GREEN}✅ 提交成功${NC}"
  else
    echo -e "${YELLOW}⚠️  跳过提交${NC}"
  fi
else
  echo -e "${GREEN}✅ 没有未提交的更改${NC}"
fi
echo ""

# 步骤 4：拉取最新代码
echo "📥 步骤 4：拉取最新代码..."
git pull origin main
echo -e "${GREEN}✅ 代码拉取成功${NC}"
echo ""

# 步骤 5：安装依赖
echo "📦 步骤 5：安装依赖..."
if command -v pnpm &> /dev/null; then
  pnpm install
elif command -v npm &> /dev/null; then
  npm install
else
  echo -e "${RED}❌ 错误：请先安装 Node.js 和 pnpm${NC}"
  exit 1
fi
echo -e "${GREEN}✅ 依赖安装成功${NC}"
echo ""

# 步骤 6：构建项目
echo "🔨 步骤 6：构建项目..."
if command -v pnpm &> /dev/null; then
  pnpm build
else
  npm run build
fi
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ 项目构建成功${NC}"
else
  echo -e "${RED}❌ 项目构建失败${NC}"
  exit 1
fi
echo ""

# 步骤 7：推送代码到 GitHub
echo "🚀 步骤 7：推送代码到 GitHub..."
git push origin main
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ 代码推送成功${NC}"
else
  echo -e "${RED}❌ 代码推送失败${NC}"
  exit 1
fi
echo ""

# 步骤 8：等待 GitHub Actions 自动部署
echo "⏳ 步骤 8：等待 GitHub Actions 自动部署..."
echo -e "${YELLOW}📌 提示：GitHub Actions 会自动构建并部署到 Vercel${NC}"
echo -e "${YELLOW}📌 通常需要 1-3 分钟完成${NC}"
echo ""

# 步骤 9：显示访问链接
echo "======================================"
echo "  ✅ 部署流程完成！"
echo "======================================"
echo ""
echo "📊 查看部署状态："
echo "  GitHub Actions: https://github.com/yangweirong-001/logistics-management/actions"
echo ""
echo "🌐 查看部署应用："
echo "  Vercel Dashboard: https://vercel.com/dashboard"
echo ""
echo "📱 访问应用："
echo "  等待部署完成后，访问 Vercel 提供的域名"
echo ""
echo "⏰ 预计部署时间：1-3 分钟"
echo ""
echo "======================================"
echo "  祝使用愉快！🚀"
echo "======================================"
