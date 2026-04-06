import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 诊断 API - 检查数据库连接和字段状态
 * GET /api/diagnose
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // 1. 获取当前数据库信息
    const { data: dbInfo, error: dbInfoError } = await supabase.rpc('version');
    
    // 2. 检查 main_orders 表的列信息
    const { data: columns, error: columnsError } = await supabase
      .from('main_orders')
      .select('*')
      .limit(1);

    // 3. 获取 Supabase URL（脱敏处理）
    const url = process.env.COZE_SUPABASE_URL || 'Not set';
    const maskedUrl = url.includes('://')
      ? url.split('://')[0] + '://' + url.split('://')[1].split('@')[0] + '@***'
      : '***';

    // 4. 检查是否有 issue_card 字段
    const hasIssueCard = columns && columns.length > 0 && 'issue_card' in columns[0];

    const result = {
      success: true,
      database: {
        supabaseUrl: maskedUrl,
        environment: process.env.COZE_PROJECT_ENV || 'DEV',
      },
      mainOrders: {
        tableExists: !columnsError,
        hasIssueCardColumn: hasIssueCard,
        sampleColumns: columns && columns.length > 0 ? Object.keys(columns[0]).sort() : [],
        sampleRecord: columns && columns.length > 0 ? columns[0] : null,
      },
      recommendations: hasIssueCard
        ? '✅ issue_card 字段存在，功能应该正常'
        : '❌ issue_card 字段不存在，需要手动添加或重新配置数据库',
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        supabaseUrl: process.env.COZE_SUPABASE_URL ? 'Set (masked)' : 'Not set',
      },
      { status: 500 }
    );
  }
}
