# 🔧 Vercel 环境变量配置指南

## ❌ 部署失败原因

```
Environment Variable "COZE_SUPABASE_URL" references
Secret "supabase-url", which does not exist.
```

**原因**：Vercel 项目中缺少 `supabase-url` 和 `supabase-anon-key` 环境变量

---

## ✅ 解决方案

### 步骤 1：获取 Supabase 环境变量

1. 访问 Supabase Dashboard：https://supabase.com/dashboard
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制以下信息：
   - **Project URL** → 保存为 `supabase-url`
   - **anon public** key → 保存为 `supabase-anon-key`
   - **service_role** key → 保存为 `supabase-service-role-key`

---

### 步骤 2：在 Vercel 配置环境变量

1. 访问 Vercel Dashboard
2. 进入 `projects` 项目
3. 点击 **Settings** → **Environment Variables**

#### 添加 supabase-url

- **Name**: `supabase-url`
- **Value**: 粘贴你的 Supabase Project URL
  - 格式：`https://xxx.supabase.co`
- **Environment**: 勾选 `Production`、`Preview`、`Development`
- 点击 **Save**

#### 添加 supabase-anon-key

- **Name**: `supabase-anon-key`
- **Value**: 粘贴你的 Supabase anon public key
  - 格式：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Environment**: 勾选 `Production`、`Preview`、`Development`
- 点击 **Save**

#### 添加 supabase-service-role-key

- **Name**: `supabase-service-role-key`
- **Value**: 粘贴你的 Supabase service_role key
  - 格式：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Environment**: 勾选 `Production`、`Preview`、`Development`
- 点击 **Save**

---

### 步骤 3：重新部署

配置完成后：

1. 访问 Vercel Dashboard
2. 进入 `projects` 项目
3. 点击 **Deployments** 标签
4. 找到最新的部署记录
5. 点击右侧的 **...** → **Redeploy**
6. 点击 **Redeploy** 按钮

---

## 📋 环境变量列表

| 名称 | 说明 | 示例 |
|------|------|------|
| supabase-url | Supabase 项目 URL | `https://xxx.supabase.co` |
| supabase-anon-key | Supabase 公开密钥 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| supabase-service-role-key | Supabase 服务角色密钥 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

---

## 🎯 vercel.json 配置

```json
{
  "env": {
    "COZE_SUPABASE_URL": "@supabase-url",
    "COZE_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
    "NODE_ENV": "production"
  }
}
```

---

## ✅ 配置完成后

1. 重新部署项目
2. 访问应用
3. 检查是否正常工作

---

**配置完成后，告诉告诉我"环境变量已配置"，我继续指导下一步！** 🚀
