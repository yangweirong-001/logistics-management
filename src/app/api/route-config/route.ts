import { NextRequest, NextResponse } from 'next/server';
import { routeConfigApi } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeType = searchParams.get('routeType');
    
    if (routeType) {
      const data = await routeConfigApi.getByRouteType(routeType);
      return NextResponse.json({ success: true, data });
    }
    
    const data = await routeConfigApi.getAll();
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
    const data = await routeConfigApi.create(body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}
