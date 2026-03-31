import { NextRequest, NextResponse } from 'next/server';
import { volumeEstimateApi } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectDate = searchParams.get('collectDate');
    const warehouse = searchParams.get('warehouse');
    const checkPrevDay = searchParams.get('checkPrevDay');
    
    if (collectDate && warehouse) {
      if (checkPrevDay === 'true') {
        // 检查当天和前一天数据，根据 is_complete 决定使用哪个
        const data = await volumeEstimateApi.getByDateOrPrevDay(collectDate, warehouse);
        return NextResponse.json({ success: true, data });
      }
      const data = await volumeEstimateApi.getByDateAndWarehouse(collectDate, warehouse);
      return NextResponse.json({ success: true, data });
    }
    
    const data = await volumeEstimateApi.getAll();
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
    const data = await volumeEstimateApi.create(body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}
