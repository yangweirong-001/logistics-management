import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

// 获取所有航班异常记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mainNo = searchParams.get('main_no');
    const flightDate = searchParams.get('flight_date');
    const departDate = searchParams.get('depart_date');

    let query = client.from('flight_exceptions').select('*').order('created_at', { ascending: false });

    if (mainNo) {
      query = query.eq('main_no', mainNo);
    }
    if (flightDate) {
      query = query.eq('flight_date', flightDate);
    }
    if (departDate) {
      query = query.eq('depart_date', departDate);
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询失败: ${error.message}`);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取航班异常记录失败:', error);
    return NextResponse.json({ success: false, error: '获取航班异常记录失败' }, { status: 500 });
  }
}

// 根据主单号获取主单信息
async function getMainOrderByMainNo(mainNo: string) {
  const { data, error } = await client
    .from('main_orders')
    .select('*')
    .eq('main_no', mainNo)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`查询主单失败: ${error.message}`);
  }

  return data;
}

// 创建航班异常记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mainNo, exceptionReason, remark } = body;

    if (!mainNo || !exceptionReason) {
      return NextResponse.json({ success: false, error: '主单号和异常原因必填' }, { status: 400 });
    }

    // 根据主单号获取主单信息
    const mainOrder = await getMainOrderByMainNo(mainNo);
    if (!mainOrder) {
      return NextResponse.json({ success: false, error: '未找到该主单号' }, { status: 404 });
    }

    // 创建航班异常记录
    const newRecord = {
      depart_date: mainOrder.depart_date || new Date().toISOString().split('T')[0],
      flight_date: mainOrder.actual_flight_date || mainOrder.depart_date || new Date().toISOString().split('T')[0],
      flight_no: mainOrder.flight_no || '未分配',
      main_no: mainNo,
      bills: mainOrder.actual_bills || 0,
      origin: mainOrder.origin || '未指定',
      transfer: mainOrder.transfer || null,
      dest: mainOrder.dest || '未指定',
      exception_reason: exceptionReason,
      remark: remark || '',
    };

    const { data, error } = await client.from('flight_exceptions').insert(newRecord).select().single();
    if (error) throw new Error(`创建失败: ${error.message}`);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('创建航班异常记录失败:', error);
    return NextResponse.json({ success: false, error: '创建航班异常记录失败' }, { status: 500 });
  }
}

// 更新航班异常记录
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, exceptionReason, remark } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID必填' }, { status: 400 });
    }

    const { data, error } = await client
      .from('flight_exceptions')
      .update({ exception_reason: exceptionReason, remark, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`更新失败: ${error.message}`);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新航班异常记录失败:', error);
    return NextResponse.json({ success: false, error: '更新航班异常记录失败' }, { status: 500 });
  }
}

// 删除航班异常记录
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID必填' }, { status: 400 });
    }

    const { error } = await client.from('flight_exceptions').delete().eq('id', id);
    if (error) throw new Error(`删除失败: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除航班异常记录失败:', error);
    return NextResponse.json({ success: false, error: '删除航班异常记录失败' }, { status: 500 });
  }
}
