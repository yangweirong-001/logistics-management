# 物流管理系统

一个现代化的日本物流管理系统，用于管理方数预估、主单发放、航班异常记录等核心业务。

## 📋 功能特性

### 配置管理
- **区域参数配置**：仓库大包体积、各区域占比、普货/特货占比设置
- **航班配置**：按仓库和周几配置路由类型
- **目的港配置**：港口代码与区域映射
- **航空路由配置**：航班详细信息（起降时间、是否隔天等）

### 业务操作
- **方数预估**：根据大包数自动计算各方数，支持实时预览
- **主单发放**：创建和管理主单，支持自动匹配航班信息
- **主单查询**：多维度查询主单，支持导出 Excel
- **欠方余方查询**：计算预估与打货上限的差异
- **航班异常情况记录**：记录航班异常信息，自动关联主单

## 🚀 快速开始

### 环境要求
- Node.js 20+
- pnpm 9+
- Git

### 安装与运行

1. **克隆项目**
```bash
git clone https://github.com/yangweirong-001/logistics-management.git
cd logistics-management
```

2. **安装依赖**
```bash
pnpm install
```

3. **配置环境变量**
在项目根目录创建 `.env.local` 文件：
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

4. **启动开发服务器**
```bash
pnpm dev
```

5. **访问应用**
打开浏览器访问：http://localhost:3000

## 🌐 自动部署

本项目已配置 **GitHub Actions 自动部署**，每次推送代码到 `main` 分支后会自动构建并部署到 Vercel。

### 快速部署

**Windows 用户**：双击运行 `auto-deploy.bat`
**Mac/Linux 用户**：运行 `bash auto-deploy.sh`

脚本会自动完成：
1. 检查并提交代码
2. 拉取最新代码
3. 安装依赖
4. 构建项目
5. 推送到 GitHub
6. 触发 GitHub Actions 自动部署

### 配置步骤

1. **获取 Vercel Token**
   - 访问 Vercel Dashboard → Settings → Tokens
   - 创建 Token，名称为 `GitHub Actions`
   - 复制 Token

2. **配置 GitHub Secrets**
   - 访问 GitHub 仓库 → Settings → Secrets and variables → Actions
   - 添加 Secret：
     - Name: `VERCEL_TOKEN`
     - Secret: 粘贴 Vercel Token

3. **推送代码触发部署**
   ```bash
   git add .
   git commit -m "chore: 更新功能"
   git push origin main
   ```

4. **查看部署状态**
   - GitHub Actions: https://github.com/yangweirong-001/logistics-management/actions
   - Vercel Dashboard: https://vercel.com/dashboard

**详细配置说明**：查看 [GITHUB_ACTIONS_GUIDE.md](./GITHUB_ACTIONS_GUIDE.md)

### 手动部署到 Vercel

1. 在 Vercel 导入 GitHub 仓库
2. 配置 Supabase 环境变量
3. 部署完成

详见 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 📖 使用文档

- [快速开始](./QUICKSTART.md) - 快速上手指南（适合无编程基础用户）
- [部署指南](./DEPLOYMENT_GUIDE.md) - 详细部署步骤
- [推送代码指南](./PUSH_GUIDE.md) - 如何推送代码到 GitHub

## 🛠️ 技术栈

- **前端框架**：Next.js 16 (App Router)
- **UI 组件**：shadcn/ui + Radix UI
- **样式方案**：Tailwind CSS 4
- **数据库**：Supabase (PostgreSQL)
- **表单验证**：React Hook Form + Zod
- **数据导出**：xlsx
- **部署平台**：Vercel

## 📁 项目结构

```
src/
├── app/
│   ├── api/                    # API 路由
│   │   ├── area-config/        # 区域参数配置 API
│   │   ├── flight-config/      # 航班配置 API
│   │   ├── port-config/        # 目的港配置 API
│   │   ├── route-config/       # 航空路由配置 API
│   │   ├── volume-estimate/    # 方数预估 API
│   │   ├── main-order/         # 主单发放 API
│   │   ├── balance/            # 欠方余方查询 API
│   │   └── flight-exception/   # 航班异常记录 API
│   ├── page.tsx                # 主页面
│   └── layout.tsx              # 布局
├── lib/
│   └── db.ts                   # 数据库操作封装
├── storage/database/
│   ├── supabase-client.ts      # Supabase 客户端
│   └── shared/schema.ts        # 数据库表结构定义
└── components/ui/              # UI 组件库
```

## 💡 核心功能说明

### 方数预估
- 输入大包数、重量、是否齐全等信息
- 自动计算总方数、各方数占比
- 实时展示计算结果
- 支持保存和查询历史记录

### 主单发放
- 选择仓库、货物属性、目的港等
- 自动匹配航班配置
- 支持手动调整航班信息
- 保存后自动关联到方数预估

### 主单查询
- 多维度筛选（日期、仓库、口岸、货物属性等）
- 表格支持纵横锁定（固定表头和左侧列）
- 支持导出 Excel

### 航班异常记录
- 输入主单号自动填充航班信息
- 记录异常原因和备注
- 支持创建、编辑、删除

## 🎨 界面特点

- 🎯 **侧边栏导航**：固定左侧，不随页面滚动
- 📊 **分组展示**：方数预估结果使用彩色卡片分组展示
- 📋 **紧凑表格**：所有表格单元格间距紧凑，信息密度高
- 🔒 **固定列**：关键列固定，横向滚动时可见
- 📱 **响应式设计**：适配不同屏幕尺寸

## 🔒 安全性

- Supabase RLS 策略保护数据安全
- 所有 API 调用检查错误并处理
- 环境变量敏感信息加密存储

## 📞 获取帮助

如有问题，请：
1. 查看 [使用文档](./QUICKSTART.md)
2. 查看 [部署指南](./DEPLOYMENT_GUIDE.md)
3. 提交 Issue 到 GitHub

## 📄 开源协议

MIT License

---

**祝使用愉快！** 🚀
