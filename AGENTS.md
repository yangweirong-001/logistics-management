# 物流管理系统 - 项目文档

## 项目概览

日本物流管理系统，用于管理方数预估、主单发放等业务。基于 Next.js 16 + Supabase 构建，支持多用户联网协作。

### 技术栈

- **前端**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **UI 组件**: shadcn/ui + Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **ORM**: Drizzle Kit (仅用于 Schema 定义)

### 核心功能

1. **配置管理**
   - 区域参数配置：仓库的大包体积、各区域占比
   - 航班配置：按仓库和周几配置路由类型
   - 目的港配置：港口代码与区域映射
   - 航空路由配置：航班详细信息

2. **业务操作**
   - 方数预估：根据大包数自动计算各方数
   - 主单发放：创建和管理主单
   - 主单查询：按条件查询主单
   - 欠方余方查询：计算预估与打货上限的差异

## 目录结构

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
│   │   └── balance/            # 欠方余方查询 API
│   ├── page.tsx                # 主页面
│   └── layout.tsx              # 布局
├── lib/
│   └── db.ts                   # 数据库操作封装
├── storage/database/
│   ├── supabase-client.ts      # Supabase 客户端
│   └── shared/schema.ts        # 数据库表结构定义
└── components/ui/              # UI 组件库
```

## 数据库表

### area_configs - 区域参数配置
- `id`: 主键
- `warehouse`: 仓库（东莞/加工区）
- `package_volume`: 大包预估体积
- `kanto_ratio`, `kansai_ratio`: 目的港占比
- `kanto_normal_ratio`, `kanto_special_ratio`: 关东普货/特货占比
- `kansai_normal_ratio`, `kansai_special_ratio`: 关西普货/特货占比

### flight_configs - 航班配置
- `id`: 主键
- `warehouse`: 仓库
- `weekday`: 周几
- `kanto_normal`, `kansai_normal`: 普货路由类型
- `kanto_special`, `kansai_special`: 特货路由类型

### route_configs - 航空路由配置
- `id`: 主键
- `flight_no`: 航班号
- `origin`, `transfer`, `dest`: 始发/中转/目的
- `depart_time`, `arrive_time`: 起飞/落地时间
- `route_type`: 路由类型（空运/海空）

### volume_estimates - 方数预估
- 存储每次方数预估的计算结果

### main_orders - 主单发放
- 存储主单的完整信息

## 开发规范

### API 调用

所有数据库操作通过 `/api/*` 路由进行，前端使用 `fetch` 调用：

```typescript
// 获取数据
const res = await fetch('/api/area-config');
const data = await res.json();

// 创建数据
await fetch('/api/area-config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... }),
});
```

### 数据库操作

使用 `@/lib/db` 中封装的 API：

```typescript
import { areaConfigApi } from '@/lib/db';

// 查询所有
const data = await areaConfigApi.getAll();

// 创建
const newItem = await areaConfigApi.create({ ... });

// 更新
await areaConfigApi.update(id, { ... });

// 删除
await areaConfigApi.delete(id);
```

### 表结构修改

1. 修改 `src/storage/database/shared/schema.ts`
2. 执行 `coze-coding-ai db upgrade` 同步到数据库

## 构建与部署

```bash
# 开发模式
coze dev

# 构建生产版本
coze build

# 启动生产环境
coze start
```

## 注意事项

1. **字段命名**: 数据库字段使用 snake_case（如 `kanto_ratio`）
2. **错误处理**: 所有 API 调用都检查 `error` 并处理
3. **RLS 策略**: 所有表已配置公开读写策略（适合无登录功能的场景）
4. **类型安全**: 使用 TypeScript 类型定义，避免运行时错误
