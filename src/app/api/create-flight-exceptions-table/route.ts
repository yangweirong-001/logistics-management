import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseCredentials } from '@/storage/database/supabase-client';

export async function POST() {
  const serviceRoleKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
  const { url } = getSupabaseCredentials();

  if (!serviceRoleKey) {
    return NextResponse.json({ success: false, error: '缺少 COZE_SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
  }

  try {
    // 直接使用 Postgres REST API 的 SQL 执行功能
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: `
          -- 创建表
          CREATE TABLE IF NOT EXISTS public.flight_exceptions (
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
          CREATE INDEX IF NOT EXISTS flight_exceptions_depart_date_idx ON public.flight_exceptions USING BTREE (depart_date ASC NULLS LAST);
          CREATE INDEX IF NOT EXISTS flight_exceptions_flight_date_idx ON public.flight_exceptions USING BTREE (flight_date ASC NULLS LAST);
          CREATE INDEX IF NOT EXISTS flight_exceptions_main_no_idx ON public.flight_exceptions USING BTREE (main_no ASC NULLS LAST);

          -- 启用 RLS
          ALTER TABLE public.flight_exceptions ENABLE ROW LEVEL SECURITY;

          -- 删除旧策略
          DROP POLICY IF EXISTS "flight_exceptions_允许公开删除" ON public.flight_exceptions;
          DROP POLICY IF EXISTS "flight_exceptions_允许公开更新" ON public.flight_exceptions;
          DROP POLICY IF EXISTS "flight_exceptions_允许公开写入" ON public.flight_exceptions;
          DROP POLICY IF EXISTS "flight_exceptions_允许公开读取" ON public.flight_exceptions;

          -- 创建 RLS 策略
          CREATE POLICY "flight_exceptions_允许公开删除" ON public.flight_exceptions FOR DELETE TO public USING (true);
          CREATE POLICY "flight_exceptions_允许公开更新" ON public.flight_exceptions FOR UPDATE TO public USING (true) WITH CHECK (true);
          CREATE POLICY "flight_exceptions_允许公开写入" ON public.flight_exceptions FOR INSERT TO public WITH CHECK (true);
          CREATE POLICY "flight_exceptions_允许公开读取" ON public.flight_exceptions FOR SELECT TO public;

          -- 刷新 PostgREST schema
          NOTIFY pgrst, 'reload schema';
        `
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({
        success: false,
        error: `执行 SQL 失败: ${response.status} - ${text}`,
        requiresManual: true,
        sql: getCreateTableSQL()
      }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      message: '表创建成功',
      data: result
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '执行失败',
      requiresManual: true,
      sql: getCreateTableSQL()
    }, { status: 500 });
  }
}

function getCreateTableSQL() {
  return `-- 请在 Supabase 控制台的 SQL Editor 中执行此脚本
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

    CREATE INDEX flight_exceptions_depart_date_idx ON public.flight_exceptions USING BTREE (depart_date ASC NULLS LAST);
    CREATE INDEX flight_exceptions_flight_date_idx ON public.flight_exceptions USING BTREE (flight_date ASC NULLS LAST);
    CREATE INDEX flight_exceptions_main_no_idx ON public.flight_exceptions USING BTREE (main_no ASC NULLS LAST);

    ALTER TABLE public.flight_exceptions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "flight_exceptions_允许公开删除" ON public.flight_exceptions;
    DROP POLICY IF EXISTS "flight_exceptions_允许公开更新" ON public.flight_exceptions;
    DROP POLICY IF EXISTS "flight_exceptions_允许公开写入" ON public.flight_exceptions;
    DROP POLICY IF EXISTS "flight_exceptions_允许公开读取" ON public.flight_exceptions;

    CREATE POLICY "flight_exceptions_允许公开删除" ON public.flight_exceptions FOR DELETE TO public USING (true);
    CREATE POLICY "flight_exceptions_允许公开更新" ON public.flight_exceptions FOR UPDATE TO public USING (true) WITH CHECK (true);
    CREATE POLICY "flight_exceptions_允许公开写入" ON public.flight_exceptions FOR INSERT TO public WITH CHECK (true);
    CREATE POLICY "flight_exceptions_允许公开读取" ON public.flight_exceptions FOR SELECT TO public;

    RAISE NOTICE '表 flight_exceptions 创建成功';
  ELSE
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

NOTIFY pgrst, 'reload schema';`;
}
