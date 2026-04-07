import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseCredentials } from '@/storage/database/supabase-client';

export async function GET() {
  const serviceRoleKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;
  const { url } = getSupabaseCredentials();

  const results = {
    checks: [] as Array<{ name: string; success: boolean; message: string; details?: any }>
  };

  try {
    const supabase = await import('@supabase/supabase-js');

    // 1. 使用 anon 客户端检查表
    results.checks.push({
      name: 'Anon 客户端连接',
      success: !!anonKey,
      message: anonKey ? 'Anon key 存在' : 'Anon key 不存在'
    });

    const anonClient = supabase.createClient(url, anonKey || '');

    // 2. 尝试查询表
    const { data: anonData, error: anonError } = await anonClient
      .from('flight_exceptions')
      .select('*')
      .limit(1);

    results.checks.push({
      name: 'Anon 客户端查询',
      success: !anonError,
      message: anonError ? `查询失败: ${anonError.message} (Code: ${anonError.code})` : '查询成功',
      details: anonError || anonData
    });

    // 3. 尝试插入测试记录
    const testRecord = {
      depart_date: '2024-01-01',
      flight_date: '2024-01-01',
      flight_no: 'RLS_TEST_001',
      main_no: 'RLS_TEST_MAIN_001',
      bills: 1,
      origin: 'CAN',
      transfer: null,
      dest: 'NRT',
      exception_reason: 'RLS 策略测试',
      remark: '测试 RLS 策略是否允许插入',
    };

    const { error: insertError, data: insertData } = await anonClient
      .from('flight_exceptions')
      .insert(testRecord)
      .select()
      .single();

    if (insertError) {
      results.checks.push({
        name: 'Anon 客户端插入',
        success: false,
        message: `插入失败: ${insertError.message} (Code: ${insertError.code})`,
        details: {
          error: insertError,
          hint: insertError.hint,
          details: insertError.details
        }
      });
    } else {
      results.checks.push({
        name: 'Anon 客户端插入',
        success: true,
        message: '插入成功',
        details: insertData
      });

      // 删除测试记录
      await anonClient.from('flight_exceptions').delete().eq('main_no', 'RLS_TEST_MAIN_001');
    }

    // 4. 使用 service role 客户端检查
    if (serviceRoleKey) {
      const adminClient = supabase.createClient(url, serviceRoleKey);

      // 5. 查询当前 RLS 策略
      const { data: policies, error: policyError } = await adminClient
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'flight_exceptions');

      if (policyError) {
        results.checks.push({
          name: '查询 RLS 策略',
          success: false,
          message: `查询失败: ${policyError.message} (Code: ${policyError.code})`
        });
      } else {
        results.checks.push({
          name: '查询 RLS 策略',
          success: true,
          message: `找到 ${policies?.length || 0} 个策略`,
          details: policies
        });
      }

      // 6. 检查 RLS 是否启用
      const { data: rlsStatus, error: rlsError } = await adminClient
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', 'flight_exceptions')
        .eq('schemaname', 'public')
        .single();

      if (rlsError) {
        results.checks.push({
          name: '检查 RLS 状态',
          success: false,
          message: `查询失败: ${rlsError.message} (Code: ${rlsError.code})`
        });
      } else {
        results.checks.push({
          name: '检查 RLS 状态',
          success: true,
          message: `RLS 状态: ${rlsStatus?.rowsecurity ? '已启用' : '未启用'}`,
          details: rlsStatus
        });
      }
    }

  } catch (error) {
    results.checks.push({
      name: '诊断过程',
      success: false,
      message: error instanceof Error ? error.message : '未知错误',
      details: error
    });
  }

  return NextResponse.json(results);
}
