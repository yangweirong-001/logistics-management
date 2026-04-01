import { NextRequest, NextResponse } from 'next/server';
import { routeConfigApi } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { routes } = body;
    
    if (!Array.isArray(routes) || routes.length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供有效的路由数据' },
        { status: 400 }
      );
    }
    
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    
    for (const route of routes) {
      try {
        await routeConfigApi.create({
          flight_no: route.flight_no,
          origin: route.origin,
          transfer: route.transfer || null,
          dest: route.dest,
          depart_time: route.depart_time || null,
          arrive_time: route.arrive_time || null,
          is_next_day: route.is_next_day || null,
          second_flight: route.second_flight || null,
          route_type: route.route_type,
        });
        successCount++;
      } catch (err) {
        failCount++;
        errors.push(`航班号 ${route.flight_no}: ${err instanceof Error ? err.message : '导入失败'}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        total: routes.length,
        successCount,
        failCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '批量导入失败' },
      { status: 500 }
    );
  }
}
