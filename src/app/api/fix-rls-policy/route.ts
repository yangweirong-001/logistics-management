import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: '请在 Supabase 控制台执行以下 SQL 来修复 RLS 策略',
    sql: `
-- ============================================================
-- 完整修复 flight_exceptions 表的 RLS 策略
-- 请在 Supabase 控制台的 SQL Editor 中执行此脚本
-- ============================================================

-- 步骤 1: 禁用 RLS（暂时）
ALTER TABLE public.flight_exceptions DISABLE ROW LEVEL SECURITY;

-- 步骤 2: 删除所有旧策略
DROP POLICY IF EXISTS "flight_exceptions_允许公开删除" ON public.flight_exceptions;
DROP POLICY IF EXISTS "flight_exceptions_允许公开更新" ON public.flight_exceptions;
DROP POLICY IF EXISTS "flight_exceptions_允许公开写入" ON public.flight_exceptions;
DROP POLICY IF EXISTS "flight_exceptions_允许公开读取" ON public.flight_exceptions;

-- 步骤 3: 重新启用 RLS
ALTER TABLE public.flight_exceptions ENABLE ROW LEVEL SECURITY;

-- 步骤 4: 创建正确的 RLS 策略
-- 注意：Permissive 策略需要同时设置 using 和 withCheck

-- DELETE 策略
CREATE POLICY "flight_exceptions_允许公开删除"
ON public.flight_exceptions
FOR DELETE
TO public
USING (true);

-- UPDATE 策略
CREATE POLICY "flight_exceptions_允许公开更新"
ON public.flight_exceptions
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- INSERT 策略（最关键！必须使用 WITH CHECK）
CREATE POLICY "flight_exceptions_允许公开写入"
ON public.flight_exceptions
FOR INSERT
TO public
WITH CHECK (true);

-- SELECT 策略
CREATE POLICY "flight_exceptions_允许公开读取"
ON public.flight_exceptions
FOR SELECT
TO public
USING (true);

-- 步骤 5: 验证策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'flight_exceptions'
AND schemaname = 'public';

-- 步骤 6: 测试插入
DO $$
BEGIN
  INSERT INTO public.flight_exceptions (depart_date, flight_date, flight_no, main_no, bills, origin, dest, exception_reason, remark)
  VALUES ('2024-01-01', '2024-01-01', 'RLS_FIX_TEST', 'RLS_FIX_MAIN_001', 1, 'CAN', 'NRT', 'RLS 修复测试', '测试');
  
  -- 如果插入成功，删除测试记录
  DELETE FROM public.flight_exceptions WHERE main_no = 'RLS_FIX_MAIN_001';
  
  RAISE NOTICE '✅ RLS 策略修复成功！现在可以正常插入数据了。';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ 错误: %', SQLERRM;
END $$;

-- 步骤 7: 刷新 PostgREST schema
NOTIFY pgrst, 'reload schema';
`
  });
}
