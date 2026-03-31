import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

// 区域参数配置
export const areaConfigApi = {
  async getAll() {
    const { data, error } = await client.from('area_configs').select('*').order('id');
    if (error) throw new Error(`查询失败: ${error.message}`);
    return data;
  },

  async create(config: Record<string, unknown>) {
    const { data, error } = await client.from('area_configs').insert(config).select();
    if (error) throw new Error(`创建失败: ${error.message}`);
    return data[0];
  },

  async update(id: number, config: Record<string, unknown>) {
    const { data, error } = await client.from('area_configs').update(config).eq('id', id).select();
    if (error) throw new Error(`更新失败: ${error.message}`);
    return data[0];
  },

  async delete(id: number) {
    const { error } = await client.from('area_configs').delete().eq('id', id);
    if (error) throw new Error(`删除失败: ${error.message}`);
  },

  async getByWarehouse(warehouse: string) {
    const { data, error } = await client.from('area_configs').select('*').eq('warehouse', warehouse).maybeSingle();
    if (error) throw new Error(`查询失败: ${error.message}`);
    return data;
  },
};

// 航班配置
export const flightConfigApi = {
  async getAll() {
    const { data, error } = await client.from('flight_configs').select('*').order('id');
    if (error) throw new Error(`查询失败: ${error.message}`);
    return data;
  },

  async create(config: Record<string, unknown>) {
    const { data, error } = await client.from('flight_configs').insert(config).select();
    if (error) throw new Error(`创建失败: ${error.message}`);
    return data[0];
  },

  async update(id: number, config: Record<string, unknown>) {
    const { data, error } = await client.from('flight_configs').update(config).eq('id', id).select();
    if (error) throw new Error(`更新失败: ${error.message}`);
    return data[0];
  },

  async delete(id: number) {
    const { error } = await client.from('flight_configs').delete().eq('id', id);
    if (error) throw new Error(`删除失败: ${error.message}`);
  },

  async getByWarehouseAndWeekday(warehouse: string, weekday: string) {
    const { data, error } = await client.from('flight_configs').select('*').eq('warehouse', warehouse).eq('weekday', weekday).maybeSingle();
    if (error) throw new Error(`查询失败: ${error.message}`);
    return data;
  },
};

// 目的港配置
export const portConfigApi = {
  async getAll() {
    const { data, error } = await client.from('port_configs').select('*').order('id');
    if (error) throw new Error(`查询失败: ${error.message}`);
    return data;
  },

  async create(config: Record<string, unknown>) {
    const { data, error } = await client.from('port_configs').insert(config).select();
    if (error) throw new Error(`创建失败: ${error.message}`);
    return data[0];
  },

  async update(id: number, config: Record<string, unknown>) {
    const { data, error } = await client.from('port_configs').update(config).eq('id', id).select();
    if (error) throw new Error(`更新失败: ${error.message}`);
    return data[0];
  },

  async delete(id: number) {
    const { error } = await client.from('port_configs').delete().eq('id', id);
    if (error) throw new Error(`删除失败: ${error.message}`);
  },
};

// 航空路由配置
export const routeConfigApi = {
  async getAll() {
    const { data, error } = await client.from('route_configs').select('*').order('id');
    if (error) throw new Error(`查询失败: ${error.message}`);
    return data;
  },

  async create(config: Record<string, unknown>) {
    const { data, error } = await client.from('route_configs').insert(config).select();
    if (error) throw new Error(`创建失败: ${error.message}`);
    return data[0];
  },

  async update(id: number, config: Record<string, unknown>) {
    const { data, error } = await client.from('route_configs').update(config).eq('id', id).select();
    if (error) throw new Error(`更新失败: ${error.message}`);
    return data[0];
  },

  async delete(id: number) {
    const { error } = await client.from('route_configs').delete().eq('id', id);
    if (error) throw new Error(`删除失败: ${error.message}`);
  },

  async getByRouteType(routeType: string) {
    const { data, error } = await client.from('route_configs').select('*').eq('route_type', routeType);
    if (error) throw new Error(`查询失败: ${error.message}`);
    return data;
  },
};

