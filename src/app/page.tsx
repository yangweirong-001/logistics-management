'use client';

import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// 类型定义
interface AreaConfig {
  id: number;
  warehouse: string;
  package_volume: string;
  kanto_ratio: string;
  kansai_ratio: string;
  kanto_normal_ratio: string;
  kanto_special_ratio: string;
  kansai_normal_ratio: string;
  kansai_special_ratio: string;
}

interface FlightConfig {
  id: number;
  warehouse: string;
  weekday: string;
  kanto_normal: string | null;
  kansai_normal: string | null;
  kanto_special: string | null;
  kansai_special: string | null;
  remark: string | null;
}

interface PortConfig {
  id: number;
  port_code: string;
  region: string;
}

interface RouteConfig {
  id: number;
  flight_no: string;
  origin: string;
  transfer: string | null;
  dest: string;
  depart_time: string | null;
  arrive_time: string | null;
  is_next_day: string | null;
  second_flight: string | null;
  route_type: string;
}

interface VolumeEstimate {
  id: number;
  collect_date: string;
  weekday: string | null;
  warehouse: string;
  package_count: number;
  total_volume: number | null;
  kanto_total: number | null;
  kansai_total: number | null;
  kanto_normal: number | null;
  kanto_special: number | null;
  kansai_normal: number | null;
  kansai_special: number | null;
  air_volume: number | null;
  sea_air_volume: number | null;
  weight: number | null;
  is_complete: string | null;
}

interface MainOrder {
  id: number;
  collect_date: string;
  collect_weekday: string | null;
  depart_date: string | null;
  depart_weekday: string | null;
  warehouse: string;
  cargo_type: string;
  port: string;
  category: string | null;
  status: string | null;
  pack_req: string | null;
  max_volume: string | null;
  max_pieces: number | null;
  est_volume: string | null;
  est_pieces: number | null;
  route_type: string | null;
  req_flight_date: string | null;
  actual_flight_date: string | null;
  main_no: string | null;
  flight_no: string | null;
  origin: string | null;
  transfer: string | null;
  dest: string | null;
  second_flight: string | null;
  depart_time: string | null;
  arrive_time: string | null;
  actual_pieces: number | null;
  actual_weight: string | null;
  actual_volume: string | null;
  actual_bills: number | null;
  remark: string | null;
}

// 工具函数
const getWeekday = (dateStr: string) => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const date = new Date(dateStr);
  return weekdays[date.getDay()];
};

