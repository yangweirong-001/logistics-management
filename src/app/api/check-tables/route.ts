import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const results = {
    checks: [] as Array<{ name: string; success: boolean; message: string; details?: any }>
  };

  try {
    // 使用 raw SQL 查询来检查表是否存在
    const { data: tableCheck, error: tableError } = await (await import('@/storage/database/supabase-client')).getSupabaseClient()
      .rpc('check_table_exists', { table_name: 'flight_exceptions' });

    if (tableError) {
      results.checks.push({
        name: '检查表是否存在',
        success: false,
        message: `查询失败: ${tableError.message} (Code: ${tableError.code})`
      });
    } else {
      results.checks.push({
        name: '检查表是否存在',
        success: true,
        message: '表存在检查结果',
        details: tableCheck
      });
    }

    // 尝试列出所有表
    const { data: tables, error: tablesError } = await (await import('@/storage/database/supabase-client')).getSupabaseClient()
      .from('pg_tables')
      .select('*')
      .eq('schemaname', 'public')
      .ilike('tablename', '%flight%');

    if (tablesError) {
      results.checks.push({
        name: '列出所有 flight 相关表',
        success: false,
        message: `查询失败: ${tablesError.message} (Code: ${tablesError.code})`
      });
    } else {
      results.checks.push({
        name: '列出所有 flight 相关表',
        success: true,
        message: `找到 ${tables?.length || 0} 个表`,
        details: tables
      });
    }

  } catch (error) {
    results.checks.push({
      name: '检查过程',
      success: false,
      message: error instanceof Error ? error.message : '未知错误',
      details: error
    });
  }

  return NextResponse.json(results);
}
