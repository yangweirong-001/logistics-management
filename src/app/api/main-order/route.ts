import { NextRequest, NextResponse } from 'next/server';
import { mainOrderApi, volumeEstimateApi } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectDate = searchParams.get('collectDate');
    const warehouse = searchParams.get('warehouse');
    
    if (collectDate || warehouse) {
      const data = await mainOrderApi.query({
        collectDate: collectDate || undefined,
        warehouse: warehouse || undefined,
      });
      return NextResponse.json({ success: true, data });
    }
    
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
    const data = await mainOrderApi.create(body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}