const addDays = (dateStr: string, days: number) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// 格式化时间为 HH:mm
const formatTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return '';
  const cleanTime = timeStr.trim();

  // 尝试解析 HH:mm:ss 格式，只取 HH:mm
  const timeMatch = cleanTime.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}(?:\.\d+)?))?$/);
  if (timeMatch) {
    const hours = String(parseInt(timeMatch[1])).padStart(2, '0');
    const minutes = String(parseInt(timeMatch[2])).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // 尝试解析纯数字时间（Excel 时间格式，如 20.37）
  const numMatch = cleanTime.match(/^(\d{1,2})\.(\d{2})$/);
  if (numMatch) {
    const hours = String(parseInt(numMatch[1])).padStart(2, '0');
    const minutes = String(parseInt(numMatch[2])).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  return cleanTime;
};

// 导出Excel功能
const exportToExcel = (data: MainOrder[], filename: string) => {
  // 定义列标题和对应的字段
  const headers = [
    '揽收日期', '揽收星期', '发货日期', '发货星期', '仓库', '货物属性', '口岸', '类别',
    '状态', '打包要求', '打货上限方数', '打货上限件数', '预估方数', '预估件数',
    '路由类型', '需求航班日期', '实际航班日期', '主单号', '航班号', '起飞港',
    '中转港', '目的港', '起飞时间', '到港时间', '实际件数', '实际重量', '实际方数',
    '实际票数', '备注'
  ];
  
  // 转换数据
  const rows = data.map(order => [
    order.collect_date || '',
    order.collect_weekday || '',
    order.depart_date || '',
    order.depart_weekday || '',
    order.warehouse || '',
    order.cargo_type || '',
    order.port || '',
    order.category || '',
    order.status || '',
    order.pack_req || '',
    order.max_volume || '',
    order.max_pieces?.toString() || '',
    order.est_volume || '',
    order.est_pieces?.toString() || '',
    order.route_type || '',
    order.req_flight_date || '',
    order.actual_flight_date || '',
    order.main_no || '',
    order.flight_no || '',
    order.origin || '',
    order.transfer || '',
    order.dest || '',
    formatTime(order.depart_time),
    formatTime(order.arrive_time),
    order.actual_pieces?.toString() || '',
    order.actual_weight || '',
    order.actual_volume || '',
    order.actual_bills?.toString() || '',
    order.remark || ''
  ]);
  
  // 创建CSV内容（Excel兼容）
  const BOM = '\uFEFF'; // UTF-8 BOM，确保Excel正确识别中文
  const csvContent = BOM + [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  // 创建Blob并下载
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function LogisticsManagement() {
  const [activeTab, setActiveTab] = useState('config-area');
  
  // 数据状态
  const [areaConfigs, setAreaConfigs] = useState<AreaConfig[]>([]);
  const [flightConfigs, setFlightConfigs] = useState<FlightConfig[]>([]);
  const [portConfigs, setPortConfigs] = useState<PortConfig[]>([]);
  const [routeConfigs, setRouteConfigs] = useState<RouteConfig[]>([]);
  const [volumeEstimates, setVolumeEstimates] = useState<VolumeEstimate[]>([]);
  const [mainOrders, setMainOrders] = useState<MainOrder[]>([]);
  
  // 方数预估计算结果
  const [volumeResult, setVolumeResult] = useState<{
    totalVolume: number;
    kantoTotal: number;
    kansaiTotal: number;
    kantoNormal: number;
    kantoSpecial: number;
    kansaiNormal: number;
    kansaiSpecial: number;
    airVolume: number;
    seaAirVolume: number;
  } | null>(null);
  
  // 模态框状态
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [flightModalOpen, setFlightModalOpen] = useState(false);
  const [portModalOpen, setPortModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [volumeHistoryOpen, setVolumeHistoryOpen] = useState(false);
  const [orderListOpen, setOrderListOpen] = useState(false);
  
  // 搜索状态
  const [flightSearchQuery, setFlightSearchQuery] = useState('');
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  
  // 多选状态
  const [selectedRouteIds, setSelectedRouteIds] = useState<Set<number>>(new Set());
  
  // 文件上传 ref
  const routeImportRef = useRef<HTMLInputElement>(null);
  
  // 编辑状态
  const [editingArea, setEditingArea] = useState<AreaConfig | null>(null);
  const [editingFlight, setEditingFlight] = useState<FlightConfig | null>(null);
  const [editingPort, setEditingPort] = useState<PortConfig | null>(null);
  const [editingRoute, setEditingRoute] = useState<RouteConfig | null>(null);
  const [editingOrder, setEditingOrder] = useState<MainOrder | null>(null);
  const [editingVolume, setEditingVolume] = useState<VolumeEstimate | null>(null);
  
  // 方数预估表单
  const [volumeForm, setVolumeForm] = useState({
    collect_date: '',
    warehouse: '',
    package_count: 0,
    weight: 0,
    is_complete: '是',
  });
  
  // 主单表单
  const [orderForm, setOrderForm] = useState({
    collect_date: '',
    depart_date: '',
    warehouse: '',
    cargo_type: '',
    port: '',
    status: '',
    pack_req: '',
    max_volume: '',
    route_type: '',
    actual_flight_date: '',
    main_no: '',
    flight_no: '',
    origin: '',
    transfer: '',
    dest: '',
    second_flight: '',
    depart_time: '',
    arrive_time: '',
    actual_pieces: '',
    actual_weight: '',
    actual_volume: '',
    actual_bills: '',
    remark: '',
  });
  
  // 欠方余方查询
  const [balanceQuery, setBalanceQuery] = useState({
    collect_date: '',
    warehouse: '全部',
    port: '全部',
    cargo_type: '全部',
  });
  const [balanceResults, setBalanceResults] = useState<Array<{
    warehouse: string;
    port: string;
    cargo_type: string;
    estVolume: number;
    maxVolume: number;
    deficit: number;
    surplus: number;
  }>>([]);

  // 格式化日期时间
  const formatDateTime = (dateStr: string | null | undefined, timeStr: string | null | undefined): string => {
    if (!dateStr) return formatTime(timeStr);
    if (!timeStr) return dateStr;
    return `${dateStr} ${formatTime(timeStr)}`;
  };

  // 主单查询条件
  const [orderQueryStartDate, setOrderQueryStartDate] = useState('');
  const [orderQueryEndDate, setOrderQueryEndDate] = useState('');
  const [orderQueryWarehouse, setOrderQueryWarehouse] = useState('全部');
  const [orderQueryOrigin, setOrderQueryOrigin] = useState('全部');
  const [orderQueryRouteType, setOrderQueryRouteType] = useState('全部');
  const [uniqueOrigins, setUniqueOrigins] = useState<string[]>([]);

  // 方数预估筛选条件
  const [volumeFilterStartDate, setVolumeFilterStartDate] = useState('');
  const [volumeFilterEndDate, setVolumeFilterEndDate] = useState('');
  const [volumeFilterWarehouse, setVolumeFilterWarehouse] = useState('全部');

  // 全局保存加载状态
  const [saving, setSaving] = useState(false);
  
  // 加载数据
  const loadAreaConfigs = async () => {
    const res = await fetch('/api/area-config');
    const data = await res.json();
    if (data.success) setAreaConfigs(data.data);
  };
  
  const loadFlightConfigs = async () => {
    const res = await fetch('/api/flight-config');
    const data = await res.json();
    if (data.success) setFlightConfigs(data.data);
  };
  
  const loadPortConfigs = async () => {
    const res = await fetch('/api/port-config');
    const data = await res.json();
    if (data.success) setPortConfigs(data.data);
  };
  
  const loadRouteConfigs = async () => {
    const res = await fetch('/api/route-config');
    const data = await res.json();
    if (data.success) {
      setRouteConfigs(data.data);
      // 提取唯一的始发值
      const origins: string[] = data.data
        .map((r: RouteConfig) => r.origin)
        .filter((o: string | null): o is string => Boolean(o));
      const uniqueOrigins = [...new Set(origins)];
      setUniqueOrigins(uniqueOrigins);
    }
  };
  
  const loadVolumeEstimates = async () => {
    const res = await fetch('/api/volume-estimate');
    const data = await res.json();
    if (data.success) setVolumeEstimates(data.data);
  };
  
  const loadMainOrders = async () => {
    const res = await fetch('/api/main-order');
    const data = await res.json();
    if (data.success) setMainOrders(data.data);
  };
  
  const loadMainOrdersWithFilter = async (collectDate?: string) => {
    let url = '/api/main-order';
    if (collectDate) {
      url += `?collectDate=${collectDate}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) setMainOrders(data.data);
  };
  
  // 主单查询
  const queryMainOrders = async () => {
    let url = '/api/main-order';
    const params = new URLSearchParams();

    // 日期范围筛选
    if (orderQueryStartDate && orderQueryEndDate) {
      params.append('startDate', orderQueryStartDate);
      params.append('endDate', orderQueryEndDate);
    } else if (orderQueryStartDate) {
      params.append('collectDate', orderQueryStartDate);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      let results = data.data;

      // 前端过滤仓库
      if (orderQueryWarehouse && orderQueryWarehouse !== '全部') {
        results = results.filter((o: MainOrder) => o.warehouse === orderQueryWarehouse);
      }

      // 前端过滤始发
      if (orderQueryOrigin && orderQueryOrigin !== '全部') {
        results = results.filter((o: MainOrder) => o.origin === orderQueryOrigin);
      }

      // 前端过滤路由类型
      if (orderQueryRouteType && orderQueryRouteType !== '全部') {
        results = results.filter((o: MainOrder) => o.route_type === orderQueryRouteType);
      }

      setMainOrders(results);
    }
  };
  
  const filterOrders = (collectDate: string, warehouse: string, port: string, cargoType: string) => {
    let filtered = mainOrders;
    if (collectDate) {
      filtered = filtered.filter(o => o.collect_date === collectDate);
    }
    if (warehouse && warehouse !== '全部') {
      filtered = filtered.filter(o => o.warehouse === warehouse);
    }
    if (port && port !== '全部') {
      filtered = filtered.filter(o => o.port === port);
    }
    if (cargoType && cargoType !== '全部') {
      filtered = filtered.filter(o => o.cargo_type === cargoType);
    }
    setMainOrders(filtered);
  };
  
  // 初始加载
  useEffect(() => {
    loadAreaConfigs();
    loadFlightConfigs();
    loadPortConfigs();
    loadRouteConfigs();
    loadVolumeEstimates();
    loadMainOrders();
   
  }, []);
  
  // 监听volumeForm变化，自动计算（延迟执行避免频繁计算）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (volumeForm.warehouse && volumeForm.package_count > 0 && volumeForm.collect_date && areaConfigs.length > 0) {
        const areaConfig = areaConfigs.find(a => a.warehouse === volumeForm.warehouse);
        if (areaConfig) {
          try {
            const packageVolume = parseFloat(areaConfig.package_volume) || 0;
            const packageCount = volumeForm.package_count || 0;
            const totalVolume = packageVolume * packageCount;
            
            const kantoRatio = (parseFloat(areaConfig.kanto_ratio) || 0) / 100;
            const kansaiRatio = (parseFloat(areaConfig.kansai_ratio) || 0) / 100;
            const kantoNormalRatio = (parseFloat(areaConfig.kanto_normal_ratio) || 0) / 100;
            const kantoSpecialRatio = (parseFloat(areaConfig.kanto_special_ratio) || 0) / 100;
            const kansaiNormalRatio = (parseFloat(areaConfig.kansai_normal_ratio) || 0) / 100;
            const kansaiSpecialRatio = (parseFloat(areaConfig.kansai_special_ratio) || 0) / 100;
            
            const kantoTotal = totalVolume * kantoRatio;
            const kansaiTotal = totalVolume * kansaiRatio;
            const kantoNormal = kantoTotal * kantoNormalRatio;
            const kantoSpecial = kantoTotal * kantoSpecialRatio;
            const kansaiNormal = kansaiTotal * kansaiNormalRatio;
            const kansaiSpecial = kansaiTotal * kansaiSpecialRatio;
            
            const weekday = getWeekday(volumeForm.collect_date);
            const flightConfig = flightConfigs.find(f => f.warehouse === volumeForm.warehouse && f.weekday === weekday);
            
            let airVolume = 0;
            let seaAirVolume = 0;
            
            if (flightConfig) {
              if (flightConfig.kanto_normal === '空运') airVolume += kantoNormal;
              else if (flightConfig.kanto_normal === '海空') seaAirVolume += kantoNormal;
              if (flightConfig.kanto_special === '空运') airVolume += kantoSpecial;
              else if (flightConfig.kanto_special === '海空') seaAirVolume += kantoSpecial;
              if (flightConfig.kansai_normal === '空运') airVolume += kansaiNormal;
              else if (flightConfig.kansai_normal === '海空') seaAirVolume += kansaiNormal;
              if (flightConfig.kansai_special === '空运') airVolume += kansaiSpecial;
              else if (flightConfig.kansai_special === '海空') seaAirVolume += kansaiSpecial;
            }
            
            setVolumeResult({
              totalVolume,
              kantoTotal,
              kansaiTotal,
              kantoNormal,
              kantoSpecial,
              kansaiNormal,
              kansaiSpecial,
              airVolume,
              seaAirVolume,
            });
          } catch {
            setVolumeResult(null);
          }
        } else {
          setVolumeResult(null);
        }
      } else {
        setVolumeResult(null);
      }
    }, 100);
    
    return () => clearTimeout(timer);
   
  }, [volumeForm.collect_date, volumeForm.warehouse, volumeForm.package_count, areaConfigs, flightConfigs]);
  
  // 监听主单表单航班信息变化，自动匹配路由填充时间
  useEffect(() => {
    const { flight_no, origin, dest } = orderForm;
    
    // 必填字段校验
    if (!flight_no || !origin || !dest) return;
    
    const transfer = (orderForm.transfer || '').trim();
    
    // 查找匹配的路由
    const matchedRoute = routeConfigs.find(r => {
      const routeTransfer = (r.transfer || '').trim();
      // 中转站匹配：两边都为空（包括 '-'）视为匹配
      const transferMatch = 
        (routeTransfer === '' || routeTransfer === '-') && 
        (transfer === '' || transfer === '-') 
          ? true 
          : routeTransfer === transfer;
      
      return (
        r.flight_no === flight_no &&
        r.origin === origin &&
        transferMatch &&
        r.dest === dest
      );
    });
    
    if (matchedRoute) {
      console.log('匹配到路由:', matchedRoute);
      setOrderForm(prev => ({
        ...prev,
        second_flight: matchedRoute.second_flight || '',
        depart_time: matchedRoute.depart_time || '',
        arrive_time: matchedRoute.arrive_time || '',
      }));
    } else {
      console.log('未匹配到路由', { flight_no, origin, transfer, dest, routeConfigs: routeConfigs.length });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderForm.flight_no, orderForm.origin, orderForm.transfer, orderForm.dest, routeConfigs]);
  
  // 区域参数配置操作
  const saveAreaConfig = async (formData: FormData) => {
    // 大包预估体积保留12位小数
    const packageVolumeValue = parseFloat(formData.get('package_volume') as string) || 0;
    
    // 占比字段处理：空字符串转为 0，保留2位小数
    const parseRatio = (value: string) => {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
    };
    
    const data = {
      warehouse: formData.get('warehouse') as string,
      package_volume: packageVolumeValue.toFixed(12),
      kanto_ratio: parseRatio(formData.get('kanto_ratio') as string),
      kansai_ratio: parseRatio(formData.get('kansai_ratio') as string),
      kanto_normal_ratio: parseRatio(formData.get('kanto_normal_ratio') as string),
      kanto_special_ratio: parseRatio(formData.get('kanto_special_ratio') as string),
      kansai_normal_ratio: parseRatio(formData.get('kansai_normal_ratio') as string),
      kansai_special_ratio: parseRatio(formData.get('kansai_special_ratio') as string),
    };
    
    try {
      setSaving(true);
      let response;
      if (editingArea) {
        response = await fetch(`/api/area-config/${editingArea.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch('/api/area-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      const result = await response.json();
      if (!result.success) {
        alert('保存失败: ' + (result.error || '未知错误'));
        return;
      }
      setAreaModalOpen(false);
      setEditingArea(null);
      loadAreaConfigs();
    } catch (err) {
      alert('保存失败: ' + (err instanceof Error ? err.message : '网络错误'));
    } finally {
      setSaving(false);
    }
  };
  
  const deleteAreaConfig = async (id: number) => {
    if (confirm('确定删除此配置？')) {
      const response = await fetch(`/api/area-config/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) {
        alert('删除失败: ' + (result.error || '未知错误'));
        return;
      }
      loadAreaConfigs();
    }
  };
  
  // 航班配置操作
  const saveFlightConfig = async (formData: FormData) => {
    const data = {
      warehouse: formData.get('warehouse') as string,
      weekday: formData.get('weekday') as string,
      kanto_normal: formData.get('kanto_normal') as string,
      kansai_normal: formData.get('kansai_normal') as string,
      kanto_special: formData.get('kanto_special') as string,
      kansai_special: formData.get('kansai_special') as string,
      remark: formData.get('remark') as string,
    };
    
    try {
      setSaving(true);
      let response;
      if (editingFlight) {
        response = await fetch(`/api/flight-config/${editingFlight.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch('/api/flight-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      const result = await response.json();
      if (!result.success) {
        alert('保存失败: ' + (result.error || '未知错误'));
        return;
      }
      setFlightModalOpen(false);
      setEditingFlight(null);
      loadFlightConfigs();
    } catch (err) {
      alert('保存失败: ' + (err instanceof Error ? err.message : '网络错误'));
    } finally {
      setSaving(false);
    }
  };
  
  const deleteFlightConfig = async (id: number) => {
    if (confirm('确定删除此配置？')) {
      const response = await fetch(`/api/flight-config/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) {
        alert('删除失败: ' + (result.error || '未知错误'));
        return;
      }
      loadFlightConfigs();
    }
  };
  
  // 目的港配置操作
  const savePortConfig = async (formData: FormData) => {
    const data = {
      port_code: formData.get('port_code') as string,
      region: formData.get('region') as string,
    };
    
    try {
      setSaving(true);
      let response;
      if (editingPort) {
        response = await fetch(`/api/port-config/${editingPort.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch('/api/port-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      const result = await response.json();
      if (!result.success) {
        alert('保存失败: ' + (result.error || '未知错误'));
        return;
      }
      setPortModalOpen(false);
      setEditingPort(null);
      loadPortConfigs();
    } catch (err) {
      alert('保存失败: ' + (err instanceof Error ? err.message : '网络错误'));
    } finally {
      setSaving(false);
    }
  };
  
  const deletePortConfig = async (id: number) => {
    if (confirm('确定删除此配置？')) {
      const response = await fetch(`/api/port-config/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) {
        alert('删除失败: ' + (result.error || '未知错误'));
        return;
      }
      loadPortConfigs();
    }
  };
  
  // 航空路由配置操作
  const saveRouteConfig = async (formData: FormData) => {
    const data = {
      flight_no: formData.get('flight_no') as string,
      origin: formData.get('origin') as string,
      transfer: formData.get('transfer') as string,
      dest: formData.get('dest') as string,
      depart_time: formData.get('depart_time') as string,
      arrive_time: formData.get('arrive_time') as string,
      is_next_day: formData.get('is_next_day') as string,
      second_flight: formData.get('second_flight') as string,
      route_type: formData.get('route_type') as string,
    };
    
    try {
      setSaving(true);
      let response;
      if (editingRoute) {
        response = await fetch(`/api/route-config/${editingRoute.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch('/api/route-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      const result = await response.json();
      if (!result.success) {
        alert('保存失败: ' + (result.error || '未知错误'));
        return;
      }
      setRouteModalOpen(false);
      setEditingRoute(null);
      loadRouteConfigs();
    } catch (err) {
      alert('保存失败: ' + (err instanceof Error ? err.message : '网络错误'));
    } finally {
      setSaving(false);
    }
  };
  
  const deleteRouteConfig = async (id: number) => {
    if (confirm('确定删除此配置？')) {
      const response = await fetch(`/api/route-config/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) {
        alert('删除失败: ' + (result.error || '未知错误'));
        return;
      }
      loadRouteConfigs();
    }
  };
  
  // 路由配置多选操作
  const toggleRouteSelection = (id: number) => {
    setSelectedRouteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const toggleAllRoutes = () => {
    if (selectedRouteIds.size === routeConfigs.length) {
      setSelectedRouteIds(new Set());
    } else {
      setSelectedRouteIds(new Set(routeConfigs.map(r => r.id)));
    }
  };
  
  const deleteSelectedRoutes = async () => {
    if (selectedRouteIds.size === 0) {
      alert('请先选择要删除的记录');
      return;
    }
    if (!confirm(`确定删除选中的 ${selectedRouteIds.size} 条记录？`)) return;
    
    setSaving(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const id of selectedRouteIds) {
      try {
        const response = await fetch(`/api/route-config/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }
    
    setSaving(false);
    setSelectedRouteIds(new Set());
    loadRouteConfigs();
    
    if (failCount > 0) {
      alert(`删除完成：成功 ${successCount} 条，失败 ${failCount} 条`);
    }
  };
  
  // Excel 批量导入路由配置
  const handleRouteImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 解析Excel时间格式（数字转时间字符串）
    const parseExcelTime = (value: unknown): string => {
      if (value === null || value === undefined || value === '') return '';
      
      // 如果已经是字符串，直接返回
      if (typeof value === 'string') return value.trim();
      
      // 如果是数字，转换为时间格式
      if (typeof value === 'number') {
        const totalMinutes = Math.round(value * 24 * 60);
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
      
      return String(value);
    };
    
    try {
      setSaving(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as Record<string, unknown>[];
      
      if (jsonData.length === 0) {
        alert('Excel 文件为空或格式不正确');
        return;
      }
      
      // 转换数据格式
      const routes = jsonData.map((row) => ({
        flight_no: String(row['航班号'] || row['flight_no'] || ''),
        origin: String(row['始发'] || row['origin'] || ''),
        transfer: String(row['中转'] || row['transfer'] || ''),
        dest: String(row['目的'] || row['dest'] || ''),
        depart_time: parseExcelTime(row['起飞时间'] || row['depart_time']),
        arrive_time: parseExcelTime(row['落地时间'] || row['arrive_time']),
        is_next_day: String(row['是否隔天'] || row['is_next_day'] || ''),
        second_flight: String(row['二程航班'] || row['第二程航班'] || row['second_flight'] || ''),
        route_type: String(row['路由'] || row['route_type'] || '空运'),
      })).filter(r => r.flight_no && r.origin && r.dest && r.route_type);
      
      if (routes.length === 0) {
        alert('未找到有效数据，请检查 Excel 格式');
        return;
      }
      
      const response = await fetch('/api/route-config/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`导入完成！成功 ${result.data.successCount} 条，失败 ${result.data.failCount} 条`);
        loadRouteConfigs();
      } else {
        alert('导入失败: ' + (result.error || '未知错误'));
      }
    } catch (err) {
      alert('导入失败: ' + (err instanceof Error ? err.message : '文件解析错误'));
    } finally {
      setSaving(false);
      // 重置文件输入
      if (routeImportRef.current) {
        routeImportRef.current.value = '';
      }
    }
  };
  
  // 保存方数预估
  const saveVolumeEstimate = async () => {
    if (!volumeForm.warehouse || !volumeForm.package_count || !volumeForm.collect_date) {
      alert('请填写完整信息');
      return;
    }
    
    if (!volumeForm.is_complete) {
      alert('请选择货物袋数是否齐全');
      return;
    }
    
    const areaConfig = areaConfigs.find(a => a.warehouse === volumeForm.warehouse);
    if (!areaConfig) {
      alert('请先配置该仓库的区域参数');
      return;
    }
    
    setSaving(true);
    
    const packageVolume = parseFloat(areaConfig.package_volume);
    const packageCount = volumeForm.package_count;
    const totalVolume = packageVolume * packageCount;
    
    const kantoRatio = parseFloat(areaConfig.kanto_ratio) / 100;
    const kansaiRatio = parseFloat(areaConfig.kansai_ratio) / 100;
    const kantoNormalRatio = parseFloat(areaConfig.kanto_normal_ratio) / 100;
    const kantoSpecialRatio = parseFloat(areaConfig.kanto_special_ratio) / 100;
    const kansaiNormalRatio = parseFloat(areaConfig.kansai_normal_ratio) / 100;
    const kansaiSpecialRatio = parseFloat(areaConfig.kansai_special_ratio) / 100;
    
    const kantoTotal = totalVolume * kantoRatio;
    const kansaiTotal = totalVolume * kansaiRatio;
    const kantoNormal = kantoTotal * kantoNormalRatio;
    const kantoSpecial = kantoTotal * kantoSpecialRatio;
    const kansaiNormal = kansaiTotal * kansaiNormalRatio;
    const kansaiSpecial = kansaiTotal * kansaiSpecialRatio;
    
    const weekday = getWeekday(volumeForm.collect_date);
    const flightConfig = flightConfigs.find(f => f.warehouse === volumeForm.warehouse && f.weekday === weekday);
    
    let airVolume = 0;
    let seaAirVolume = 0;
    
    if (flightConfig) {
      if (flightConfig.kanto_normal === '空运') airVolume += kantoNormal;
      else if (flightConfig.kanto_normal === '海空') seaAirVolume += kantoNormal;
      if (flightConfig.kanto_special === '空运') airVolume += kantoSpecial;
      else if (flightConfig.kanto_special === '海空') seaAirVolume += kantoSpecial;
      if (flightConfig.kansai_normal === '空运') airVolume += kansaiNormal;
      else if (flightConfig.kansai_normal === '海空') seaAirVolume += kansaiNormal;
      if (flightConfig.kansai_special === '空运') airVolume += kansaiSpecial;
      else if (flightConfig.kansai_special === '海空') seaAirVolume += kansaiSpecial;
    }
    
    try {
      if (editingVolume) {
        const response = await fetch(`/api/volume-estimate/${editingVolume.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collect_date: volumeForm.collect_date,
            weekday,
            warehouse: volumeForm.warehouse,
            package_count: volumeForm.package_count,
            total_volume: totalVolume.toFixed(3),
            kanto_total: kantoTotal.toFixed(3),
            kansai_total: kansaiTotal.toFixed(3),
            kanto_normal: kantoNormal.toFixed(3),
            kanto_special: kantoSpecial.toFixed(3),
            kansai_normal: kansaiNormal.toFixed(3),
            kansai_special: kansaiSpecial.toFixed(3),
            air_volume: airVolume.toFixed(3),
            sea_air_volume: seaAirVolume.toFixed(3),
            weight: volumeForm.weight ? truncateToDecimals(volumeForm.weight, 2) : null,
            is_complete: volumeForm.is_complete,
          }),
        });
        const result = await response.json();
        if (!result.success) {
          alert('保存失败: ' + (result.error || '未知错误'));
          return;
        }
      } else {
        const response = await fetch('/api/volume-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collect_date: volumeForm.collect_date,
            weekday,
            warehouse: volumeForm.warehouse,
            package_count: volumeForm.package_count,
            total_volume: totalVolume.toFixed(3),
            kanto_total: kantoTotal.toFixed(3),
            kansai_total: kansaiTotal.toFixed(3),
            kanto_normal: kantoNormal.toFixed(3),
            kanto_special: kantoSpecial.toFixed(3),
            kansai_normal: kansaiNormal.toFixed(3),
            kansai_special: kansaiSpecial.toFixed(3),
            air_volume: airVolume.toFixed(3),
            sea_air_volume: seaAirVolume.toFixed(3),
            weight: volumeForm.weight ? truncateToDecimals(volumeForm.weight, 2) : null,
            is_complete: volumeForm.is_complete,
          }),
        });
        const result = await response.json();
        if (!result.success) {
          alert('保存失败: ' + (result.error || '未知错误'));
          return;
        }
      }
      
      loadVolumeEstimates();
      setEditingVolume(null);
      setVolumeForm({ collect_date: '', warehouse: '', package_count: 0, weight: 0, is_complete: '是' });
      setVolumeResult(null);
      alert('保存成功！');
    } catch (err) {
      alert('保存失败: ' + (err instanceof Error ? err.message : '网络错误'));
    } finally {
      setSaving(false);
    }
  };
  
  // 编辑方数预估记录
  const editVolumeEstimate = (record: VolumeEstimate) => {
    setEditingVolume(record);
    setVolumeForm({
      collect_date: record.collect_date,
      warehouse: record.warehouse,
      package_count: record.package_count,
      weight: record.weight || 0,
      is_complete: record.is_complete || '是',
    });
  };
  
  // 删除方数预估记录
  const deleteVolumeEstimate = async (id: number) => {
    if (confirm('确定删除此记录？')) {
      const response = await fetch(`/api/volume-estimate/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) {
        alert('删除失败: ' + (result.error || '未知错误'));
        return;
      }
      loadVolumeEstimates();
    }
  };
  
  // 主单操作
  const saveMainOrder = async () => {
    if (!orderForm.collect_date || !orderForm.warehouse || !orderForm.port || !orderForm.cargo_type) {
      alert('请填写揽收日期、仓库、口岸、货物属性');
      return;
    }
    
    const category = `${orderForm.port}${orderForm.cargo_type}`;
    
    // 计算预估方数 - 先查当天，没有则查前一天
    let estimate = volumeEstimates.find(
      e => e.collect_date === orderForm.collect_date && e.warehouse === orderForm.warehouse
    );
    
    // 如果当天没有数据，查找前一天
    if (!estimate) {
      const prevDate = addDays(orderForm.collect_date, -1);
      estimate = volumeEstimates.find(
        e => e.collect_date === prevDate && e.warehouse === orderForm.warehouse
      );
    }
    
    let estVolume = 0;
    let estPieces: number | null = null;
    
    if (estimate) {
      if (orderForm.port === '关东' && orderForm.cargo_type === '普货') {
        estVolume = estimate.kanto_normal || 0;
      } else if (orderForm.port === '关东' && orderForm.cargo_type === '特货') {
        estVolume = estimate.kanto_special || 0;
      } else if (orderForm.port === '关西' && orderForm.cargo_type === '普货') {
        estVolume = estimate.kansai_normal || 0;
      } else if (orderForm.port === '关西' && orderForm.cargo_type === '特货') {
        estVolume = estimate.kansai_special || 0;
      }
      
      // 预估件数 = 预估方数 / 0.06
      estPieces = Math.round(estVolume / 0.06);
    }
    
    // 计算打货上限件数
    let maxPieces: number | null = null;
    if (orderForm.max_volume && orderForm.pack_req && orderForm.warehouse) {
      const maxVolume = parseFloat(orderForm.max_volume);
      if (orderForm.warehouse === '东莞') {
        maxPieces = Math.round(maxVolume / (orderForm.pack_req === '纸箱' ? 0.12 : 0.159));
      } else {
        maxPieces = Math.round(maxVolume / (orderForm.pack_req === '纸箱' ? 0.12 : 0.18));
      }
    }
    
    // 计算需求航班日期
    let reqFlightDate: string | null = null;
    if (orderForm.collect_date && orderForm.warehouse && orderForm.route_type) {
      const collectDate = new Date(orderForm.collect_date);
      let days = 0;
      if (orderForm.warehouse === '东莞') {
        days = orderForm.route_type === '空运' ? 2 : 3;
      } else if (orderForm.warehouse === '加工区') {
        days = orderForm.route_type === '空运' ? 1 : 3;
      }
      collectDate.setDate(collectDate.getDate() + days);
      reqFlightDate = collectDate.toISOString().split('T')[0];
    }
    
    // 辅助函数：空字符串转null
    const toNull = (v: string) => v === '' ? null : v;
    const toNumberOrNull = (v: string) => v === '' ? null : (isNaN(parseFloat(v)) ? null : parseFloat(v));
    const toIntOrNull = (v: string) => v === '' ? null : (isNaN(parseInt(v)) ? null : parseInt(v));
    
    const data = {
      collect_date: orderForm.collect_date,
      depart_date: toNull(orderForm.depart_date),
      collect_weekday: orderForm.collect_date ? getWeekday(orderForm.collect_date) : null,
      depart_weekday: orderForm.depart_date ? getWeekday(orderForm.depart_date) : null,
      warehouse: orderForm.warehouse,
      cargo_type: orderForm.cargo_type,
      port: orderForm.port,
      category,
      status: toNull(orderForm.status),
      pack_req: toNull(orderForm.pack_req),
      max_volume: toNumberOrNull(orderForm.max_volume),
      max_pieces: maxPieces,
      est_volume: estVolume > 0 ? estVolume.toFixed(3) : null,
      est_pieces: estPieces,
      route_type: toNull(orderForm.route_type),
      req_flight_date: reqFlightDate,
      actual_flight_date: toNull(orderForm.actual_flight_date),
      main_no: toNull(orderForm.main_no),
      flight_no: toNull(orderForm.flight_no),
      origin: toNull(orderForm.origin),
      transfer: toNull(orderForm.transfer),
      dest: toNull(orderForm.dest),
      second_flight: toNull(orderForm.second_flight),
      depart_time: toNull(orderForm.depart_time),
      arrive_time: toNull(orderForm.arrive_time),
      actual_pieces: toIntOrNull(orderForm.actual_pieces),
      actual_weight: toNumberOrNull(orderForm.actual_weight),
      actual_volume: toNumberOrNull(orderForm.actual_volume),
      actual_bills: toIntOrNull(orderForm.actual_bills),
      remark: toNull(orderForm.remark),
    };
    
    try {
      setSaving(true);
      let response;
      if (editingOrder) {
        response = await fetch(`/api/main-order/${editingOrder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch('/api/main-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      
      const result = await response.json();
      if (result.success) {
        alert('保存成功！');
        setEditingOrder(null);
        loadMainOrders();
        // 清空表单
        setOrderForm({
          collect_date: '', depart_date: '', warehouse: '', cargo_type: '', port: '',
          status: '', pack_req: '', max_volume: '', route_type: '', actual_flight_date: '', main_no: '',
          flight_no: '', origin: '', transfer: '', dest: '', second_flight: '', depart_time: '', arrive_time: '',
          actual_pieces: '', actual_weight: '', actual_volume: '', actual_bills: '', remark: '',
        });
      } else {
        alert('保存失败: ' + (result.error || '未知错误'));
      }
    } catch (err) {
      alert('保存失败: ' + (err instanceof Error ? err.message : '网络错误'));
    } finally {
      setSaving(false);
    }
    setEditingOrder(null);
  };
  
  const deleteMainOrder = async (id: number) => {
    if (confirm('确定删除此主单？')) {
      const response = await fetch(`/api/main-order/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) {
        alert('删除失败: ' + (result.error || '未知错误'));
        return;
      }
      loadMainOrders();
    }
  };
  
  // 欠方余方查询
  const queryBalance = () => {
    if (!balanceQuery.collect_date) {
      alert('请选择揽收日期');
      return;
    }
    
    const results: Array<{
      warehouse: string;
      port: string;
      cargo_type: string;
      estVolume: number;
      maxVolume: number;
      deficit: number;
      surplus: number;
    }> = [];
    
    const warehouses = balanceQuery.warehouse === '全部' ? ['东莞', '加工区'] : [balanceQuery.warehouse];
    const ports = balanceQuery.port === '全部' ? ['关东', '关西'] : [balanceQuery.port];
    const cargoTypes = balanceQuery.cargo_type === '全部' ? ['普货', '特货'] : [balanceQuery.cargo_type];
    
    for (const wh of warehouses) {
      for (const pt of ports) {
        for (const ct of cargoTypes) {
          // 查找当天的方数预估（如果当天数据不齐全，使用前一天）
          let estimate = volumeEstimates.find(
            e => e.collect_date === balanceQuery.collect_date && e.warehouse === wh
          );
          
          // 如果当天数据不齐全或不存在，尝试查找前一天
          if (!estimate || estimate.is_complete === '否') {
            const prevDate = getPrevDate(balanceQuery.collect_date);
            const prevEstimate = volumeEstimates.find(
              e => e.collect_date === prevDate && e.warehouse === wh
            );
            if (prevEstimate) {
              estimate = prevEstimate;
            }
          }
          
          // 计算预估方数
          let estVolume = 0;
          if (estimate) {
            if (pt === '关东' && ct === '普货') {
              estVolume = estimate.kanto_normal || 0;
            } else if (pt === '关东' && ct === '特货') {
              estVolume = estimate.kanto_special || 0;
            } else if (pt === '关西' && ct === '普货') {
              estVolume = estimate.kansai_normal || 0;
            } else if (pt === '关西' && ct === '特货') {
              estVolume = estimate.kansai_special || 0;
            }
          }
          
          // 计算打货上限汇总（对应组合的主单的max_volume之和）
          const orders = mainOrders.filter(
            o => o.collect_date === balanceQuery.collect_date && 
                 o.warehouse === wh && 
                 o.port === pt && 
                 o.cargo_type === ct
          );
          const maxVolume = orders.reduce((sum, o) => sum + parseFloat(o.max_volume || '0'), 0);
          
          // 计算欠方/余方
          const diff = estVolume - maxVolume;
          const deficit = diff > 0 ? diff : 0;
          const surplus = diff < 0 ? Math.abs(diff) : 0;
          
          results.push({
            warehouse: wh,
            port: pt,
            cargo_type: ct,
            estVolume,
            maxVolume,
            deficit,
            surplus,
          });
        }
      }
    }
    
    setBalanceResults(results);
  };
  
  // 获取前一天日期
  const getPrevDate = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  };

  // 截断数值到指定小数位（不四舍五入）
  const truncateToDecimals = (num: number | string | null, decimals: number): string => {
    const numValue = typeof num === 'string' ? parseFloat(num) : (num || 0);
    if (isNaN(numValue)) return '0';
    const factor = Math.pow(10, decimals);
    const truncated = Math.floor(numValue * factor) / factor;
    return truncated.toFixed(decimals);
  };

  // 获取筛选后的方数预估数据
  const getFilteredVolumeEstimates = () => {
    return volumeEstimates.filter(record => {
      // 日期筛选
      if (volumeFilterStartDate && record.collect_date < volumeFilterStartDate) return false;
      if (volumeFilterEndDate && record.collect_date > volumeFilterEndDate) return false;

      // 仓库筛选
      if (volumeFilterWarehouse !== '全部' && record.warehouse !== volumeFilterWarehouse) return false;

      return true;
    });
  };

  // 导出方数预估到Excel
  const exportVolumeEstimates = () => {
    const filteredData = getFilteredVolumeEstimates();

    if (filteredData.length === 0) {
      alert('没有可导出的数据');
      return;
    }

    // 准备Excel数据
    const excelData = filteredData.map(record => ({
      '揽收日期': record.collect_date,
      '仓库': record.warehouse,
      '大包数': record.package_count,
      '重量': record.weight ? truncateToDecimals(record.weight, 2) : '0.00',
      '总方数': (record.total_volume || 0).toFixed(3),
      '关东总方数': (record.kanto_total || 0).toFixed(3),
      '关西总方数': (record.kansai_total || 0).toFixed(3),
      '关东普货': (record.kanto_normal || 0).toFixed(3),
      '关东特货': (record.kanto_special || 0).toFixed(3),
      '关西普货': (record.kansai_normal || 0).toFixed(3),
      '关西特货': (record.kansai_special || 0).toFixed(3),
      '空运方数': (record.air_volume || 0).toFixed(3),
      '海空方数': (record.sea_air_volume || 0).toFixed(3),
      '货物袋数齐全': record.is_complete || '-',
    }));

    // 创建工作簿
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '方数预估');

    // 生成文件名
    const fileName = `方数预估_${volumeFilterStartDate || '全部'}至${volumeFilterEndDate || '全部'}_${new Date().toLocaleDateString('zh-CN')}.xlsx`;

    // 导出下载
    XLSX.writeFile(workbook, fileName);
  };

  // 根据航班号+始发港+中转站+目的港匹配路由，自动填充起飞时间、落地时间、二程航班
  const matchRouteAndFillTimes = () => {
    const { flight_no, origin, transfer, dest } = orderForm;
    
    // 必填字段校验
    if (!flight_no || !origin || !dest) return;
    
    const normalizedTransfer = (transfer || '').trim();
    
    // 查找匹配的路由
    const matchedRoute = routeConfigs.find(r => {
      const routeTransfer = (r.transfer || '').trim();
      // 中转站匹配：两边都为空（包括 '-'）视为匹配
      const transferMatch = 
        (routeTransfer === '' || routeTransfer === '-') && 
        (normalizedTransfer === '' || normalizedTransfer === '-') 
          ? true 
          : routeTransfer === normalizedTransfer;
      
      return (
        r.flight_no === flight_no &&
        r.origin === origin &&
        transferMatch &&
        r.dest === dest
      );
    });
    
    if (matchedRoute) {
      console.log('匹配到路由:', matchedRoute);
      setOrderForm(prev => ({
        ...prev,
        second_flight: matchedRoute.second_flight || '',
        depart_time: matchedRoute.depart_time || '',
        arrive_time: matchedRoute.arrive_time || '',
      }));
    } else {
      console.log('未匹配到路由', { flight_no, origin, transfer, dest });
    }
  };

  return (
    <>
      {/* 全局保存加载提示 */}
      {saving && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white py-2 text-center font-medium shadow-lg">
          <span className="inline-block animate-pulse mr-2">●</span>
          保存中，请稍候...
        </div>
      )}
      <div className="flex min-h-screen bg-gray-100">
      {/* 侧边栏 - 固定定位 */}
      <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 text-white flex flex-col z-40">
        <div className="p-5 text-lg font-bold border-b border-white/10 text-center">
          物流管理系统
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          <div className="px-4 py-2 text-xs text-white/50 uppercase">配置管理</div>
          <button
            onClick={() => setActiveTab('config-area')}
            className={`w-full px-5 py-3 text-left hover:bg-white/10 ${activeTab === 'config-area' ? 'bg-blue-500' : ''}`}
          >
            区域参数配置
          </button>
          <button
            onClick={() => setActiveTab('config-flight')}
            className={`w-full px-5 py-3 text-left hover:bg-white/10 ${activeTab === 'config-flight' ? 'bg-blue-500' : ''}`}
          >
            航班配置
          </button>
          <button
            onClick={() => setActiveTab('config-port')}
            className={`w-full px-5 py-3 text-left hover:bg-white/10 ${activeTab === 'config-port' ? 'bg-blue-500' : ''}`}
          >
            目的港配置
          </button>
          <button
            onClick={() => setActiveTab('config-route')}
            className={`w-full px-5 py-3 text-left hover:bg-white/10 ${activeTab === 'config-route' ? 'bg-blue-500' : ''}`}
          >
            航空路由配置
          </button>
          
          <div className="px-4 py-2 text-xs text-white/50 uppercase mt-4">业务操作</div>
          <button
            onClick={() => setActiveTab('volume-estimate')}
            className={`w-full px-5 py-3 text-left hover:bg-white/10 ${activeTab === 'volume-estimate' ? 'bg-blue-500' : ''}`}
          >
            方数预估
          </button>
          <button
            onClick={() => setActiveTab('main-order')}
            className={`w-full px-5 py-3 text-left hover:bg-white/10 ${activeTab === 'main-order' ? 'bg-blue-500' : ''}`}
          >
            主单发放
          </button>
          <button
            onClick={() => setActiveTab('order-query')}
            className={`w-full px-5 py-3 text-left hover:bg-white/10 ${activeTab === 'order-query' ? 'bg-blue-500' : ''}`}
          >
            主单查询
          </button>
          <button
            onClick={() => setActiveTab('balance-query')}
            className={`w-full px-5 py-3 text-left hover:bg-white/10 ${activeTab === 'balance-query' ? 'bg-blue-500' : ''}`}
          >
            欠方余方查询
          </button>
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <a
            href="/logistics.html"
            download="物流管理系统.html"
            className="block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white text-center rounded-lg font-medium transition-colors mb-3"
          >
            📥 下载HTML版本
          </a>
          <div className="text-sm text-white/70 mb-2">联网版本</div>
          <div className="text-xs text-green-400">在线同步</div>
        </div>
      </aside>
      
      {/* 主内容区 - 添加左边距避免被侧边栏遮挡 */}
      <main className="ml-60 flex-1 p-5">
        {/* 区域参数配置 */}
        {activeTab === 'config-area' && (
          <div>
            <Card className="mb-5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>区域参数配置</CardTitle>
                <Button onClick={() => { setEditingArea(null); setAreaModalOpen(true); }}>
                  新增配置
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto relative" style={{ minWidth: '1800px' }}>
                  <Table style={{ tableLayout: 'auto', width: '100%', minWidth: '1800px' }}>
                    <TableHeader className="sticky top-0 bg-white z-[9999]" style={{ position: 'sticky', top: 0, zIndex: 9999, backgroundColor: '#ffffff' }}>
                      <TableRow>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>仓库</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>大包预估体积</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关东目的港占比</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关西目的港占比</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关东普货占比</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关东特货占比</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关西普货占比</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关西特货占比</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {areaConfigs.map(config => (
                        <TableRow key={config.id}>
                          <TableCell>{config.warehouse}</TableCell>
                          <TableCell>{config.package_volume}</TableCell>
                          <TableCell>{config.kanto_ratio}%</TableCell>
                          <TableCell>{config.kansai_ratio}%</TableCell>
                          <TableCell>{config.kanto_normal_ratio}%</TableCell>
                          <TableCell>{config.kanto_special_ratio}%</TableCell>
                          <TableCell>{config.kansai_normal_ratio}%</TableCell>
                          <TableCell>{config.kansai_special_ratio}%</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="mr-2"
                              onClick={() => { setEditingArea(config); setAreaModalOpen(true); }}>
                              编辑
                            </Button>
                            <Button size="sm" variant="destructive"
                              onClick={() => deleteAreaConfig(config.id)}>
                              删除
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 航班配置 */}
        {activeTab === 'config-flight' && (
          <div>
            <Card className="mb-5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>航班配置</CardTitle>
                <div className="flex gap-3">
                  <Input
                    placeholder="搜索仓库/周几..."
                    value={flightSearchQuery}
                    onChange={(e) => setFlightSearchQuery(e.target.value)}
                    className="w-48"
                  />
                  <Button onClick={() => { setEditingFlight(null); setFlightModalOpen(true); }}>
                    新增配置
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[800px] overflow-auto relative">
                  <Table style={{ tableLayout: 'auto', width: '100%', minWidth: '2200px' }}>
                    <TableHeader className="sticky top-0 bg-white z-[9999]" style={{ position: 'sticky', top: 0, zIndex: 9999, backgroundColor: '#ffffff' }}>
                      <TableRow>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>仓库</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>周几</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关东普货路由</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关西普货路由</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关东特货路由</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关西特货路由</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>备注</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flightConfigs
                        .filter(config =>
                          !flightSearchQuery ||
                          config.warehouse.includes(flightSearchQuery) ||
                          config.weekday.includes(flightSearchQuery)
                        )
                        .map(config => (
                        <TableRow key={config.id}>
                          <TableCell>{config.warehouse}</TableCell>
                          <TableCell>{config.weekday}</TableCell>
                          <TableCell>{config.kanto_normal || '-'}</TableCell>
                          <TableCell>{config.kansai_normal || '-'}</TableCell>
                          <TableCell>{config.kanto_special || '-'}</TableCell>
                          <TableCell>{config.kansai_special || '-'}</TableCell>
                          <TableCell>{config.remark || '-'}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="mr-2"
                              onClick={() => { setEditingFlight(config); setFlightModalOpen(true); }}>
                              编辑
                            </Button>
                            <Button size="sm" variant="destructive"
                              onClick={() => deleteFlightConfig(config.id)}>
                              删除
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 目的港配置 */}
        {activeTab === 'config-port' && (
          <div>
            <Card className="mb-5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>目的港配置</CardTitle>
                <Button onClick={() => { setEditingPort(null); setPortModalOpen(true); }}>
                  新增配置
                </Button>
              </CardHeader>
              <CardContent>
                <div className="max-h-[800px] overflow-auto relative">
                  <Table style={{ tableLayout: 'auto' }}>
                    <TableHeader className="sticky top-0 bg-white z-[9999]" style={{ position: 'sticky', top: 0, zIndex: 9999, backgroundColor: '#ffffff' }}>
                      <TableRow>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>目的港代码</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>所属区域</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portConfigs.map(config => (
                        <TableRow key={config.id}>
                          <TableCell>{config.port_code}</TableCell>
                          <TableCell>{config.region}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="mr-2"
                              onClick={() => { setEditingPort(config); setPortModalOpen(true); }}>
                              编辑
                            </Button>
                            <Button size="sm" variant="destructive"
                              onClick={() => deletePortConfig(config.id)}>
                              删除
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 航空路由配置 */}
        {activeTab === 'config-route' && (
          <div>
            <Card className="mb-5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>航空路由配置</CardTitle>
                <div className="flex gap-3">
                  <Input
                    placeholder="搜索航班号/始发/中转/目的/二程航班/路由..."
                    value={routeSearchQuery}
                    onChange={(e) => setRouteSearchQuery(e.target.value)}
                    className="w-72"
                  />
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    ref={routeImportRef}
                    onChange={handleRouteImport}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => routeImportRef.current?.click()}>
                    Excel导入
                  </Button>
                  {selectedRouteIds.size > 0 && (
                    <Button variant="destructive" onClick={deleteSelectedRoutes}>
                      删除选中 ({selectedRouteIds.size})
                    </Button>
                  )}
                  <Button onClick={() => { setEditingRoute(null); setRouteModalOpen(true); }}>
                    新增配置
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto relative">
                  <Table style={{ tableLayout: 'auto', whiteSpace: 'nowrap', minWidth: '1800px' }}>
                    <TableHeader className="sticky top-0 bg-white z-[9999]" style={{ position: 'sticky', top: 0, zIndex: 9999, backgroundColor: '#ffffff' }}>
                      <TableRow>
                        <TableHead className="bg-white text-center" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '60px' }}>
                          <input
                            type="checkbox"
                            checked={routeConfigs.length > 0 && selectedRouteIds.size === routeConfigs.filter(config =>
                              !routeSearchQuery ||
                              config.flight_no.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                              config.origin.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                              (config.transfer || '').toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                              config.dest.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                              (config.second_flight || '').toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                              config.route_type.toLowerCase().includes(routeSearchQuery.toLowerCase())
                            ).length && selectedRouteIds.size === routeConfigs.filter(config =>
                              !routeSearchQuery ||
                              config.flight_no.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                              config.origin.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                              (config.transfer || '').toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                              config.dest.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                              (config.second_flight || '').toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                              config.route_type.toLowerCase().includes(routeSearchQuery.toLowerCase())
                            ).length}
                            onChange={() => {
                              const filtered = routeConfigs.filter(config =>
                                !routeSearchQuery ||
                                config.flight_no.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                                config.origin.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                                (config.transfer || '').toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                                config.dest.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                                (config.second_flight || '').toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                                config.route_type.toLowerCase().includes(routeSearchQuery.toLowerCase())
                              );
                              if (selectedRouteIds.size === filtered.length) {
                                setSelectedRouteIds(new Set());
                              } else {
                                setSelectedRouteIds(new Set(filtered.map(r => r.id)));
                              }
                            }}
                            className="w-4 h-4"
                          />
                        </TableHead>
                        <TableHead className="bg-white text-center" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '150px' }}>航班号</TableHead>
                        <TableHead className="bg-white text-center" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '80px' }}>始发</TableHead>
                        <TableHead className="bg-white text-center" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '80px' }}>中转</TableHead>
                        <TableHead className="bg-white text-center" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '80px' }}>目的</TableHead>
                        <TableHead className="bg-white text-center" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '120px' }}>起飞时间</TableHead>
                        <TableHead className="bg-white text-center" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '120px' }}>落地时间</TableHead>
                        <TableHead className="bg-white text-center" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '100px' }}>是否隔天</TableHead>
                        <TableHead className="bg-white text-center" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '150px' }}>二程航班</TableHead>
                        <TableHead className="bg-white text-center" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '100px' }}>路由</TableHead>
                        <TableHead className="bg-white text-center" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '150px' }}>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {routeConfigs
                        .filter(config =>
                          !routeSearchQuery ||
                          config.flight_no.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                          config.origin.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                          (config.transfer || '').toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                          config.dest.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                          (config.second_flight || '').toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
                          config.route_type.toLowerCase().includes(routeSearchQuery.toLowerCase())
                        )
                        .map(config => (
                        <TableRow key={config.id} className={selectedRouteIds.has(config.id) ? 'bg-blue-50' : ''}>
                          <TableCell className="text-center" style={{ minWidth: '60px' }}>
                            <input
                              type="checkbox"
                              checked={selectedRouteIds.has(config.id)}
                              onChange={() => toggleRouteSelection(config.id)}
                              className="w-4 h-4"
                            />
                          </TableCell>
                          <TableCell className="text-center" style={{ minWidth: '150px' }}>{config.flight_no}</TableCell>
                          <TableCell className="text-center" style={{ minWidth: '80px' }}>{config.origin}</TableCell>
                          <TableCell className="text-center" style={{ minWidth: '80px' }}>{config.transfer || '-'}</TableCell>
                          <TableCell className="text-center" style={{ minWidth: '80px' }}>{config.dest}</TableCell>
                          <TableCell className="text-center" style={{ minWidth: '120px' }}>{config.depart_time || '-'}</TableCell>
                          <TableCell className="text-center" style={{ minWidth: '120px' }}>{config.arrive_time || '-'}</TableCell>
                          <TableCell className="text-center" style={{ minWidth: '100px' }}>{config.is_next_day || '-'}</TableCell>
                          <TableCell className="text-center" style={{ minWidth: '150px' }}>{config.second_flight || '-'}</TableCell>
                          <TableCell className="text-center" style={{ minWidth: '100px' }}>
                            <Badge variant={config.route_type === '空运' ? 'default' : 'secondary'}>
                              {config.route_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center" style={{ minWidth: '150px' }}>
                            <Button size="sm" variant="outline" className="mr-2"
                              onClick={() => { setEditingRoute(config); setRouteModalOpen(true); }}>
                              编辑
                            </Button>
                            <Button size="sm" variant="destructive"
                              onClick={() => deleteRouteConfig(config.id)}>
                              删除
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 方数预估 */}
        {activeTab === 'volume-estimate' && (
          <div>
            <Card className="mb-5">
              <CardHeader>
                <CardTitle>方数预估</CardTitle>
              </CardHeader>
              <CardContent>
                {/* 顶部筛选 */}
                <div className="grid grid-cols-5 gap-4 mb-5">
                  <div>
                    <Label>揽收日期</Label>
                    <Input type="date" value={volumeForm.collect_date}
                      onChange={e => setVolumeForm(prev => ({ ...prev, collect_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>星期</Label>
                    <Input value={volumeForm.collect_date ? getWeekday(volumeForm.collect_date) : ''} readOnly
                      className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>仓库</Label>
                    <Select value={volumeForm.warehouse}
                      onValueChange={v => setVolumeForm(prev => ({ ...prev, warehouse: v }))}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="东莞">东莞</SelectItem>
                        <SelectItem value="加工区">加工区</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>揽收大包数</Label>
                    <Input type="number" placeholder="请输入" value={volumeForm.package_count || ''}
                      onChange={e => setVolumeForm(prev => ({ ...prev, package_count: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <Label>重量 (kg)</Label>
                    <Input type="number" step="0.01" placeholder="请输入" value={volumeForm.weight || ''}
                      onChange={e => setVolumeForm(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                
                {/* 计算结果 */}
                <div className="mb-5">
                  <h3 className="font-semibold text-lg mb-3">计算结果</h3>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{volumeResult ? volumeResult.totalVolume.toFixed(3) : '0'}</div>
                      <div className="text-sm text-gray-600">总方数</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{volumeResult ? volumeResult.kantoTotal.toFixed(3) : '0'}</div>
                      <div className="text-sm text-gray-600">关东总方数</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{volumeResult ? volumeResult.kansaiTotal.toFixed(3) : '0'}</div>
                      <div className="text-sm text-gray-600">关西总方数</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-orange-600">{volumeResult ? volumeResult.kantoNormal.toFixed(3) : '0'}</div>
                      <div className="text-sm text-gray-600">关东普货</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-red-600">{volumeResult ? volumeResult.kantoSpecial.toFixed(3) : '0'}</div>
                      <div className="text-sm text-gray-600">关东特货</div>
                    </div>
                    <div className="bg-teal-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-teal-600">{volumeResult ? volumeResult.kansaiNormal.toFixed(3) : '0'}</div>
                      <div className="text-sm text-gray-600">关西普货</div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-indigo-600">{volumeResult ? volumeResult.kansaiSpecial.toFixed(3) : '0'}</div>
                      <div className="text-sm text-gray-600">关西特货</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-cyan-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-cyan-600">{volumeResult ? volumeResult.airVolume.toFixed(3) : '0'}</div>
                      <div className="text-sm text-gray-600">空运方数</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-amber-600">{volumeResult ? volumeResult.seaAirVolume.toFixed(3) : '0'}</div>
                      <div className="text-sm text-gray-600">海空方数</div>
                    </div>
                  </div>
                </div>
                
                {/* 操作区 */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-48">
                    <Label className="text-red-600">货物袋数是否齐全 <span className="text-red-500">*</span></Label>
                    <Select value={volumeForm.is_complete}
                      onValueChange={v => setVolumeForm(prev => ({ ...prev, is_complete: v }))}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="是">是</SelectItem>
                        <SelectItem value="否">否</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 pt-6">
                    <Button onClick={saveVolumeEstimate} className="bg-green-600 hover:bg-green-700">
                      保存数据
                    </Button>
                    <Button variant="outline" onClick={() => { setEditingVolume(null); setVolumeForm({ collect_date: '', warehouse: '', package_count: 0, weight: 0, is_complete: '是' }); setVolumeResult(null); }}>
                      清空
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 最近保存的记录 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>最近保存的记录</CardTitle>
                <Button onClick={exportVolumeEstimates} variant="outline" className="gap-2">
                  📊 导出Excel
                </Button>
              </CardHeader>
              <CardContent>
                {/* 筛选器 */}
                <div className="grid grid-cols-4 gap-4 mb-5">
                  <div>
                    <Label>开始日期</Label>
                    <Input type="date" value={volumeFilterStartDate}
                      onChange={e => setVolumeFilterStartDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>结束日期</Label>
                    <Input type="date" value={volumeFilterEndDate}
                      onChange={e => setVolumeFilterEndDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>仓库</Label>
                    <Select value={volumeFilterWarehouse}
                      onValueChange={setVolumeFilterWarehouse}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部</SelectItem>
                        <SelectItem value="东莞">东莞</SelectItem>
                        <SelectItem value="加工区">加工区</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => {
                      setVolumeFilterStartDate('');
                      setVolumeFilterEndDate('');
                      setVolumeFilterWarehouse('全部');
                    }} variant="outline">
                      重置筛选
                    </Button>
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto relative">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-50" style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'white' }}>
                      <TableRow>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>揽收日期</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>仓库</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>大包数</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>重量</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>总方数</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关东总</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关西总</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关东普货</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关东特货</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关西普货</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>关西特货</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>空运</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>海空</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>货物袋数齐全</TableHead>
                        <TableHead className="bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredVolumeEstimates().slice(0, 10).map(record => (
                        <TableRow key={record.id}>
                          <TableCell>{record.collect_date}</TableCell>
                          <TableCell>{record.warehouse}</TableCell>
                          <TableCell>{record.package_count}</TableCell>
                          <TableCell>{record.weight ? truncateToDecimals(record.weight, 2) : '0.00'}</TableCell>
                          <TableCell>{(record.total_volume || 0).toFixed(3)}</TableCell>
                          <TableCell>{(record.kanto_total || 0).toFixed(3)}</TableCell>
                          <TableCell>{(record.kansai_total || 0).toFixed(3)}</TableCell>
                          <TableCell>{(record.kanto_normal || 0).toFixed(3)}</TableCell>
                          <TableCell>{(record.kanto_special || 0).toFixed(3)}</TableCell>
                          <TableCell>{(record.kansai_normal || 0).toFixed(3)}</TableCell>
                          <TableCell>{(record.kansai_special || 0).toFixed(3)}</TableCell>
                          <TableCell>{(record.air_volume || 0).toFixed(3)}</TableCell>
                          <TableCell>{(record.sea_air_volume || 0).toFixed(3)}</TableCell>
                          <TableCell>{record.is_complete || '-'}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="mr-2"
                              onClick={() => editVolumeEstimate(record)}>
                              编辑
                            </Button>
                            <Button size="sm" variant="destructive"
                              onClick={() => deleteVolumeEstimate(record.id)}>
                              删除
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {getFilteredVolumeEstimates().length === 0 && (
                        <TableRow>
                          <TableCell colSpan={15} className="text-center text-gray-500">暂无记录</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 主单发放 */}
        {activeTab === 'main-order' && (
          <div>
            <div className="bg-gray-700 text-white px-6 py-3 rounded-t-lg">
              <h2 className="text-lg font-bold">主单发放</h2>
            </div>
            <Card className="rounded-t-none">
              <CardContent className="p-6">
                {/* 第一行 */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">揽收日期</Label>
                    <div className="flex gap-2">
                      <Input type="date" className="flex-1" value={orderForm.collect_date}
                        onChange={e => setOrderForm(prev => ({ ...prev, collect_date: e.target.value }))} />
                      <Input className="w-12 bg-blue-50 text-blue-600 font-semibold text-center text-sm px-1"
                        value={orderForm.collect_date ? getWeekday(orderForm.collect_date) : ''} readOnly />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">发车日期</Label>
                    <div className="flex gap-2">
                      <Input type="date" className="flex-1" value={orderForm.depart_date}
                        onChange={e => setOrderForm(prev => ({ ...prev, depart_date: e.target.value }))} />
                      <Input className="w-12 bg-blue-50 text-blue-600 font-semibold text-center text-sm px-1"
                        value={orderForm.depart_date ? getWeekday(orderForm.depart_date) : ''} readOnly />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">仓库</Label>
                    <Select value={orderForm.warehouse}
                      onValueChange={v => setOrderForm(prev => ({ ...prev, warehouse: v }))}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="东莞">东莞</SelectItem>
                        <SelectItem value="加工区">加工区</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">货物属性</Label>
                    <Select value={orderForm.cargo_type}
                      onValueChange={v => setOrderForm(prev => ({ ...prev, cargo_type: v }))}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="普货">普货</SelectItem>
                        <SelectItem value="特货">特货</SelectItem>
                        <SelectItem value="混打">混打</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* 第二行 */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">口岸</Label>
                    <Select value={orderForm.port}
                      onValueChange={v => setOrderForm(prev => ({ ...prev, port: v }))}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="关东">关东</SelectItem>
                        <SelectItem value="关西">关西</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">类别(路由)</Label>
                    <Input className="bg-gray-100" value={orderForm.port && orderForm.cargo_type ? `${orderForm.port}${orderForm.cargo_type}` : ''} readOnly placeholder="自动计算" />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">主单状态</Label>
                    <Select value={orderForm.status || ''}
                      onValueChange={v => setOrderForm(prev => ({ ...prev, status: v }))}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="正常">正常</SelectItem>
                        <SelectItem value="取消">取消</SelectItem>
                        <SelectItem value="待取消">待取消</SelectItem>
                        <SelectItem value="待定">待定</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">打货要求</Label>
                    <Select value={orderForm.pack_req || ''}
                      onValueChange={v => setOrderForm(prev => ({ ...prev, pack_req: v }))}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="纸箱">纸箱</SelectItem>
                        <SelectItem value="麻袋">麻袋</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* 第三行 */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">打货上限(航线提供)</Label>
                    <Input type="number" step="0.001" value={orderForm.max_volume}
                      onChange={e => setOrderForm(prev => ({ ...prev, max_volume: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">打货上限件数</Label>
                    <Input className="bg-gray-100" readOnly placeholder="自动计算"
                      value={orderForm.max_volume && orderForm.pack_req && orderForm.warehouse
                        ? Math.round(parseFloat(orderForm.max_volume) / (orderForm.warehouse === '东莞'
                          ? (orderForm.pack_req === '纸箱' ? 0.12 : 0.159)
                          : (orderForm.pack_req === '纸箱' ? 0.12 : 0.18)))
                        : ''} />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">预估方数</Label>
                    <Input className="bg-gray-100" readOnly placeholder="自动计算"
                      value={(() => {
                        if (!orderForm.collect_date || !orderForm.warehouse || !orderForm.port || !orderForm.cargo_type) return '';
                        const estimate = volumeEstimates.find(e => e.collect_date === orderForm.collect_date && e.warehouse === orderForm.warehouse);
                        if (!estimate) return '';
                        if (orderForm.port === '关东' && orderForm.cargo_type === '普货') return (estimate.kanto_normal || 0).toFixed(3);
                        if (orderForm.port === '关东' && orderForm.cargo_type === '特货') return (estimate.kanto_special || 0).toFixed(3);
                        if (orderForm.port === '关西' && orderForm.cargo_type === '普货') return (estimate.kansai_normal || 0).toFixed(3);
                        if (orderForm.port === '关西' && orderForm.cargo_type === '特货') return (estimate.kansai_special || 0).toFixed(3);
                        return '';
                      })()} />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">预估件数</Label>
                    <Input className="bg-gray-100" readOnly placeholder="自动计算"
                      value={(() => {
                        if (!orderForm.collect_date || !orderForm.warehouse || !orderForm.port || !orderForm.cargo_type) return '';
                        const estimate = volumeEstimates.find(e => e.collect_date === orderForm.collect_date && e.warehouse === orderForm.warehouse);
                        if (!estimate) return '';
                        let estVol = 0;
                        if (orderForm.port === '关东' && orderForm.cargo_type === '普货') estVol = estimate.kanto_normal || 0;
                        else if (orderForm.port === '关东' && orderForm.cargo_type === '特货') estVol = estimate.kanto_special || 0;
                        else if (orderForm.port === '关西' && orderForm.cargo_type === '普货') estVol = estimate.kansai_normal || 0;
                        else if (orderForm.port === '关西' && orderForm.cargo_type === '特货') estVol = estimate.kansai_special || 0;
                        return Math.round(estVol / 0.06);
                      })()} />
                  </div>
                </div>
                
                {/* 第四行 - 路由类型和需求航班日期 */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">路由类型</Label>
                    <Select value={orderForm.route_type || ''}
                      onValueChange={v => setOrderForm(prev => ({ ...prev, route_type: v }))}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="空运">空运</SelectItem>
                        <SelectItem value="海空">海空</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">需求航班日期</Label>
                    <Input className="bg-gray-100" readOnly placeholder="自动计算"
                      value={(() => {
                        if (!orderForm.collect_date || !orderForm.warehouse || !orderForm.route_type) return '';
                        const collectDate = new Date(orderForm.collect_date);
                        let days = 0;
                        if (orderForm.warehouse === '东莞') {
                          days = orderForm.route_type === '空运' ? 2 : 3;
                        } else if (orderForm.warehouse === '加工区') {
                          days = orderForm.route_type === '空运' ? 1 : 3;
                        }
                        collectDate.setDate(collectDate.getDate() + days);
                        return collectDate.toISOString().split('T')[0];
                      })()} />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">实际航班日期</Label>
                    <Input type="date" value={orderForm.actual_flight_date || ''}
                      onChange={e => setOrderForm(prev => ({ ...prev, actual_flight_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">主单号</Label>
                    <Input value={orderForm.main_no || ''}
                      onChange={e => setOrderForm(prev => ({ ...prev, main_no: e.target.value }))} />
                  </div>
                </div>
                
                {/* 第五行 */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">航班号</Label>
                    <Input 
                      value={orderForm.flight_no || ''}
                      onChange={e => { 
                        const value = e.target.value.toUpperCase();
                        setOrderForm(prev => ({ ...prev, flight_no: value }));
                      }}
                      placeholder="请输入航班号"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">始发港</Label>
                    <Input 
                      value={orderForm.origin || ''} 
                      onChange={e => {
                        setOrderForm(prev => ({ ...prev, origin: e.target.value.toUpperCase() }));
                      }}
                      placeholder="请输入始发港" 
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">中转站</Label>
                    <Input 
                      value={orderForm.transfer || ''} 
                      onChange={e => {
                        setOrderForm(prev => ({ ...prev, transfer: e.target.value.toUpperCase() }));
                      }}
                      placeholder="请输入中转站" 
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">目的港</Label>
                    <Input 
                      value={orderForm.dest || ''} 
                      onChange={e => {
                        setOrderForm(prev => ({ ...prev, dest: e.target.value.toUpperCase() }));
                      }}
                      placeholder="请输入目的港" 
                    />
                  </div>
                </div>
                
                {/* 第六行 */}
                <div className="grid grid-cols-5 gap-4 mb-4">
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">起飞时间</Label>
                    <Input className="bg-gray-100" value={formatDateTime(orderForm.actual_flight_date, orderForm.depart_time)}
                      readOnly placeholder="自动填充" />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">二程航班</Label>
                    <Input className="bg-gray-100" value={orderForm.second_flight || ''}
                      readOnly placeholder="自动填充" />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">到港时间</Label>
                    <Input className="bg-gray-100" value={formatDateTime(orderForm.actual_flight_date, orderForm.arrive_time)}
                      readOnly placeholder="自动填充" />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">实际件数</Label>
                    <Input type="number" value={orderForm.actual_pieces || ''}
                      onChange={e => setOrderForm(prev => ({ ...prev, actual_pieces: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">实际重量</Label>
                    <Input type="number" step="0.01" value={orderForm.actual_weight || ''}
                      onChange={e => setOrderForm(prev => ({ ...prev, actual_weight: e.target.value }))} />
                  </div>
                </div>
                
                {/* 第七行 */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">实际体积</Label>
                    <Input type="number" step="0.001" value={orderForm.actual_volume || ''}
                      onChange={e => setOrderForm(prev => ({ ...prev, actual_volume: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">实际票数</Label>
                    <Input type="number" value={orderForm.actual_bills || ''}
                      onChange={e => setOrderForm(prev => ({ ...prev, actual_bills: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm text-gray-600 mb-1 block">备注</Label>
                    <Input placeholder="请输入备注信息" value={orderForm.remark || ''}
                      onChange={e => setOrderForm(prev => ({ ...prev, remark: e.target.value }))} />
                  </div>
                </div>
                
                {/* 按钮区域 */}
                <div className="flex gap-3 pt-2">
                  <Button onClick={saveMainOrder} className="bg-green-600 hover:bg-green-700 text-white px-6">
                    保存主单
                  </Button>
                  <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white px-6" onClick={() => setOrderListOpen(true)}>
                    查看主单列表
                  </Button>
                  <Button variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white px-6" onClick={() => {
                    setOrderForm({
                      collect_date: '', depart_date: '', warehouse: '', cargo_type: '', port: '',
                      status: '', pack_req: '', max_volume: '', route_type: '', actual_flight_date: '', main_no: '',
                      flight_no: '', origin: '', transfer: '', dest: '', second_flight: '', depart_time: '', arrive_time: '',
                      actual_pieces: '', actual_weight: '', actual_volume: '', actual_bills: '', remark: '',
                    });
                    setEditingOrder(null);
                  }}>清空表单</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 主单查询 */}
        {activeTab === 'order-query' && (
          <div>
            <Card className="mb-5">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>主单查询</CardTitle>
                <Button 
                  onClick={() => exportToExcel(mainOrders, `主单查询_${new Date().toISOString().split('T')[0]}`)}
                  disabled={mainOrders.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  📥 导出Excel
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 mb-4">
                  <div>
                    <Label>开始日期</Label>
                    <Input type="date" value={orderQueryStartDate}
                      onChange={e => setOrderQueryStartDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>结束日期</Label>
                    <Input type="date" value={orderQueryEndDate}
                      onChange={e => setOrderQueryEndDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>仓库</Label>
                    <Select value={orderQueryWarehouse} onValueChange={v => setOrderQueryWarehouse(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="全部">
                          {orderQueryWarehouse === '全部' ? '全部' : orderQueryWarehouse}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部</SelectItem>
                        <SelectItem value="东莞">东莞</SelectItem>
                        <SelectItem value="加工区">加工区</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>始发</Label>
                    <Select value={orderQueryOrigin} onValueChange={v => setOrderQueryOrigin(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="全部">
                          {orderQueryOrigin === '全部' ? '全部' : orderQueryOrigin}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部</SelectItem>
                        {uniqueOrigins.map(origin => (
                          <SelectItem key={origin} value={origin}>{origin}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>路由类型</Label>
                    <Select value={orderQueryRouteType} onValueChange={v => setOrderQueryRouteType(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="全部">
                          {orderQueryRouteType === '全部' ? '全部' : orderQueryRouteType}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部</SelectItem>
                        <SelectItem value="空运">空运</SelectItem>
                        <SelectItem value="海空">海空</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={queryMainOrders}>查询</Button>
                  <Button variant="outline" onClick={() => {
                    setOrderQueryStartDate('');
                    setOrderQueryEndDate('');
                    setOrderQueryWarehouse('全部');
                    setOrderQueryOrigin('全部');
                    setOrderQueryRouteType('全部');
                  }}>重置筛选</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <span>查询结果</span>
                <span className="text-sm text-gray-500">共 {mainOrders.length} 条记录</span>
              </CardHeader>
              <CardContent>
                <Table style={{ tableLayout: 'auto', minWidth: '2800px', whiteSpace: 'nowrap' }} className="max-h-[800px]">
                    <TableHeader className="sticky top-0 bg-white z-[9999]" style={{ position: 'sticky', top: 0, zIndex: 9999, backgroundColor: '#ffffff' }}>
                      <TableRow>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '120px' }}>揽收日期</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '80px' }}>仓库</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '80px' }}>口岸</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '80px' }}>货物属性</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '100px' }}>路由类型</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '150px' }}>主单号</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '100px' }}>航班号</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '80px' }}>始发</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '80px' }}>中转</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '80px' }}>目的</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '200px' }}>预计起飞</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '200px' }}>预计落地</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '120px' }}>打货上限(方)</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '120px' }}>打货上限(件)</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '120px' }}>实际件数</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '120px' }}>实际方数</TableHead>
                        <TableHead className="text-center px-3 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999, minWidth: '100px' }}>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mainOrders.slice(0, 50).map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="text-center px-3" style={{ minWidth: '120px' }}>{order.collect_date}</TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '80px' }}>{order.warehouse}</TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '80px' }}>{order.port}</TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '80px' }}>{order.cargo_type}</TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '100px' }}>
                            {order.route_type ? (
                              <Badge variant={order.route_type === '空运' ? 'default' : 'secondary'}>
                                {order.route_type}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '150px' }}>{order.main_no || '-'}</TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '100px' }}>{order.flight_no || '-'}</TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '80px' }}>{order.origin || '-'}</TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '80px' }}>{order.transfer || '-'}</TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '80px' }}>{order.dest || '-'}</TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '200px' }}>
                            {formatDateTime(order.actual_flight_date, order.depart_time) || '-'}
                          </TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '200px' }}>
                            {formatDateTime(order.actual_flight_date, order.arrive_time) || '-'}
                          </TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '120px' }}>{order.max_volume || '-'}</TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '120px' }}>{order.max_pieces || '-'}</TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '120px' }}>{order.actual_pieces || '-'}</TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '120px' }}>{order.actual_volume || '-'}</TableCell>
                          <TableCell className="text-center px-3" style={{ minWidth: '100px' }}>
                            <Button size="sm" variant="outline" className="mr-2"
                              onClick={() => {
                                setEditingOrder(order);
                                setOrderForm({
                                  collect_date: order.collect_date,
                                  depart_date: order.depart_date || '',
                                  warehouse: order.warehouse,
                                  cargo_type: order.cargo_type,
                                  port: order.port,
                                  status: order.status || '',
                                  pack_req: order.pack_req || '',
                                  max_volume: order.max_volume || '',
                                  route_type: order.route_type || '',
                                  actual_flight_date: order.actual_flight_date || '',
                                  main_no: order.main_no || '',
                                  flight_no: order.flight_no || '',
                                  origin: order.origin || '',
                                  transfer: order.transfer || '',
                                  dest: order.dest || '',
                                  second_flight: order.second_flight || '',
                                  depart_time: order.depart_time || '',
                                  arrive_time: order.arrive_time || '',
                                  actual_pieces: order.actual_pieces?.toString() || '',
                                  actual_weight: order.actual_weight || '',
                                  actual_volume: order.actual_volume || '',
                                  actual_bills: order.actual_bills?.toString() || '',
                                  remark: order.remark || '',
                                });
                                setActiveTab('main-order');
                              }}>
                              编辑
                            </Button>
                            <Button size="sm" variant="destructive"
                              onClick={() => deleteMainOrder(order.id)}>
                              删除
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 欠方余方查询 */}
        {activeTab === 'balance-query' && (
          <div>
            <Card className="mb-5">
              <CardHeader>
                <CardTitle>欠方余方查询</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 mb-4">
                  <div>
                    <Label>揽收日期 <span className="text-red-500">*</span></Label>
                    <Input type="date" value={balanceQuery.collect_date}
                      onChange={e => setBalanceQuery(prev => ({ ...prev, collect_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>仓库</Label>
                    <Select value={balanceQuery.warehouse}
                      onValueChange={v => setBalanceQuery(prev => ({ ...prev, warehouse: v }))}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部</SelectItem>
                        <SelectItem value="东莞">东莞</SelectItem>
                        <SelectItem value="加工区">加工区</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>口岸</Label>
                    <Select value={balanceQuery.port}
                      onValueChange={v => setBalanceQuery(prev => ({ ...prev, port: v }))}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部</SelectItem>
                        <SelectItem value="关东">关东</SelectItem>
                        <SelectItem value="关西">关西</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>货物属性</Label>
                    <Select value={balanceQuery.cargo_type}
                      onValueChange={v => setBalanceQuery(prev => ({ ...prev, cargo_type: v }))}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部</SelectItem>
                        <SelectItem value="普货">普货</SelectItem>
                        <SelectItem value="特货">特货</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={queryBalance}>查询</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>查询结果</CardHeader>
              <CardContent>
                {balanceResults.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto relative">
                    <Table className="w-full">
                      <TableHeader className="sticky top-0 bg-white z-50" style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'white' }}>
                        <TableRow>
                          <TableHead className="text-center px-2 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>仓库</TableHead>
                          <TableHead className="text-center px-2 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>口岸</TableHead>
                          <TableHead className="text-center px-2 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>货物属性</TableHead>
                          <TableHead className="text-center px-2 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>预估方数</TableHead>
                          <TableHead className="text-center px-2 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>打货上限汇总</TableHead>
                          <TableHead className="text-center px-2 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>欠方</TableHead>
                          <TableHead className="text-center px-2 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 9999 }}>余方</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {balanceResults.map((r, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-center px-2">{r.warehouse}</TableCell>
                            <TableCell className="text-center px-2">{r.port}</TableCell>
                            <TableCell className="text-center px-2">{r.cargo_type}</TableCell>
                            <TableCell className="text-center px-2">{r.estVolume.toFixed(3)}</TableCell>
                            <TableCell className="text-center px-2">{r.maxVolume.toFixed(3)}</TableCell>
                            <TableCell className="text-center px-2 font-semibold text-red-600">
                              {r.deficit > 0 ? r.deficit.toFixed(3) : '0.000'}
                            </TableCell>
                            <TableCell className="text-center px-2 font-semibold text-green-600">
                              {r.surplus > 0 ? r.surplus.toFixed(3) : '0.000'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    请选择揽收日期后点击查询
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      
      {/* 区域参数模态框 */}
      <Dialog open={areaModalOpen} onOpenChange={setAreaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingArea ? '编辑区域参数' : '新增区域参数'}</DialogTitle>
          </DialogHeader>
          <form action={saveAreaConfig}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>仓库</Label>
                <Select name="warehouse" defaultValue={editingArea?.warehouse}>
                  <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="东莞">东莞</SelectItem>
                    <SelectItem value="加工区">加工区</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>大包预估体积（方数）</Label>
                <Input name="package_volume" type="number" step="any" placeholder="支持12位小数" defaultValue={editingArea?.package_volume} />
              </div>
              <div>
                <Label>关东目的港占比（%）</Label>
                <Input name="kanto_ratio" type="number" step="0.01" defaultValue={editingArea?.kanto_ratio} />
              </div>
              <div>
                <Label>关西目的港占比（%）</Label>
                <Input name="kansai_ratio" type="number" step="0.01" defaultValue={editingArea?.kansai_ratio} />
              </div>
              <div>
                <Label>关东普货占比（%）</Label>
                <Input name="kanto_normal_ratio" type="number" step="0.01" defaultValue={editingArea?.kanto_normal_ratio} />
              </div>
              <div>
                <Label>关东特货占比（%）</Label>
                <Input name="kanto_special_ratio" type="number" step="0.01" defaultValue={editingArea?.kanto_special_ratio} />
              </div>
              <div>
                <Label>关西普货占比（%）</Label>
                <Input name="kansai_normal_ratio" type="number" step="0.01" defaultValue={editingArea?.kansai_normal_ratio} />
              </div>
              <div>
                <Label>关西特货占比（%）</Label>
                <Input name="kansai_special_ratio" type="number" step="0.01" defaultValue={editingArea?.kansai_special_ratio} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAreaModalOpen(false)}>取消</Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* 航班配置模态框 */}
      <Dialog open={flightModalOpen} onOpenChange={setFlightModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFlight ? '编辑航班配置' : '新增航班配置'}</DialogTitle>
          </DialogHeader>
          <form action={saveFlightConfig}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>仓库</Label>
                <Select name="warehouse" defaultValue={editingFlight?.warehouse}>
                  <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="东莞">东莞</SelectItem>
                    <SelectItem value="加工区">加工区</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>周几</Label>
                <Select name="weekday" defaultValue={editingFlight?.weekday}>
                  <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>关东普货路由</Label>
                <Select name="kanto_normal" defaultValue={editingFlight?.kanto_normal || ''}>
                  <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="空运">空运</SelectItem>
                    <SelectItem value="海空">海空</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>关西普货路由</Label>
                <Select name="kansai_normal" defaultValue={editingFlight?.kansai_normal || ''}>
                  <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="空运">空运</SelectItem>
                    <SelectItem value="海空">海空</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>关东特货路由</Label>
                <Select name="kanto_special" defaultValue={editingFlight?.kanto_special || ''}>
                  <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="空运">空运</SelectItem>
                    <SelectItem value="海空">海空</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>关西特货路由</Label>
                <Select name="kansai_special" defaultValue={editingFlight?.kansai_special || ''}>
                  <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="空运">空运</SelectItem>
                    <SelectItem value="海空">海空</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>备注</Label>
                <Input name="remark" defaultValue={editingFlight?.remark || ''} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFlightModalOpen(false)}>取消</Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* 目的港配置模态框 */}
      <Dialog open={portModalOpen} onOpenChange={setPortModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingPort ? '编辑目的港配置' : '新增目的港配置'}</DialogTitle>
          </DialogHeader>
          <form action={savePortConfig}>
            <div className="py-4 space-y-4">
              <div>
                <Label>目的港代码</Label>
                <Input name="port_code" placeholder="如：KIX、NRT" defaultValue={editingPort?.port_code} />
              </div>
              <div>
                <Label>所属区域</Label>
                <Select name="region" defaultValue={editingPort?.region}>
                  <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="关东">关东</SelectItem>
                    <SelectItem value="关西">关西</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPortModalOpen(false)}>取消</Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* 航空路由配置模态框 */}
      <Dialog open={routeModalOpen} onOpenChange={setRouteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoute ? '编辑航空路由配置' : '新增航空路由配置'}</DialogTitle>
          </DialogHeader>
          <form action={saveRouteConfig}>
            <div className="grid grid-cols-3 gap-4 py-4">
              <div>
                <Label>航班号</Label>
                <Input name="flight_no" placeholder="如：CA123" defaultValue={editingRoute?.flight_no} />
              </div>
              <div>
                <Label>始发</Label>
                <Input name="origin" placeholder="如：SZX" defaultValue={editingRoute?.origin} />
              </div>
              <div>
                <Label>中转</Label>
                <Input name="transfer" placeholder="如：PVG" defaultValue={editingRoute?.transfer || ''} />
              </div>
              <div>
                <Label>目的</Label>
                <Input name="dest" placeholder="如：NRT" defaultValue={editingRoute?.dest} />
              </div>
              <div>
                <Label>起飞时间</Label>
                <Input name="depart_time" type="time" defaultValue={editingRoute?.depart_time || ''} />
              </div>
              <div>
                <Label>落地时间</Label>
                <Input name="arrive_time" type="time" defaultValue={editingRoute?.arrive_time || ''} />
              </div>
              <div>
                <Label>是否隔天</Label>
                <Select name="is_next_day" defaultValue={editingRoute?.is_next_day || ''}>
                  <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="是">是</SelectItem>
                    <SelectItem value="否">否</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>二程航班</Label>
                <Input name="second_flight" defaultValue={editingRoute?.second_flight || ''} />
              </div>
              <div>
                <Label>路由</Label>
                <Select name="route_type" defaultValue={editingRoute?.route_type}>
                  <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="空运">空运</SelectItem>
                    <SelectItem value="海空">海空</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRouteModalOpen(false)}>取消</Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* 方数预估历史模态框 */}
      <Dialog open={volumeHistoryOpen} onOpenChange={setVolumeHistoryOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>方数预估历史记录</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>揽收日期</TableHead>
                  <TableHead>仓库</TableHead>
                  <TableHead>大包数</TableHead>
                  <TableHead>总方数</TableHead>
                  <TableHead>关东总</TableHead>
                  <TableHead>关西总</TableHead>
                  <TableHead>关东普货</TableHead>
                  <TableHead>关东特货</TableHead>
                  <TableHead>关西普货</TableHead>
                  <TableHead>关西特货</TableHead>
                  <TableHead>空运</TableHead>
                  <TableHead>海空</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volumeEstimates.map(estimate => (
                  <TableRow key={estimate.id}>
                    <TableCell>{estimate.collect_date}</TableCell>
                    <TableCell>{estimate.warehouse}</TableCell>
                    <TableCell>{estimate.package_count}</TableCell>
                    <TableCell>{estimate.total_volume}</TableCell>
                    <TableCell>{estimate.kanto_total}</TableCell>
                    <TableCell>{estimate.kansai_total}</TableCell>
                    <TableCell>{estimate.kanto_normal}</TableCell>
                    <TableCell>{estimate.kanto_special}</TableCell>
                    <TableCell>{estimate.kansai_normal}</TableCell>
                    <TableCell>{estimate.kansai_special}</TableCell>
                    <TableCell>{estimate.air_volume}</TableCell>
                    <TableCell>{estimate.sea_air_volume}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="destructive"
                        onClick={async () => {
                          if (confirm('确定删除？')) {
                            await fetch(`/api/volume-estimate/${estimate.id}`, { method: 'DELETE' });
                            loadVolumeEstimates();
                          }
                        }}>
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setVolumeHistoryOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 主单列表模态框 */}
      <Dialog open={orderListOpen} onOpenChange={setOrderListOpen}>
        <DialogContent className="!w-[95vw] !max-w-[95vw] !h-[90vh] !max-h-[90vh] p-6 flex flex-col" style={{ width: '95vw', maxWidth: '95vw', height: '90vh', maxHeight: '90vh' }}>
          <DialogHeader>
            <DialogTitle className="text-xl">主单列表</DialogTitle>
          </DialogHeader>
          <div className="mb-4 grid grid-cols-5 gap-3">
            <Input type="date" id="filter-order-date" placeholder="揽收日期" />
            <Select defaultValue="全部">
              <SelectTrigger><SelectValue placeholder="仓库" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="东莞">东莞</SelectItem>
                <SelectItem value="加工区">加工区</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="全部">
              <SelectTrigger><SelectValue placeholder="口岸" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="关东">关东</SelectItem>
                <SelectItem value="关西">关西</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="全部">
              <SelectTrigger><SelectValue placeholder="货物属性" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="普货">普货</SelectItem>
                <SelectItem value="特货">特货</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => {
              const date = (document.getElementById('filter-order-date') as HTMLInputElement).value;
              loadMainOrdersWithFilter(date);
            }}>查询</Button>
          </div>
          <div className="flex-1 overflow-auto border rounded-lg" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <Table className="w-full text-base">
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="bg-gray-50 text-center px-2">揽收日期</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">仓库</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">口岸</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">货物属性</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">类别</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">主单号</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">航班号</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">目的港</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">打货上限</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">起飞时间</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">二程航班</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">到港时间</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">实际件数</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">实际重量</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">实际体积</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">实际票数</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2">备注</TableHead>
                  <TableHead className="bg-gray-50 text-center px-2 sticky right-0">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mainOrders.slice(0, 100).map(order => (
                  <TableRow key={order.id} className="h-10">
                    <TableCell className="text-center">{order.collect_date}</TableCell>
                    <TableCell className="text-center">{order.warehouse}</TableCell>
                    <TableCell className="text-center">{order.port}</TableCell>
                    <TableCell className="text-center">{order.cargo_type}</TableCell>
                    <TableCell className="text-center">{order.category || '-'}</TableCell>
                    <TableCell className="text-center">{order.main_no || '-'}</TableCell>
                    <TableCell className="text-center">{order.flight_no || '-'}</TableCell>
                    <TableCell className="text-center">{order.dest || '-'}</TableCell>
                    <TableCell className="text-center">{order.max_volume || '-'}</TableCell>
                    <TableCell className="text-center">
                      {formatDateTime(order.actual_flight_date, order.depart_time) || '-'}
                    </TableCell>
                    <TableCell className="text-center">{order.second_flight || '-'}</TableCell>
                    <TableCell className="text-center">
                      {formatDateTime(order.actual_flight_date, order.arrive_time) || '-'}
                    </TableCell>
                    <TableCell className="text-center">{order.actual_pieces || '-'}</TableCell>
                    <TableCell className="text-center">{order.actual_weight || '-'}</TableCell>
                    <TableCell className="text-center">{order.actual_volume || '-'}</TableCell>
                    <TableCell className="text-center">{order.actual_bills || '-'}</TableCell>
                    <TableCell className="text-center truncate max-w-[100px]" title={order.remark || ''}>{order.remark || '-'}</TableCell>
                    <TableCell className="text-center sticky right-0 bg-white">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white mr-1"
                        onClick={() => {
                          setEditingOrder(order);
                          setOrderForm({
                            collect_date: order.collect_date,
                            depart_date: order.depart_date || '',
                            warehouse: order.warehouse,
                            cargo_type: order.cargo_type,
                            port: order.port,
                            status: order.status || '',
                            pack_req: order.pack_req || '',
                            max_volume: order.max_volume || '',
                            route_type: order.route_type || '',
                            actual_flight_date: order.actual_flight_date || '',
                            main_no: order.main_no || '',
                            flight_no: order.flight_no || '',
                            origin: order.origin || '',
                            transfer: order.transfer || '',
                            dest: order.dest || '',
                            second_flight: order.second_flight || '',
                            depart_time: order.depart_time || '',
                            arrive_time: order.arrive_time || '',
                            actual_pieces: order.actual_pieces?.toString() || '',
                            actual_weight: order.actual_weight || '',
                            actual_volume: order.actual_volume || '',
                            actual_bills: order.actual_bills?.toString() || '',
                            remark: order.remark || '',
                          });
                          setOrderListOpen(false);
                          setActiveTab('main-order');
                        }}>
                        编辑
                      </Button>
                      <Button size="sm" variant="destructive"
                        onClick={() => deleteMainOrder(order.id)}>
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {mainOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center text-gray-500 py-8">暂无记录</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="mt-4">
            <div className="text-sm text-gray-500 mr-auto">共 {mainOrders.length} 条记录</div>
            <Button variant="secondary" onClick={() => setOrderListOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
