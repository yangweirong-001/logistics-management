import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseCredentials } from '@/storage/database/supabase-client';

export async function GET() {
  // 使用 service_role key 创建客户端（具有完全权限）
  const serviceRoleKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

  let adminClient: any = null;
  if (serviceRoleKey) {
    const { url } = getSupabaseCredentials();
    const supabase = await import('@supabase/supabase-js');
    adminClient = supabase.createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  const results = {
    checks: [] as Array<{ name: string; success: boolean; message: string; details?: any }>,
    hasServiceRole: !!serviceRoleKey
  };

  try {
    // 1. 使用 admin 客户端检查表是否存在
    if (adminClient) {
      const { data: tableInfo, error: tableError } = await adminClient
        .from('flight_exceptions')
        .select('*')
        .limit(1);

      if (tableError) {
        results.checks.push({
          name: '检查 flight_exceptions 表 (Admin)',
          success: false,
          message: `查询表失败: ${tableError.message} (Code: ${tableError.code})`
        });
      } else {
        results.checks.push({
          name: '检查 flight_exceptions 表 (Admin)',
          success: true,
          message: '表存在且可访问',
          details: tableInfo
        });
      }

      // 2. 使用 admin 客户端插入测试记录
      const testRecord = {
        depart_date: '2024-01-01',
        flight_date: '2024-01-01',
        flight_no: 'TEST001',
        main_no: 'TEST_MAIN_001',
        bills: 1,
        origin: 'CAN',
        transfer: null,
        dest: 'NRT',
        exception_reason: '测试异常',
        remark: '测试备注',
      };

      const { error: insertError, data: insertData } = await adminClient
        .from('flight_exceptions')
        .insert(testRecord)
        .select()
        .single();

      if (insertError) {
        results.checks.push({
          name: '插入测试记录 (Admin)',
          success: false,
          message: `插入失败: ${insertError.message} (Code: ${insertError.code}, Details: ${JSON.stringify(insertError.details)})`,
          details: insertError
        });
      } else {
        results.checks.push({
          name: '插入测试记录 (Admin)',
          success: true,
          message: '插入成功',
          details: insertData
        });

        // 3. 使用 anon 客户端读取测试记录（测试 RLS）
        const anonClient = getSupabaseClient();
        const { data: anonData, error: anonError } = await anonClient
          .from('flight_exceptions')
          .select('*')
          .eq('main_no', 'TEST_MAIN_001')
          .single();

        if (anonError) {
          results.checks.push({
            name: '读取测试记录 (Anon)',
            success: false,
            message: `读取失败: ${anonError.message} (Code: ${anonError.code})`,
            details: anonError
          });
        } else {
          results.checks.push({
            name: '读取测试记录 (Anon)',
            success: true,
            message: '读取成功',
            details: anonData
          });
        }

        // 删除测试记录
        await adminClient.from('flight_exceptions').delete().eq('main_no', 'TEST_MAIN_001');
      }
    } else {
      results.checks.push({
        name: 'Admin 客户端',
        success: false,
        message: '缺少 COZE_SUPABASE_SERVICE_ROLE_KEY 环境变量'
      });
    }

    // 4. 使用 anon 客户端检查
    const anonClient = getSupabaseClient();
    const { data: anonTableInfo, error: anonTableError } = await anonClient
      .from('flight_exceptions')
      .select('*')
      .limit(1);

    if (anonTableError) {
      results.checks.push({
        name: '检查 flight_exceptions 表 (Anon)',
        success: false,
        message: `查询表失败: ${anonTableError.message} (Code: ${anonTableError.code})`
      });
    } else {
      results.checks.push({
        name: '检查 flight_exceptions 表 (Anon)',
        success: true,
        message: '表存在且可访问',
        details: anonTableInfo
      });
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