// 方数预估
export const volumeEstimateApi = {
  async getAll() {
    const { data, error } = await client.from('volume_estimates').select('*').order('collect_date', { ascending: false });
    if (error) throw new Error(`查询失败: ${error.message}`);
    return data;
  },

  async create(estimate: Record<string, unknown>) {
    const { data, error } = await client.from('volume_estimates').insert(estimate).select();
    if (error) throw new Error(`创建失败: ${error.message}`);
    return data[0];
  },

  async update(id: number, estimate: Record<string, unknown>) {
    const { data, error } = await client.from('volume_estimates').update(estimate).eq('id', id).select();
    if (error) throw new Error(`更新失败: ${error.message}`);
    return data[0];
  },

  async delete(id: number) {
    const { error } = await client.from('volume_estimates').delete().eq('id', id);
    if (error) throw new Error(`删除失败: ${error.message}`);
  },

  async getByDateAndWarehouse(collectDate: string, warehouse: string) {
    const { data, error } = await client.from('volume_estimates').select('*').eq('collect_date', collectDate).eq('warehouse', warehouse).maybeSingle();
    if (error) throw new Error(`查询失败: ${error.message}`);
    return data;
  },

  async getByDateOrPrevDay(collectDate: string, warehouse: string) {
    // 先查当天
    let data = await this.getByDateAndWarehouse(collectDate, warehouse);
    
    if (data) {
      // 如果当天有数据
      if (data.is_complete === '是') {
        // 货物袋数齐全，使用当天数据
        return data;
      } else {
        // 货物袋数不齐全，查找前一天
        const prevDate = this.getPrevDate(collectDate);
        const prevData = await this.getByDateAndWarehouse(prevDate, warehouse);
        return prevData || data;
      }
    } else {
      // 当天没有数据，查找前一天
      const prevDate = this.getPrevDate(collectDate);
      return await this.getByDateAndWarehouse(prevDate, warehouse);
    }
  },

  getPrevDate(dateStr: string) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  },

  async getByDateRange(startDate: string, endDate: string) {
    const { data, error } = await client.from('volume_estimates')
      .select('*')
      .gte('collect_date', startDate)
      .lte('collect_date', endDate)
      .order('collect_date', { ascending: false });
    if (error) throw new Error(`查询失败: ${error.message}`);
    return data;
  },
};

// 主单发放
export const mainOrderApi = {
  async getAll() {
    const { data, error } = await client.from('main_orders').select('*').order('collect_date', { ascending: false });
    if (error) throw new Error(`查询失败: ${error.message}`);
    return data;
  },

  async create(order: Record<string, unknown>) {
    const { data, error } = await client.from('main_orders').insert(order).select();
    if (error) throw new Error(`创建失败: ${error.message}`);
    return data[0];
  },

  async update(id: number, order: Record<string, unknown>) {
    const { data, error } = await client.from('main_orders').update(order).eq('id', id).select();
    if (error) throw new Error(`更新失败: ${error.message}`);
    return data[0];
  },

  async delete(id: number) {
    const { error } = await client.from('main_orders').delete().eq('id', id);
    if (error) throw new Error(`删除失败: ${error.message}`);
  },

  async query(params: { collectDate?: string; warehouse?: string }) {
    let query = client.from('main_orders').select('*');
    if (params.collectDate) {
      query = query.eq('collect_date', params.collectDate);
    }
    if (params.warehouse) {
      query = query.eq('warehouse', params.warehouse);
    }
    const { data, error } = await query.order('collect_date', { ascending: false });
    if (error) throw new Error(`查询失败: ${error.message}`);
    return data;
  },

  async getBalance(params: { collectDate: string; warehouse: string; port: string; cargoType: string }) {
    const { data, error } = await client.from('main_orders')
      .select('*')
      .eq('collect_date', params.collectDate)
      .eq('warehouse', params.warehouse)
      .eq('port', params.port)
      .eq('cargo_type', params.cargoType);
    if (error) throw new Error(`查询失败: ${error.message}`);
    return data;
  },
};
