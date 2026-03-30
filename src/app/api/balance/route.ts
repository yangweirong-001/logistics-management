import { NextRequest, NextResponse } from 'next/server';
import { mainOrderApi, volumeEstimateApi } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectDate = searchParams.get('collectDate');
    const warehouse = searchParams.get('warehouse');
    const port = searchParams.get('port');
    const cargoType = searchParams.get('cargoType');

    if (!collectDate || !warehouse || !port || !cargoType) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 获取当天的方数预估
    const estimate = await volumeEstimateApi.getByDateAndWarehouse(collectDate, warehouse);
    
    // 获取主单列表
    const orders = await mainOrderApi.getBalance({
      collectDate,
      warehouse,
      port,
      cargoType,
    });

    // 计算预估方数
    let estVolume = 0;
    if (estimate) {
      if (port === '关东' && cargoType === '普货') {
        estVolume = parseFloat(estimate.kanto_normal || '0');
      } else if (port === '关东' && cargoType === '特货') {
        estVolume = parseFloat(estimate.kanto_special || '0');
      } else if (port === '关西' && cargoType === '普货') {
        estVolume = parseFloat(estimate.kansai_normal || '0');
      } else if (port === '关西' && cargoType === '特货') {
        estVolume = parseFloat(estimate.kansai_special || '0');
      }
    }

    // 计算打货上限汇总
    const maxVolumeSum = orders.reduce((sum, order) => {
      return sum + parseFloat(order.max_volume || '0');
    }, 0);

    // 计算欠方/余方
    const balance = estVolume - maxVolumeSum;

    return NextResponse.json({
      success: true,
      data: {
        estVolume,
        maxVolume: maxVolumeSum,
        balance,
        isDeficit: balance > 0,
        isSurplus: balance < 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '查询失败' },
      { status: 500 }
    );
  }
}
