@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 物流管理系统 - 自动部署脚本（Windows 版本）
REM 功能：自动推送代码到 GitHub，触发 GitHub Actions 自动部署
REM 使用方法：双击运行或在命令行中执行 auto-deploy.bat

echo ======================================
echo   🚀 物流管理系统 - 自动部署
echo ======================================
echo.

REM 步骤 1：检查是否在项目根目录
echo 📂 步骤 1：检查项目目录...
if not exist "package.json" (
    echo ❌ 错误：请先进入项目根目录
    pause
    exit /b 1
)
echo ✅ 项目目录检查通过
echo.

REM 步骤 2：检查 Git 仓库
echo 📦 步骤 2：检查 Git 仓库...
if not exist ".git" (
    echo ❌ 错误：这不是一个 Git 仓库
    pause
    exit /b 1
)
echo ✅ Git 仓库检查通过
echo.

REM 步骤 3：检查是否有未提交的更改
echo 🔍 步骤 3：检查未提交的更改...
git status --porcelain >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ 发现未提交的更改
    echo.
    git status --short
    echo.
    set /p commit_confirm="是否要提交这些更改？(y/n): "
    if /i "!commit_confirm!"=="y" (
        set /p commit_message="请输入提交信息: "
        git add .
        git commit -m "!commit_message!"
        echo ✅ 提交成功
    ) else (
        echo ⚠️ 跳过提交
    )
) else (
    echo ✅ 没有未提交的更改
)
echo.

REM 步骤 4：拉取最新代码
echo 📥 步骤 4：拉取最新代码...
git pull origin main
if %errorlevel% neq 0 (
    echo ❌ 代码拉取失败
    pause
    exit /b 1
)
echo ✅ 代码拉取成功
echo.

REM 步骤 5：安装依赖
echo 📦 步骤 5：安装依赖...
where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    pnpm install
) else (
    where npm >nul 2>&1
    if %errorlevel% equ 0 (
        npm install
    ) else (
        echo ❌ 错误：请先安装 Node.js 和 pnpm
        pause
        exit /b 1
    )
)
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装成功
echo.

REM 步骤 6：构建项目
echo 🔨 步骤 6：构建项目...
where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    pnpm build
) else (
    npm run build
)
if %errorlevel% neq 0 (
    echo ❌ 项目构建失败
    pause
    exit /b 1
)
echo ✅ 项目构建成功
echo.

REM 步骤 7：推送代码到 GitHub
echo 🚀 步骤 7：推送代码到 GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ 代码推送失败
    pause
    exit /b 1
)
echo ✅ 代码推送成功
echo.

REM 步骤 8：等待 GitHub Actions 自动部署
echo ⏳ 步骤 8：等待 GitHub Actions 自动部署...
echo 📌 提示：GitHub Actions 会自动构建并部署到 Vercel
echo 📌 通常需要 1-3 分钟完成
echo.

REM 步骤 9：显示访问链接
echo ======================================
echo   ✅ 部署流程完成！
echo ======================================
echo.
echo 📊 查看部署状态：
echo   GitHub Actions: https://github.com/yangweirong-001/logistics-management/actions
echo.
echo 🌐 查看部署应用：
echo   Vercel Dashboard: https://vercel.com/dashboard
echo.
echo 📱 访问应用：
echo   等待部署完成后，访问 Vercel 提供的域名
echo.
echo ⏰ 预计部署时间：1-3 分钟
echo.
echo ======================================
echo   祝使用愉快！🚀
echo ======================================
pause
