import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseCredentials } from '@/storage/database/supabase-client';

export async function POST() {
  const serviceRoleKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
  const { url } = getSupabaseCredentials();

  if (!serviceRoleKey) {
    return NextResponse.json({ success: false, error: '缺少 COZE_SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
  }

  const supabase = await import('@supabase/supabase-js');
  const adminClient = supabase.createClient(url, serviceRoleKey);

  // 创建表的 SQL
  const createTableSQL = `
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
      END IF;
    END $$;

    -- 刷新 PostgREST schema
    NOTIFY pgrst, 'reload schema';
  `;

  try {
    // 使用 Supabase 的直接 SQL 执行（通过 service role）
    const { data, error } = await adminClient.rpc('exec_sql', {
      query: createTableSQL
    });

    if (error) {
      // 如果 exec_sql 不存在，尝试其他方法
      throw new Error(`执行 SQL 失败: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: '表创建/检查成功，PostgREST schema 已刷新',
      data
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '执行 SQL 失败',
      suggestion: '请在 Supabase 控制台的 SQL Editor 中手动执行以下 SQL:\n\n' + createTableSQL
    }, { status: 500 });
  }
}
