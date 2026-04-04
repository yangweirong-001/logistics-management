#!/bin/bash

# 物流管理系统 - 快速部署脚本
# 使用方法：在本地电脑上运行此脚本
# 1. 将此脚本保存为 deploy.sh
# 2. 在项目根目录运行: bash deploy.sh
# 3. 按照提示操作

echo "======================================"
echo "  物流管理系统 - 快速部署脚本"
echo "======================================"
echo ""

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
  echo "❌ 错误：请先进入项目根目录"
  exit 1
fi

# 检查 Git 仓库
if [ ! -d ".git" ]; then
  echo "❌ 错误：这不是一个 Git 仓库"
  exit 1
fi

echo "📦 步骤 1：拉取最新代码"
git pull origin main

echo ""
echo "📦 步骤 2：安装依赖"
if command -v pnpm &> /dev/null; then
  pnpm install
elif command -v npm &> /dev/null; then
  npm install
else
  echo "❌ 错误：请先安装 Node.js 和 pnpm"
  exit 1
fi

echo ""
echo "🔨 步骤 3：构建项目"
if command -v pnpm &> /dev/null; then
  pnpm build
else
  npm run build
fi

echo ""
echo "🚀 步骤 4：推送代码到 GitHub"
git push origin main

echo ""
echo "======================================"
echo "  ✅ 部署完成！"
echo "======================================"
echo ""
echo "📝 提示："
echo "  - 访问 Vercel 查看部署状态"
echo "  - 通常需要 1-3 分钟完成部署"
echo "  - 部署成功后，通过 Vercel 提供的域名访问"
echo ""
