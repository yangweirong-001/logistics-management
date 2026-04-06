import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 诊断方数预估实际配置问题
 * GET /api/diagnose-volume-config?collectDate=2026-04-06&warehouse=加工区
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectDate = searchParams.get('collectDate');
    const warehouse = searchParams.get('warehouse');

    if (!collectDate || !warehouse) {
      return NextResponse.json(
        { error: '请提供 collectDate 和 warehouse 参数' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 1. 获取方数预估数据
    const { data: volumeData, error: volumeError } = await supabase
      .from('volume_estimates')
      .select('*')
      .eq('collect_date', collectDate)
      .eq('warehouse', warehouse)
      .maybeSingle();

    // 2. 获取该日期该仓库的所有主单
    const { data: mainOrders, error: mainOrdersError } = await supabase
      .from('main_orders')
      .select('*')
      .eq('collect_date', collectDate)
      .eq('warehouse', warehouse);

    // 3. 筛选空运主单
    const airOrders = mainOrders?.filter(o => o.route_type === '空运') || [];
    const seaAirOrders = mainOrders?.filter(o => o.route_type === '海空') || [];

    // 4. 计算已配置方数
    const configuredAirVolume = airOrders.reduce((sum, o) => sum + (parseFloat(o.actual_volume || '0') || 0), 0);
    const configuredSeaAirVolume = seaAirOrders.reduce((sum, o) => sum + (parseFloat(o.actual_volume || '0') || 0), 0);

    const result = {
      // 查询参数
      query: {
        collectDate,
        warehouse,
      },

      // 方数预估数据
      volumeEstimate: volumeData ? {
        id: volumeData.id,
        collect_date: volumeData.collect_date,
        warehouse: volumeData.warehouse,
        package_count: volumeData.package_count,
        total_volume: volumeData.total_volume,
      } : null,

      // 主单总数
      mainOrdersCount: mainOrders?.length || 0,

      // 空运主单详情
      airOrders: {
        count: airOrders.length,
        details: airOrders.map(o => ({
          id: o.id,
          main_no: o.main_no,
          route_type: o.route_type,
          actual_volume: o.actual_volume,
          collect_date: o.collect_date,
          warehouse: o.warehouse,
        })),
        totalVolume: configuredAirVolume,
      },

      // 海空主单详情
      seaAirOrders: {
        count: seaAirOrders.length,
        details: seaAirOrders.map(o => ({
          id: o.id,
          main_no: o.main_no,
          route_type: o.route_type,
          actual_volume: o.actual_volume,
          collect_date: o.collect_date,
          warehouse: o.warehouse,
        })),
        totalVolume: configuredSeaAirVolume,
      },

      // 其他主单（路由类型为空或其他）
      otherOrders: {
        count: mainOrders?.filter(o => !o.route_type || (o.route_type !== '空运' && o.route_type !== '海空')).length || 0,
        details: mainOrders?.filter(o => !o.route_type || (o.route_type !== '空运' && o.route_type !== '海空')).map(o => ({
          id: o.id,
          main_no: o.main_no,
          route_type: o.route_type || '未设置',
          actual_volume: o.actual_volume,
          collect_date: o.collect_date,
          warehouse: o.warehouse,
        })) || [],
      },

      // 汇总结果
      summary: {
        configuredAirVolume,
        configuredSeaAirVolume,
        totalConfiguredVolume: configuredAirVolume + configuredSeaAirVolume,
      },

      // 诊断建议
      recommendations: [] as string[],
    };

    // 生成诊断建议
    if (!mainOrders || mainOrders.length === 0) {
      result.recommendations.push('❌ 该日期该仓库没有主单数据');
    } else if (airOrders.length === 0 && seaAirOrders.length === 0) {
      result.recommendations.push('⚠️ 主单存在但没有设置路由类型（route_type）');
      result.recommendations.push('请在主单发放时填写"路由类型"字段（空运/海空）');
    } else if (configuredAirVolume === 0 && configuredSeaAirVolume === 0) {
      result.recommendations.push('⚠️ 主单已设置路由类型，但实际方数（actual_volume）为空');
      result.recommendations.push('请在主单发放时填写"实际方数"字段');
    } else {
      result.recommendations.push('✅ 数据正常，实际配置方数已正确计算');
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
