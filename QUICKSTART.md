# 物流管理系统 - 快速开始

## 🎯 你需要做什么？

如果你**没有编程基础**，按照下面的步骤操作即可：

---

## 📋 步骤 1：准备工具（只需一次）

### 1.1 安装 Node.js

1. 访问：https://nodejs.org/
2. 点击绿色按钮下载 LTS 版本
3. 运行安装程序，一直点"下一步"
4. 安装完成后，打开命令提示符（CMD）或 PowerShell
5. 输入 `node --version`，如果显示版本号说明安装成功

### 1.2 安装 Git

1. 访问：https://git-scm.com/downloads
2. 下载 Windows 版本
3. 运行安装程序，一直点"下一步"
4. 安装完成后，打开命令提示符
5. 输入 `git --version`，如果显示版本号说明安装成功

### 1.3 安装 pnpm

打开命令提示符，输入：
```bash
npm install -g pnpm
```

---

## 📦 步骤 2：下载项目

### 2.1 下载项目代码

1. 访问：https://github.com/yangweirong-001/logistics-management
2. 点击绿色按钮 "Code"
3. 选择 "Download ZIP"
4. 解压到某个文件夹（如 D:\logistics-management）

### 2.2 进入项目目录

打开命令提示符，输入：
```bash
cd D:\logistics-management
```

---

## 🔨 步骤 3：安装依赖

在命令提示符中输入：
```bash
pnpm install
```

等待安装完成（可能需要 1-2 分钟）

---

## 🚀 步骤 4：本地运行（可选）

### 4.1 启动开发服务器

在命令提示符中输入：
```bash
pnpm dev
```

### 4.2 访问应用

1. 打开浏览器
2. 访问：http://localhost:3000
3. 你可以看到物流管理系统界面

---

## 🌐 步骤 5：部署到 Vercel（推荐）

### 5.1 注册 Vercel 账号

1. 访问：https://vercel.com/
2. 点击 "Sign Up"
3. 使用 GitHub 账号登录

### 5.2 导入项目

1. 登录后，点击 "Add New" → "Project"
2. 点击 "Import Git Repository"
3. 搜索并选择 `logistics-management` 项目
4. 点击 "Import"

### 5.3 配置环境变量

在项目设置中，添加以下环境变量（从 Supabase 获取）：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

**获取 Supabase 环境变量**：
1. 访问：https://supabase.com/
2. 登录并选择你的项目
3. 进入 Settings → API
4. 复制 URL、anon key 和 service_role key

### 5.4 部署

1. 点击 "Deploy" 按钮
2. 等待 1-3 分钟
3. 部署完成后，点击访问域名

---

## 📱 使用系统

### 主要功能

1. **配置管理**
   - 区域参数配置：设置仓库大包体积、区域占比
   - 航班配置：设置每周航班路由类型
   - 目的港配置：设置港口代码与区域映射
   - 航空路由配置：设置航班详细信息

2. **业务操作**
   - 方数预估：根据大包数自动计算各方数
   - 主单发放：创建和管理主单
   - 主单查询：按条件查询主单
   - 欠方余方查询：计算预估与打货上限的差异
   - 航班异常情况记录：记录航班异常信息

---

## ❓ 常见问题

### Q1：我不会用命令行怎么办？

**推荐方法**：
- 使用 Vercel 直接部署（无需命令行）
- 1. 访问 Vercel
- 2. 导入 GitHub 项目
- 3. 配置环境变量
- 4. 点击部署

### Q2：如何更新系统？

**方法 1：使用部署脚本**
- 运行 `bash deploy.sh`

**方法 2：手动更新**
```bash
git pull origin main
pnpm build
git push origin main
```

### Q3：系统打不开怎么办？

**检查项**：
1. 检查网络连接
2. 检查 Vercel 部署状态
3. 检查 Supabase 连接状态
4. 清除浏览器缓存

---

## 📞 获取帮助

如有问题，请：
1. 截图错误信息
2. 记录操作步骤
3. 联系技术支持

---

**祝使用愉快！** 🚀
