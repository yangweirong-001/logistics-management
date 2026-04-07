# 创建 flight_exceptions 表的 SQL 脚本

## 问题说明

如果您遇到错误：`Could not find the table 'public.flight_exceptions' in the schema cache`

这说明数据库中缺少 `flight_exceptions` 表，或者 PostgREST 的缓存没有更新。

## 解决方案

请按照以下步骤在 Supabase 控制台执行 SQL：

### 步骤 1：登录 Supabase 控制台
1. 访问 https://supabase.com/dashboard
2. 选择您的项目
3. 点击左侧菜单的 "SQL Editor"
4. 点击 "New query"

### 步骤 2：执行以下 SQL

```sql
-- 检查表是否存在，如果不存在则创建
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'flight_exceptions') THEN
    CREATE TABLE public.flight_exceptions (
      id SERIAL PRIMARY KEY NOT NULL,
      depart_date VARCHAR(20) NOT NULL,
      flight_date VARCHAR(20) NOT NULL,
      flight_no VARCHAR(20) NOT NULL,
      main_no VARCHAR(50) NOT NULL,
      bills INTEGER NOT NULL,
      origin VARCHAR(10) NOT NULL,
      transfer VARCHAR(10),
      dest VARCHAR(10) NOT NULL,
      exception_reason VARCHAR(500) NOT NULL,
      remark VARCHAR(500),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 创建索引
    CREATE INDEX flight_exceptions_depart_date_idx ON public.flight_exceptions USING BTREE (depart_date ASC NULLS LAST);
    CREATE INDEX flight_exceptions_flight_date_idx ON public.flight_exceptions USING BTREE (flight_date ASC NULLS LAST);
    CREATE INDEX flight_exceptions_main_no_idx ON public.flight_exceptions USING BTREE (main_no ASC NULLS LAST);

    -- 启用 RLS
    ALTER TABLE public.flight_exceptions ENABLE ROW LEVEL SECURITY;

    -- 创建 RLS 策略
    CREATE POLICY "flight_exceptions_允许公开删除" ON public.flight_exceptions FOR DELETE TO public USING (true);
    CREATE POLICY "flight_exceptions_允许公开更新" ON public.flight_exceptions FOR UPDATE TO public USING (true) WITH CHECK (true);
    CREATE POLICY "flight_exceptions_允许公开写入" ON public.flight_exceptions FOR INSERT TO public WITH CHECK (true);
    CREATE POLICY "flight_exceptions_允许公开读取" ON public.flight_exceptions FOR SELECT TO public;

    RAISE NOTICE '表 flight_exceptions 创建成功';
  ELSE
    RAISE NOTICE '表 flight_exceptions 已存在';

    -- 删除旧策略并重新创建
    DROP POLICY IF EXISTS "flight_exceptions_允许公开删除" ON public.flight_exceptions;
    DROP POLICY IF EXISTS "flight_exceptions_允许公开更新" ON public.flight_exceptions;
    DROP POLICY IF EXISTS "flight_exceptions_允许公开写入" ON public.flight_exceptions;
    DROP POLICY IF EXISTS "flight_exceptions_允许公开读取" ON public.flight_exceptions;

    CREATE POLICY "flight_exceptions_允许公开删除" ON public.flight_exceptions FOR DELETE TO public USING (true);
    CREATE POLICY "flight_exceptions_允许公开更新" ON public.flight_exceptions FOR UPDATE TO public USING (true) WITH CHECK (true);
    CREATE POLICY "flight_exceptions_允许公开写入" ON public.flight_exceptions FOR INSERT TO public WITH CHECK (true);
    CREATE POLICY "flight_exceptions_允许公开读取" ON public.flight_exceptions FOR SELECT TO public;

    RAISE NOTICE 'RLS 策略已更新';
  END IF;
END $$;

-- 刷新 PostgREST schema
NOTIFY pgrst, 'reload schema';
```

### 步骤 3：验证

执行成功后，您应该看到：
- 表 flight_exceptions 创建成功
- 或者：表 flight_exceptions 已存在，RLS 策略已更新

## 快速验证

执行以下 SQL 验证表是否创建成功：

```sql
SELECT * FROM public.flight_exceptions LIMIT 1;
```

如果返回空结果或数据，说明表已成功创建。

## 注意事项

1. 执行 SQL 需要数据库的写入权限
2. 如果遇到权限错误，请确保您是项目所有者或有足够权限
3. 刷新 PostgREST schema 可能需要几秒钟时间
