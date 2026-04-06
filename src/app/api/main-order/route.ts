import { NextRequest, NextResponse } from 'next/server';
import { mainOrderApi, volumeEstimateApi } from '@/lib/db';

// 处理空字符串，转为null
function sanitizeData(body: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value === '') {
      result[key] = null;
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectDate = searchParams.get('collectDate');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const warehouse = searchParams.get('warehouse');
    const port = searchParams.get('port');
    const cargoType = searchParams.get('cargoType');
    const issueCard = searchParams.get('issueCard');
    const origin = searchParams.get('origin');
    const routeType = searchParams.get('routeType');
    const mainOrderNo = searchParams.get('mainOrderNo');
    const departStartDate = searchParams.get('departStartDate');
    const departEndDate = searchParams.get('departEndDate');

    // 支持单条件或多条件查询（包括日期范围）
    if (collectDate || warehouse || port || cargoType || issueCard || origin || routeType || mainOrderNo || departStartDate || departEndDate || (startDate && endDate)) {
      const data = await mainOrderApi.query({
        collectDate: collectDate || undefined,
        warehouse: warehouse || undefined,
        port: port || undefined,
        cargoType: cargoType || undefined,
        issueCard: issueCard || undefined,
        origin: origin || undefined,
        routeType: routeType || undefined,
        mainOrderNo: mainOrderNo || undefined,
        departStartDate: departStartDate || undefined,
        departEndDate: departEndDate || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      return NextResponse.json({ success: true, data });
    }

    // 查询全部
    const data = await mainOrderApi.getAll();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '查询失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await mainOrderApi.create(sanitizeData(body));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}
