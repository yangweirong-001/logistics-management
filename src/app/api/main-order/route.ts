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
    const data = await mainOrderApi.create(sanitizeData(body));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}
