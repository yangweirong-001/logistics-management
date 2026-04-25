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
import DateTimeRangePicker from '@/components/ui/date-time-range-picker';

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
  weight: number | null;
  actual_total_volume: number | null;
  total_volume: number | null;
  kanto_total: number | null;
  kansai_total: number | null;
  kanto_normal: number | null;
  kanto_special: number | null;
  kansai_normal: number | null;
  kansai_special: number | null;
  air_volume: number | null;
  sea_air_volume: number | null;
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
  issue_card: string | null;
}

interface FlightException {
  id: number;
  depart_date: string;
  flight_date: string;
  flight_no: string;
  main_no: string;
  bills: number;
  origin: string;
  transfer: string | null;
  dest: string;
  exception_reason: string;
  remark: string | null;
  created_at: string;
  updated_at: string | null;
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
const exportToExcel = (data: MainOrder[], filename: string, routeConfigs: RouteConfig[]) => {
  // 定义列标题和对应的字段
  const headers = [
    '揽收日期', '揽收星期', '发货日期', '发货星期', '仓库', '货物属性', '口岸', '类别',
    '状态', '打包要求', '打货上限方数', '打货上限件数', '预估方数', '预估件数',
    '路由类型', '需求航班日期', '实际航班日期', '主单号', '航班号', '起飞港',
    '中转港', '目的港', '起飞时间', '到港时间', '实际件数', '实际重量', '实际方数',
    '实际票数', '备注'
  ];

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

  // 格式化起飞时间（日期 + 时间）- v2
  const formatDepartureDateTime = (dateStr: string | null | undefined, timeStr: string | null | undefined): string => {
    // 如果日期为空（包括空字符串），只返回时间
    if (!dateStr || dateStr === '') return formatTime(timeStr);
    // 如果时间为空（包括空字符串），只返回日期
    if (!timeStr || timeStr === '') return dateStr;
    // 否则返回 日期 + 时间
    return `${dateStr} ${formatTime(timeStr)}`;
  };

  // 添加天数
  const addDays = (dateStr: string, days: number) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  // 计算预计落地时间的辅助函数（用于Excel导出）
  const formatArrivalDateTimeForExport = (
    order: MainOrder
  ): string => {
    const { flight_no, origin, transfer, dest, actual_flight_date, depart_time, arrive_time } = order;

    if (!actual_flight_date) return formatTime(arrive_time);
    if (!arrive_time) return actual_flight_date;

    // 查找匹配的路由配置
    const transferValue = (transfer || '').trim();
    const matchedRoute = routeConfigs.find(r => {
      const routeTransfer = (r.transfer || '').trim();
      // 中转站匹配：两边都为空（包括 '-'）视为匹配
      const transferMatch =
        (routeTransfer === '' || routeTransfer === '-') &&
        (transferValue === '' || transferValue === '-')
          ? true
          : routeTransfer === transferValue;

      return (
        r.flight_no === flight_no &&
        r.origin === origin &&
        transferMatch &&
        r.dest === dest
      );
    });

    // 判断是否隔天
    let isNextDay = false;
    if (matchedRoute) {
      // 使用路由配置中的 is_next_day 字段
      isNextDay = matchedRoute.is_next_day === '是' || matchedRoute.is_next_day === 'yes';
    } else {
      // 如果找不到路由配置，使用时间比较作为备用方案
      if (depart_time && arrive_time) {
        isNextDay = depart_time > arrive_time;
      }
    }

    const arrivalDate = isNextDay ? addDays(actual_flight_date, 1) : actual_flight_date;
    return `${arrivalDate} ${formatTime(arrive_time)}`;
  };

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
    (() => {
      const result = formatDepartureDateTime(order.actual_flight_date, order.depart_time);
      console.log('导出起飞时间 - ID:', order.id, 'actual_flight_date:', order.actual_flight_date, 'depart_time:', order.depart_time, 'result:', result);
      return result;
    })(),
    formatArrivalDateTimeForExport(order),
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

// 导出航空路由配置到Excel
const exportRouteConfigs = (data: RouteConfig[], filename: string) => {
  // 定义列标题和对应的字段
  const headers = [
    '航班号', '始发站', '中转站', '目的站', '路由类型', '二程航班', '起飞时间', '落地时间', '是否隔天'
  ];

  // 转换数据
  const rows = data.map(route => [
    route.flight_no || '',
    route.origin || '',
    route.transfer || '',
    route.dest || '',
    route.route_type || '',
    route.second_flight || '',
    route.depart_time || '',
    route.arrive_time || '',
    route.is_next_day || ''
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
  const [flightExceptions, setFlightExceptions] = useState<FlightException[]>([]);

  // 航班异常编辑状态
  const [editingFlightException, setEditingFlightException] = useState<FlightException | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
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
    configuredAirVolume: number;
    configuredSeaAirVolume: number;
    unconfiguredVolume: number;
  } | null>(null);

  // 实际配置明细
  const [configDetailResult, setConfigDetailResult] = useState<{
    airConfig: {
      kantoNormal: number;
      kantoSpecial: number;
      kansaiNormal: number;
      kansaiSpecial: number;
    };
    seaAirConfig: {
      kantoNormal: number;
      kantoSpecial: number;
      kansaiNormal: number;
      kansaiSpecial: number;
    };
  } | null>(null);
  
  // 模态框状态
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [flightModalOpen, setFlightModalOpen] = useState(false);
  const [portModalOpen, setPortModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [volumeHistoryOpen, setVolumeHistoryOpen] = useState(false);
  const [orderListOpen, setOrderListOpen] = useState(false);
  const [remarkDetailOpen, setRemarkDetailOpen] = useState(false);
  const [currentRemark, setCurrentRemark] = useState('');

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
    actual_total_volume: 0,
    is_complete: '是',
  });

  // 实际配置明细表单
  const [configDetailForm, setConfigDetailForm] = useState({
    collect_date: '',
    warehouse: '',
    package_count: 0,
    weight: 0,
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
    issue_card: '否',
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

  // 计算预计落地时间（使用路由配置中的 is_next_day 字段）
  const formatArrivalDateTime = (
    order: Pick<MainOrder, 'flight_no' | 'origin' | 'transfer' | 'dest' | 'actual_flight_date' | 'depart_time' | 'arrive_time'>
  ): string => {
    const { flight_no, origin, transfer, dest, actual_flight_date, arrive_time } = order;

    if (!actual_flight_date) return formatTime(arrive_time);
    if (!arrive_time) return actual_flight_date;

    // 查找匹配的路由配置
    const transferValue = (transfer || '').trim();
    const matchedRoute = routeConfigs.find(r => {
      const routeTransfer = (r.transfer || '').trim();
      // 中转站匹配：两边都为空（包括 '-'）视为匹配
      const transferMatch =
        (routeTransfer === '' || routeTransfer === '-') &&
        (transferValue === '' || transferValue === '-')
          ? true
          : routeTransfer === transferValue;

      return (
        r.flight_no === flight_no &&
        r.origin === origin &&
        transferMatch &&
        r.dest === dest
      );
    });

    // 判断是否隔天
    let isNextDay = false;
    if (matchedRoute) {
      // 使用路由配置中的 is_next_day 字段
      isNextDay = matchedRoute.is_next_day === '是' || matchedRoute.is_next_day === 'yes';
    } else {
      // 如果找不到路由配置，使用时间比较作为备用方案
      const { depart_time } = order;
      if (depart_time && arrive_time) {
        isNextDay = depart_time > arrive_time;
      }
    }

    const arrivalDate = isNextDay ? addDays(actual_flight_date, 1) : actual_flight_date;
    return `${arrivalDate} ${formatTime(arrive_time)}`;
  };

  // 主单查询条件
  const [orderQueryStartDate, setOrderQueryStartDate] = useState<Date | null>(null);
  const [orderQueryEndDate, setOrderQueryEndDate] = useState<Date | null>(null);
  const [orderQueryDepartStartDate, setOrderQueryDepartStartDate] = useState<Date | null>(null);
  const [orderQueryDepartEndDate, setOrderQueryDepartEndDate] = useState<Date | null>(null);
  const [orderQueryWarehouse, setOrderQueryWarehouse] = useState('全部');
  const [orderQueryCargoType, setOrderQueryCargoType] = useState('全部');
  const [orderQueryOrigin, setOrderQueryOrigin] = useState('全部');
  const [orderQueryRouteType, setOrderQueryRouteType] = useState('全部');
  const [orderQueryIssueCard, setOrderQueryIssueCard] = useState('全部');
  const [orderQueryMainOrderNo, setOrderQueryMainOrderNo] = useState('');
  const [uniqueOrigins, setUniqueOrigins] = useState<string[]>([]);

  // 日期选择器打开状态（用于控制固定表头显示）
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // 方数预估筛选条件
  const [volumeFilterStartDate, setVolumeFilterStartDate] = useState('');
  const [volumeFilterEndDate, setVolumeFilterEndDate] = useState('');
  const [volumeFilterWarehouse, setVolumeFilterWarehouse] = useState('全部');

  // 主单列表筛选条件
  const [orderListFilterDate, setOrderListFilterDate] = useState('');
  const [orderListFilterWarehouse, setOrderListFilterWarehouse] = useState('全部');
  const [orderListFilterPort, setOrderListFilterPort] = useState('全部');
  const [orderListFilterCargoType, setOrderListFilterCargoType] = useState('全部');

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
  
  const loadMainOrdersWithFilter = async (collectDate?: string, warehouse?: string, port?: string, cargoType?: string) => {
    const params = new URLSearchParams();
    if (collectDate) params.append('collectDate', collectDate);
    if (warehouse && warehouse !== '全部') params.append('warehouse', warehouse);
    if (port && port !== '全部') params.append('port', port);
    if (cargoType && cargoType !== '全部') params.append('cargoType', cargoType);

    const url = `/api/main-order${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) setMainOrders(data.data);
  };

  const loadFlightExceptions = async () => {
    const res = await fetch('/api/flight-exception');
    const data = await res.json();
    if (data.success) setFlightExceptions(data.data);
  };

  // 导出航班异常记录为Excel
  const exportFlightExceptions = () => {
    if (flightExceptions.length === 0) {
      alert('没有数据可导出');
      return;
    }

    // 创建CSV内容
    const headers = ['发车日期', '航班日期', '航班号', '主单号', '票数', '始发港', '中转站', '目的港', '异常原因', '备注', '创建时间'];
    const rows = flightExceptions.map(item => [
      item.depart_date,
      item.flight_date,
      item.flight_no,
      item.main_no,
      item.bills,
      item.origin,
      item.transfer || '-',
      item.dest,
      item.exception_reason,
      item.remark || '-',
      new Date(item.created_at).toLocaleString('zh-CN'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // 添加BOM以支持中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `航班异常记录_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 打开编辑弹窗
  const openEditFlightException = (item: FlightException) => {
    setEditingFlightException(item);
    setIsEditDialogOpen(true);
  };

  // 保存编辑的航班异常记录
  const saveFlightExceptionEdit = async () => {
    if (!editingFlightException) return;

    try {
      const response = await fetch('/api/flight-exception', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingFlightException.id,
          exceptionReason: editingFlightException.exception_reason,
          remark: editingFlightException.remark,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        alert('更新失败: ' + (result.error || '未知错误'));
        return;
      }

      alert('更新成功');
      setIsEditDialogOpen(false);
      setEditingFlightException(null);
      loadFlightExceptions();
    } catch (error) {
      alert('更新失败: ' + (error instanceof Error ? error.message : '网络错误'));
    }
  };
  
  // 主单查询
  const queryMainOrders = async () => {
    let url = '/api/main-order';
    const params = new URLSearchParams();

    // 揽收日期范围筛选
    if (orderQueryStartDate && orderQueryEndDate) {
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      params.append('startDate', formatDate(orderQueryStartDate));
      params.append('endDate', formatDate(orderQueryEndDate));
    } else if (orderQueryStartDate) {
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      params.append('collectDate', formatDate(orderQueryStartDate));
    }

    // 预计起飞日期范围筛选
    if (orderQueryDepartStartDate && orderQueryDepartEndDate) {
      const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      params.append('departStartDate', formatDateTime(orderQueryDepartStartDate));
      params.append('departEndDate', formatDateTime(orderQueryDepartEndDate));
    }

    // 仓库筛选
    if (orderQueryWarehouse && orderQueryWarehouse !== '全部') {
      params.append('warehouse', orderQueryWarehouse);
    }

    // 始发筛选
    if (orderQueryOrigin && orderQueryOrigin !== '全部') {
      params.append('origin', orderQueryOrigin);
    }

    // 路由类型筛选
    if (orderQueryRouteType && orderQueryRouteType !== '全部') {
      params.append('routeType', orderQueryRouteType);
    }

    // 货物属性筛选
    if (orderQueryCargoType && orderQueryCargoType !== '全部') {
      params.append('cargoType', orderQueryCargoType);
    }

    // 是否开具售卡筛选
    if (orderQueryIssueCard && orderQueryIssueCard !== '全部') {
      params.append('issueCard', orderQueryIssueCard);
    }

    // 主单号筛选
    if (orderQueryMainOrderNo) {
      params.append('mainOrderNo', orderQueryMainOrderNo);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      setMainOrders(data.data);
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
    loadFlightExceptions();

  }, []);

  // Markdown 转 HTML 辅助函数
  const markdownToHtml = (markdown: string): string => {
    let html = markdown;
    
    // 标题
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    
    // 流程步骤块
    html = html.replace(/^\【第(.*)步：(.*?)】/gim, '<div class="flow-step"><div class="flow-step-title">第$1步：$2</div>');
    html = html.replace(/^│$/gim, '</div>');
    
    // 粗体
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    
    // 代码块
    html = html.replace(/```(\w*)([\s\S]*?)```/gim, '<pre><code class="language-$1">$2</code></pre>');
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
    
    // 列表
    html = html.replace(/^├─ (.*)$/gim, '<li>$1</li>');
    html = html.replace(/^│  ├── (.*)$/gim, '<li style="margin-left: 20px;">$1</li>');
    html = html.replace(/^│  │  ├── (.*)$/gim, '<li style="margin-left: 40px;">$1</li>');
    html = html.replace(/^│  └── (.*)$/gim, '<li style="margin-left: 20px;">$1</li>');
    html = html.replace(/^└── (.*)$/gim, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*)$/gim, '<li>$1</li>');
    
    // 公式
    html = html.replace(/^([a-zA-Z\u4e00-\u9fa5\s]+)=([\s\S]*?)$/gm, (match, left, right) => {
      if (left.includes('=') || right.includes('\n')) return match;
      return `<div class="formula"><strong>${left.trim()}</strong> = ${right.trim()}</div>`;
    });
    
    // 分隔线
    html = html.replace(/^---$/gim, '<hr>');
    
    // 引用
    html = html.replace(/^> (.*)$/gim, '<blockquote>$1</blockquote>');
    
    // 段落
    html = html.replace(/\n\n/g, '</p><p>');
    
    return html;
  };

  // 渲染逻辑流程文档
  const renderLogicFlowDoc = () => {
    return (
      <div className="logic-flow-doc">
        <h1>物流管理系统 - 模块逻辑流程文档</h1>
        <p><strong>版本：</strong>v1.0 | <strong>更新日期：</strong>2026-04-06</p>
        
        <h2>文档说明</h2>
        <p>本文档说明各个模块之间的数据流和计算逻辑，帮助理解系统运作方式。</p>
        
        <h2>1. 方数预估模块逻辑</h2>
        
        <h3>1.1 输入数据</h3>
        <pre><code>用户输入：
├── 揽收日期
├── 仓库（东莞/加工区/全部）
├── 揽收大包数
├── 重量
└── 货物袋数是否齐全</code></pre>
        
        <h3>1.2 计算流程</h3>
        
        <div className="flow-step">
          <div className="flow-step-title">第一步：获取区域参数配置</div>
          <ul>
            <li>查询条件：warehouse = 用户选择的仓库</li>
            <li>如果找不到当天的配置：查找前一天的配置（递归查找）</li>
            <li>获取：大包预估体积、关东/关西目的港占比、关东/关西普货/特货占比</li>
          </ul>
        </div>
        
        <div className="flow-step">
          <div className="flow-step-title">第二步：获取航班配置</div>
          <ul>
            <li>查询条件：warehouse + weekday</li>
            <li>获取：关东/关西普货/特货的路由类型</li>
          </ul>
        </div>
        
        <div className="flow-step">
          <div className="flow-step-title">第三步：计算基础信息</div>
          <div className="formula"><strong>总方数</strong> = 揽收大包数 × 大包预估体积</div>
          <div className="formula"><strong>关东总方数</strong> = 总方数 × 关东目的港占比 / 100</div>
          <div className="formula"><strong>关西总方数</strong> = 总方数 × 关西目的港占比 / 100</div>
        </div>
        
        <div className="flow-step">
          <div className="flow-step-title">第四步：计算货物分类</div>
          <ul>
            <li>关东普货 = 关东总方数 × 关东普货占比 / 100</li>
            <li>关东特货 = 关东总方数 × 关东特货占比 / 100</li>
            <li>关西普货 = 关西总方数 × 关西普货占比 / 100</li>
            <li>关西特货 = 关西总方数 × 关西特货占比 / 100</li>
          </ul>
        </div>
        
        <div className="flow-step">
          <div className="flow-step-title">第五步：计算应配置方数</div>
          <ul>
            <li>应配置空运方数 = 所有路由类型为"空运"的货物分类之和</li>
            <li>应配置海空方数 = 所有路由类型为"海空"的货物分类之和</li>
          </ul>
        </div>
        
        <div className="flow-step">
          <div className="flow-step-title">第六步：获取已保存的主单数据</div>
          <ul>
            <li>查询条件：collect_date + warehouse + route_type</li>
            <li>对每个主单，确定有效方数（多级回退）：</li>
            <li>优先级1：actual_volume（实际方数，如果 {'>'} 0）</li>
            <li>优先级2：max_volume（打货上限，如果 {'>'} 0）</li>
            <li>优先级3：est_volume（预估方数，如果 {'>'} 0）</li>
            <li>默认：0</li>
          </ul>
        </div>
        
        <div className="flow-step">
          <div className="flow-step-title">第七步：计算实际配置和未配置</div>
          <div className="formula"><strong>未配置方数</strong> = 总方数 - 实际配置空运方数 - 实际配置海空方数</div>
        </div>
        
        <h3>1.3 仓库为"全部"时的特殊逻辑</h3>
        <p>当用户选择仓库 = "全部"时，系统会汇总所有仓库的数据。</p>
        
        <h2>2. 主单发放模块逻辑</h2>
        
        <h3>2.1 自动计算流程</h3>
        
        <div className="flow-step">
          <div className="flow-step-title">第一步：自动计算类别</div>
          <div className="formula"><strong>类别</strong> = 口岸 + 货物属性</div>
          <p>例1：关东 + 普货 = "关东普货"</p>
        </div>
        
        <div className="flow-step">
          <div className="flow-step-title">第二步：自动计算打货上限件数</div>
          <div className="formula"><strong>打货上限件数</strong> = 打货上限 / 单件体积（向下取整）</div>
        </div>
        
        <div className="flow-step">
          <div className="flow-step-title">第三步：自动查找预估方数</div>
          <ul>
            <li>查找顺序：当天 → 前一天 → 前2天...（最多查找7天）</li>
            <li>根据类别匹配对应的数值</li>
          </ul>
        </div>
        
        <div className="flow-step">
          <div className="flow-step-title">第四步：自动匹配路由配置</div>
          <ul>
            <li>触发条件：用户填写了 航班号 + 始发机场 + 目的机场</li>
            <li>自动填充：起飞时间、到港时间、二程航班、路由类型</li>
          </ul>
        </div>
        
        <div className="flow-step">
          <div className="flow-step-title">第五步：自动判断到港日期</div>
          <ul>
            <li>根据 is_next_day 字段判断是否隔天</li>
            <li>如果 is_next_day = "是"：到港日期 = 实际起飞日期 + 1天</li>
          </ul>
        </div>
        
        <h2>3. 欠方余方查询逻辑</h2>
        
        <h3>3.1 计算流程</h3>
        
        <div className="flow-step">
          <div className="flow-step-title">第一步：查找方数预估</div>
          <ul>
            <li>查询条件：collect_date + warehouse</li>
            <li>数据完整性检查：如果 is_complete = "否"，继续查找前一天</li>
          </ul>
        </div>
        
        <div className="flow-step">
          <div className="flow-step-title">第二步：汇总打货上限</div>
          <div className="formula"><strong>打货上限</strong> = Σ 主单.max_volume</div>
        </div>
        
        <div className="flow-step">
          <div className="flow-step-title">第三步：计算差异</div>
          <div className="formula"><strong>差异</strong> = 预估方数 - 打货上限</div>
          <div className="formula"><strong>欠方</strong> = 差异 {'>'} 0 ? 差异 : 0</div>
          <div className="formula"><strong>余方</strong> = 差异 {'<'} 0 ? Math.abs(差异) : 0</div>
        </div>
        
        <h2>4. 模块间数据流关系</h2>
        <pre><code>区域参数配置 ──提供──→ 方数预估（大包预估体积、占比）
航班配置 ──提供──→ 方数预估（路由类型）
目的港配置 ──提供──→ 主单发放（dest 映射到 port）
航空路由配置 ──提供──→ 主单发放（航班信息、路由类型）

方数预估 ←读取→ 区域参数配置、航班配置、主单发放
主单发放 ←读取→ 区域参数配置、目的港配置、航空路由配置、方数预估
欠方余方查询 ←读取→ 方数预估、主单发放</code></pre>
        
        <h2>5. 关键计算公式汇总</h2>
        
        <h3>5.1 方数预估</h3>
        <div className="formula"><strong>总方数</strong> = 揽收大包数 × 大包预估体积</div>
        <div className="formula"><strong>关东总方数</strong> = 总方数 × 关东目的港占比 / 100</div>
        <div className="formula"><strong>关西总方数</strong> = 总方数 × 关西目的港占比 / 100</div>
        <div className="formula"><strong>未配置方数</strong> = 总方数 - 空运主单已配置方数 - 海空主单已配置方数</div>
        
        <h3>5.2 主单发放</h3>
        <div className="formula"><strong>类别</strong> = 口岸 + 货物属性</div>
        <div className="formula"><strong>打货上限件数</strong> = 打货上限 / 单件体积（向下取整）</div>
        
        <h3>5.3 欠方余方查询</h3>
        <div className="formula"><strong>差异</strong> = 预估方数 - 打货上限</div>
        <div className="formula"><strong>欠方</strong> = 差异 {'>'} 0 ? 差异 : 0</div>
        <div className="formula"><strong>余方</strong> = 差异 {'<'} 0 ? Math.abs(差异) : 0</div>
        
        <h2>6. 常见场景示例</h2>
        
        <h3>6.1 场景一：新的一天开始，如何进行方数预估？</h3>
        <ol>
          <li>进入"方数预估"模块</li>
          <li>输入揽收日期、仓库、揽收大包数、重量、货物袋数是否齐全</li>
          <li>系统自动计算各方数</li>
          <li>点击"保存数据"按钮</li>
        </ol>
        
        <h3>6.2 场景二：如何创建一个新主单？</h3>
        <ol>
          <li>进入"主单发放"模块</li>
          <li>填写基础信息（系统自动计算类别和预估方数）</li>
          <li>填写打货上限（系统自动计算打货上限件数）</li>
          <li>填写航班信息（系统自动匹配路由配置）</li>
          <li>填写实际数据</li>
          <li>点击"保存"按钮</li>
        </ol>
        
        <h3>6.3 场景三：如何查看欠方余方情况？</h3>
        <ol>
          <li>进入"欠方余方查询"模块</li>
          <li>输入揽收日期和筛选条件</li>
          <li>点击"查询"按钮</li>
          <li>系统自动计算欠方/余方结果</li>
        </ol>
        
        <h2>7. 数据完整性检查</h2>
        
        <h3>7.1 方数预估前检查</h3>
        <ul>
          <li>区域参数配置是否完整？</li>
          <li>航班配置是否完整？</li>
        </ul>
        
        <h3>7.2 主单发放前检查</h3>
        <ul>
          <li>方数预估是否已保存？</li>
          <li>目的港配置是否完整？</li>
          <li>航空路由配置是否完整？</li>
        </ul>
        
        <hr />
        <p className="text-center text-gray-500"><strong>文档结束</strong></p>
      </div>
    );
  };

  // 初始加载
  useEffect(() => {
    loadAreaConfigs();
    loadFlightConfigs();
    loadPortConfigs();
    loadRouteConfigs();
    loadVolumeEstimates();
    loadMainOrders();
    loadFlightExceptions();

  }, []);

  // 监听volumeForm变化，自动计算（延迟执行避免频繁计算）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (volumeForm.warehouse && volumeForm.package_count > 0 && volumeForm.collect_date && areaConfigs.length > 0) {

        // 判断是否为"全部"仓库
        if (volumeForm.warehouse === '全部') {
          // 汇总所有仓库的数据
          const warehouses = ['东莞', '加工区'];
          let totalVolume = 0;
          let kantoTotal = 0;
          let kansaiTotal = 0;
          let kantoNormal = 0;
          let kantoSpecial = 0;
          let kansaiNormal = 0;
          let kansaiSpecial = 0;
          let airVolume = 0;
          let seaAirVolume = 0;
          let configuredAirVolume = 0;
          let configuredSeaAirVolume = 0;

          const weekday = getWeekday(volumeForm.collect_date);

          warehouses.forEach(wh => {
            const areaConfig = areaConfigs.find(a => a.warehouse === wh);
            if (areaConfig) {
              try {
                const packageVolume = parseFloat(areaConfig.package_volume) || 0;
                // 汇总所有仓库的 package_count
                const packageCount = volumeEstimates
                  .filter(e => e.collect_date === volumeForm.collect_date && e.warehouse === wh)
                  .reduce((sum, e) => sum + (e.package_count || 0), 0);

                const whTotalVolume = packageVolume * packageCount;

                const kantoRatio = (parseFloat(areaConfig.kanto_ratio) || 0) / 100;
                const kansaiRatio = (parseFloat(areaConfig.kansai_ratio) || 0) / 100;
                const kantoNormalRatio = (parseFloat(areaConfig.kanto_normal_ratio) || 0) / 100;
                const kantoSpecialRatio = (parseFloat(areaConfig.kanto_special_ratio) || 0) / 100;
                const kansaiNormalRatio = (parseFloat(areaConfig.kansai_normal_ratio) || 0) / 100;
                const kansaiSpecialRatio = (parseFloat(areaConfig.kansai_special_ratio) || 0) / 100;

                const whKantoTotal = whTotalVolume * kantoRatio;
                const whKansaiTotal = whTotalVolume * kansaiRatio;
                const whKantoNormal = whKantoTotal * kantoNormalRatio;
                const whKantoSpecial = whKantoTotal * kantoSpecialRatio;
                const whKansaiNormal = whKansaiTotal * kansaiNormalRatio;
                const whKansaiSpecial = whKansaiTotal * kansaiSpecialRatio;

                // 汇总
                totalVolume += whTotalVolume;
                kantoTotal += whKantoTotal;
                kansaiTotal += whKansaiTotal;
                kantoNormal += whKantoNormal;
                kantoSpecial += whKantoSpecial;
                kansaiNormal += whKansaiNormal;
                kansaiSpecial += whKansaiSpecial;

                // 查找该仓库的航班配置
                const flightConfig = flightConfigs.find(f => f.warehouse === wh && f.weekday === weekday);
                if (flightConfig) {
                  if (flightConfig.kanto_normal === '空运') airVolume += whKantoNormal;
                  else if (flightConfig.kanto_normal === '海空') seaAirVolume += whKantoNormal;
                  if (flightConfig.kanto_special === '空运') airVolume += whKantoSpecial;
                  else if (flightConfig.kanto_special === '海空') seaAirVolume += whKantoSpecial;
                  if (flightConfig.kansai_normal === '空运') airVolume += whKansaiNormal;
                  else if (flightConfig.kansai_normal === '海空') seaAirVolume += whKansaiNormal;
                  if (flightConfig.kansai_special === '空运') airVolume += whKansaiSpecial;
                  else if (flightConfig.kansai_special === '海空') seaAirVolume += whKansaiSpecial;
                }
              } catch (err) {
                console.error(`计算仓库 ${wh} 时出错:`, err);
              }
            }

            // 汇总主单已配置方数
            configuredAirVolume += mainOrders
              .filter(o => o.collect_date === volumeForm.collect_date && o.warehouse === wh && o.route_type === '空运')
              .reduce((sum, o) => sum + getEffectiveVolume(o), 0);

            configuredSeaAirVolume += mainOrders
              .filter(o => o.collect_date === volumeForm.collect_date && o.warehouse === wh && o.route_type === '海空')
              .reduce((sum, o) => sum + getEffectiveVolume(o), 0);
          });

          // 计算未配置方数
          const unconfiguredVolume = totalVolume - configuredAirVolume - configuredSeaAirVolume;

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
            configuredAirVolume,
            configuredSeaAirVolume,
            unconfiguredVolume,
          });

        } else {
          // 单个仓库的计算逻辑（原有逻辑）
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

              // 计算主单已配置方数：从主单发放中筛选
              const configuredAirVolume = mainOrders
                .filter(o => o.collect_date === volumeForm.collect_date && o.warehouse === volumeForm.warehouse && o.route_type === '空运')
                .reduce((sum, o) => sum + getEffectiveVolume(o), 0);

              const configuredSeaAirVolume = mainOrders
                .filter(o => o.collect_date === volumeForm.collect_date && o.warehouse === volumeForm.warehouse && o.route_type === '海空')
                .reduce((sum, o) => sum + getEffectiveVolume(o), 0);

              // 计算未配置方数：总方数 - 空运主单已配置方数 - 海空主单已配置方数
              const unconfiguredVolume = totalVolume - configuredAirVolume - configuredSeaAirVolume;

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
                configuredAirVolume,
                configuredSeaAirVolume,
                unconfiguredVolume,
              });
            } catch {
              setVolumeResult(null);
            }
          } else {
            setVolumeResult(null);
          }
        }
      }
    }, 100);

    return () => clearTimeout(timer);

  }, [volumeForm.collect_date, volumeForm.warehouse, volumeForm.package_count, areaConfigs, flightConfigs, mainOrders, volumeEstimates]);

  // 计算实际配置明细
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('实际配置明细计算触发:', {
        collect_date: configDetailForm.collect_date,
        warehouse: configDetailForm.warehouse,
        mainOrdersCount: mainOrders.length
      });

      // 只需要选择日期，如果没有选择仓库，默认使用"全部"
      if (configDetailForm.collect_date) {

        let airConfig = {
          kantoNormal: 0,
          kantoSpecial: 0,
          kansaiNormal: 0,
          kansaiSpecial: 0,
        };

        let seaAirConfig = {
          kantoNormal: 0,
          kantoSpecial: 0,
          kansaiNormal: 0,
          kansaiSpecial: 0,
        };

        // 如果没有选择仓库，默认使用"全部"
        const warehouse = configDetailForm.warehouse || '全部';

        // 根据选择的仓库类型进行计算
        if (warehouse === '全部') {
          // 汇总所有仓库的数据
          console.log('计算模式：全部仓库');
          const warehouses = ['东莞', '加工区'];

          warehouses.forEach(wh => {
            // 空运配置明细
            airConfig.kantoNormal += mainOrders
              .filter(o =>
                o.collect_date === configDetailForm.collect_date &&
                o.warehouse === wh &&
                o.category === '关东普货' &&
                o.route_type === '空运'
              )
              .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);

            airConfig.kantoSpecial += mainOrders
              .filter(o =>
                o.collect_date === configDetailForm.collect_date &&
                o.warehouse === wh &&
                o.category === '关东特货' &&
                o.route_type === '空运'
              )
              .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);

            airConfig.kansaiNormal += mainOrders
              .filter(o =>
                o.collect_date === configDetailForm.collect_date &&
                o.warehouse === wh &&
                o.category === '关西普货' &&
                o.route_type === '空运'
              )
              .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);

            airConfig.kansaiSpecial += mainOrders
              .filter(o =>
                o.collect_date === configDetailForm.collect_date &&
                o.warehouse === wh &&
                o.category === '关西特货' &&
                o.route_type === '空运'
              )
              .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);

            // 海空配置明细
            seaAirConfig.kantoNormal += mainOrders
              .filter(o =>
                o.collect_date === configDetailForm.collect_date &&
                o.warehouse === wh &&
                o.category === '关东普货' &&
                o.route_type === '海空'
              )
              .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);

            seaAirConfig.kantoSpecial += mainOrders
              .filter(o =>
                o.collect_date === configDetailForm.collect_date &&
                o.warehouse === wh &&
                o.category === '关东特货' &&
                o.route_type === '海空'
              )
              .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);

            seaAirConfig.kansaiNormal += mainOrders
              .filter(o =>
                o.collect_date === configDetailForm.collect_date &&
                o.warehouse === wh &&
                o.category === '关西普货' &&
                o.route_type === '海空'
              )
              .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);

            seaAirConfig.kansaiSpecial += mainOrders
              .filter(o =>
                o.collect_date === configDetailForm.collect_date &&
                o.warehouse === wh &&
                o.category === '关西特货' &&
                o.route_type === '海空'
              )
              .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);
          });

        } else {
          // 单个仓库的计算逻辑
          console.log('计算模式：单个仓库 -', warehouse);
          // 空运配置明细
          airConfig.kantoNormal = mainOrders
            .filter(o =>
              o.collect_date === configDetailForm.collect_date &&
              o.warehouse === warehouse &&
              o.category === '关东普货' &&
              o.route_type === '空运'
            )
            .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);

          airConfig.kantoSpecial = mainOrders
            .filter(o =>
              o.collect_date === configDetailForm.collect_date &&
              o.warehouse === warehouse &&
              o.category === '关东特货' &&
              o.route_type === '空运'
            )
            .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);

          airConfig.kansaiNormal = mainOrders
            .filter(o =>
              o.collect_date === configDetailForm.collect_date &&
              o.warehouse === warehouse &&
              o.category === '关西普货' &&
              o.route_type === '空运'
            )
            .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);

          airConfig.kansaiSpecial = mainOrders
            .filter(o =>
              o.collect_date === configDetailForm.collect_date &&
              o.warehouse === warehouse &&
              o.category === '关西特货' &&
              o.route_type === '空运'
            )
            .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);

          // 海空配置明细
          seaAirConfig.kantoNormal = mainOrders
            .filter(o =>
              o.collect_date === configDetailForm.collect_date &&
              o.warehouse === warehouse &&
              o.category === '关东普货' &&
              o.route_type === '海空'
            )
            .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);

          seaAirConfig.kantoSpecial = mainOrders
            .filter(o =>
              o.collect_date === configDetailForm.collect_date &&
              o.warehouse === warehouse &&
              o.category === '关东特货' &&
              o.route_type === '海空'
            )
            .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);

          seaAirConfig.kansaiNormal = mainOrders
            .filter(o =>
              o.collect_date === configDetailForm.collect_date &&
              o.warehouse === warehouse &&
              o.category === '关西普货' &&
              o.route_type === '海空'
            )
            .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);

          seaAirConfig.kansaiSpecial = mainOrders
            .filter(o =>
              o.collect_date === configDetailForm.collect_date &&
              o.warehouse === warehouse &&
              o.category === '关西特货' &&
              o.route_type === '海空'
            )
            .reduce((sum, o) => sum + getConfigDetailVolume(o), 0);
        }

        console.log('设置配置明细结果:', { airConfig, seaAirConfig });
        setConfigDetailResult({
          airConfig,
          seaAirConfig,
        });

      } else {
        console.log('清空配置明细结果');
        setConfigDetailResult(null);
      }
    }, 100);

    return () => clearTimeout(timer);

  }, [configDetailForm.collect_date, configDetailForm.warehouse, mainOrders]);

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
            actual_total_volume: volumeForm.actual_total_volume || null,
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
            actual_total_volume: volumeForm.actual_total_volume || null,
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
      setVolumeForm({ collect_date: '', warehouse: '', package_count: 0, weight: 0, actual_total_volume: 0, is_complete: '是' });
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
      actual_total_volume: record.actual_total_volume || 0,
      is_complete: record.is_complete || '是',
    });
  };

  // 根据揽收日期和仓库自动加载记录
  const loadVolumeEstimateByDateAndWarehouse = (collectDate: string, warehouse: string) => {
    if (!collectDate || !warehouse) return;

    if (warehouse === '全部') {
      // 汇总所有仓库的数据
      const records = volumeEstimates.filter(e => e.collect_date === collectDate);
      if (records.length > 0) {
        // 汇总所有字段
        const summarizedRecord: VolumeEstimate = {
          id: 0, // 汇总记录没有ID
          collect_date: collectDate,
          warehouse: '全部',
          weekday: records[0].weekday || null,
          package_count: records.reduce((sum, r) => sum + (r.package_count || 0), 0),
          weight: records.reduce((sum, r) => sum + (r.weight || 0), 0),
          actual_total_volume: records.reduce((sum, r) => sum + (r.actual_total_volume || 0), 0),
          total_volume: records.reduce((sum, r) => sum + (r.total_volume || 0), 0),
          kanto_total: records.reduce((sum, r) => sum + (r.kanto_total || 0), 0),
          kansai_total: records.reduce((sum, r) => sum + (r.kansai_total || 0), 0),
          kanto_normal: records.reduce((sum, r) => sum + (r.kanto_normal || 0), 0),
          kanto_special: records.reduce((sum, r) => sum + (r.kanto_special || 0), 0),
          kansai_normal: records.reduce((sum, r) => sum + (r.kansai_normal || 0), 0),
          kansai_special: records.reduce((sum, r) => sum + (r.kansai_special || 0), 0),
          air_volume: records.reduce((sum, r) => sum + (r.air_volume || 0), 0),
          sea_air_volume: records.reduce((sum, r) => sum + (r.sea_air_volume || 0), 0),
          is_complete: records.every(r => r.is_complete === '是') ? '是' : '否',
        };

        // 填充表单
        setEditingVolume(summarizedRecord);
        setVolumeForm({
          collect_date: collectDate,
          warehouse: '全部',
          package_count: summarizedRecord.package_count,
          weight: summarizedRecord.weight || 0,
          actual_total_volume: summarizedRecord.actual_total_volume || 0,
          is_complete: summarizedRecord.is_complete || '是',
        });
      }
    } else {
      // 加载单个仓库的记录
      const record = volumeEstimates.find(
        e => e.collect_date === collectDate && e.warehouse === warehouse
      );

      if (record) {
        // 找到记录，填充表单
        setEditingVolume(record);
        setVolumeForm({
          collect_date: record.collect_date,
          warehouse: record.warehouse,
          package_count: record.package_count,
          weight: record.weight || 0,
          actual_total_volume: record.actual_total_volume || 0,
          is_complete: record.is_complete || '是',
        });
      }
    }
  };

  // 根据揽收日期和仓库自动加载实际配置明细的揽收大包数和重量
  const loadConfigDetailByDateAndWarehouse = (collectDate: string, warehouse: string) => {
    if (!collectDate || !warehouse) return;

    console.log('加载实际配置明细数据:', { collectDate, warehouse });

    if (warehouse === '全部') {
      // 汇总所有仓库的数据
      const records = volumeEstimates.filter(e => e.collect_date === collectDate);
      if (records.length > 0) {
        const summarizedPackageCount = records.reduce((sum, r) => sum + (r.package_count || 0), 0);
        const summarizedWeight = records.reduce((sum, r) => sum + (r.weight || 0), 0);

        // 填充表单
        setConfigDetailForm(prev => ({
          ...prev,
          package_count: summarizedPackageCount,
          weight: summarizedWeight,
        }));

        console.log('实际配置明细加载成功(全部):', { package_count: summarizedPackageCount, weight: summarizedWeight });
      }
    } else {
      // 加载单个仓库的记录
      const record = volumeEstimates.find(
        e => e.collect_date === collectDate && e.warehouse === warehouse
      );

      if (record) {
        // 填充表单
        setConfigDetailForm(prev => ({
          ...prev,
          package_count: record.package_count || 0,
          weight: record.weight || 0,
        }));

        console.log('实际配置明细加载成功(单个仓库):', {
          warehouse,
          package_count: record.package_count,
          weight: record.weight
        });
      }
    }
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

  // 获取主单的有效方数（优先级：实际方数 > 打货上限 > 预估方数）
  const getEffectiveVolume = (order: MainOrder): number => {
    // 1. 优先使用实际方数
    if (order.actual_volume && parseFloat(order.actual_volume) > 0) {
      return parseFloat(order.actual_volume);
    }

    // 2. 其次使用打货上限
    if (order.max_volume && parseFloat(order.max_volume) > 0) {
      return parseFloat(order.max_volume);
    }

    // 3. 最后使用预估方数
    if (order.est_volume && parseFloat(order.est_volume) > 0) {
      return parseFloat(order.est_volume);
    }

    return 0;
  };

  // 获取主单的配置明细方数（用于实际配置明细展示：优先打货上限，其次实际方数）
  const getConfigDetailVolume = (order: MainOrder): number => {
    // 1. 优先使用打货上限
    if (order.max_volume && parseFloat(order.max_volume) > 0) {
      return parseFloat(order.max_volume);
    }

    // 2. 其次使用实际方数
    if (order.actual_volume && parseFloat(order.actual_volume) > 0) {
      return parseFloat(order.actual_volume);
    }

    return 0;
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
      issue_card: toNull(orderForm.issue_card),
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
          actual_pieces: '', actual_weight: '', actual_volume: '', actual_bills: '', remark: '', issue_card: '否',
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

  // 重置欠方余方查询
  const resetBalanceQuery = () => {
    setBalanceQuery({
      collect_date: '',
      warehouse: '全部',
      port: '全部',
      cargo_type: '全部',
    });
    setBalanceResults([]);
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
      '实际出货总方数': record.actual_total_volume ? truncateToDecimals(record.actual_total_volume, 4) : '-',
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
          <button
            onClick={() => setActiveTab('flight-exception')}
            className={`w-full px-5 py-3 text-left hover:bg-white/10 ${activeTab === 'flight-exception' ? 'bg-blue-500' : ''}`}
          >
            航班异常情况记录
          </button>
          <button
            onClick={() => setActiveTab('config-detail')}
            className={`w-full px-5 py-3 text-left hover:bg-white/10 ${activeTab === 'config-detail' ? 'bg-blue-500' : ''}`}
          >
            实际配置明细
          </button>

          <div className="px-4 py-2 text-xs text-white/50 uppercase mt-4">系统文档</div>
          <button
            onClick={() => setActiveTab('config-docs')}
            className={`w-full px-5 py-3 text-left hover:bg-white/10 ${activeTab === 'config-docs' ? 'bg-blue-500' : ''}`}
          >
            📄 配置文档
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
      <main className="ml-[256px] flex-1 p-6 min-w-0">
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
                <div className="overflow-auto relative">
                  <Table style={{ tableLayout: 'fixed', width: '100%', minWidth: '1000px' }}>
                    <TableHeader className="sticky top-0 bg-white z-10" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#ffffff' }}>
                      <TableRow>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '60px' }}>仓库</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '100px' }}>大包预估体积</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>关东目的港占比</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>关西目的港占比</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>关东普货占比</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>关东特货占比</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>关西普货占比</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>关西特货占比</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '100px' }}>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {areaConfigs.map(config => (
                        <TableRow key={config.id}>
                          <TableCell className="text-center px-1 py-1">{config.warehouse}</TableCell>
                          <TableCell className="text-center px-1 py-1">{config.package_volume}</TableCell>
                          <TableCell className="text-center px-1 py-1">{config.kanto_ratio}%</TableCell>
                          <TableCell className="text-center px-1 py-1">{config.kansai_ratio}%</TableCell>
                          <TableCell className="text-center px-1 py-1">{config.kanto_normal_ratio}%</TableCell>
                          <TableCell className="text-center px-1 py-1">{config.kanto_special_ratio}%</TableCell>
                          <TableCell className="text-center px-1 py-1">{config.kansai_normal_ratio}%</TableCell>
                          <TableCell className="text-center px-1 py-1">{config.kansai_special_ratio}%</TableCell>
                          <TableCell className="text-center px-1 py-1">
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
                  <Table style={{ tableLayout: 'fixed', width: '100%', minWidth: '1000px' }}>
                    <TableHeader className="sticky top-0 bg-white z-10" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#ffffff' }}>
                      <TableRow>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '60px' }}>仓库</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '50px' }}>周几</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '100px' }}>关东普货路由</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '100px' }}>关西普货路由</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '100px' }}>关东特货路由</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '100px' }}>关西特货路由</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '120px' }}>备注</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '100px' }}>操作</TableHead>
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
                          <TableCell className="text-center px-1 py-1">{config.warehouse}</TableCell>
                          <TableCell className="text-center px-1 py-1">{config.weekday}</TableCell>
                          <TableCell className="text-center px-1 py-1">{config.kanto_normal || '-'}</TableCell>
                          <TableCell className="text-center px-1 py-1">{config.kansai_normal || '-'}</TableCell>
                          <TableCell className="text-center px-1 py-1">{config.kanto_special || '-'}</TableCell>
                          <TableCell className="text-center px-1 py-1">{config.kansai_special || '-'}</TableCell>
                          <TableCell className="text-center px-1 py-1">{config.remark || '-'}</TableCell>
                          <TableCell className="text-center px-1 py-1">
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
                  <Table style={{ tableLayout: 'fixed' }}>
                    <TableHeader className="sticky top-0 bg-white z-10" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#ffffff' }}>
                      <TableRow>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '120px' }}>目的港代码</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>所属区域</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '120px' }}>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portConfigs.map(config => (
                        <TableRow key={config.id}>
                          <TableCell className="text-center px-1 py-1">{config.port_code}</TableCell>
                          <TableCell className="text-center px-1 py-1">{config.region}</TableCell>
                          <TableCell className="text-center px-1 py-1">
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
                  <Button variant="outline" onClick={() => exportRouteConfigs(routeConfigs, `航空路由配置_${new Date().toISOString().split('T')[0]}`)}>
                    导出Excel
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
                  <Table style={{ tableLayout: 'fixed', whiteSpace: 'nowrap', minWidth: '1200px' }}>
                    <TableHeader className="sticky top-0 bg-white z-10" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#ffffff' }}>
                      <TableRow>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '40px' }}>
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
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '90px' }}>航班号</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '50px' }}>始发</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '50px' }}>中转</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '50px' }}>目的</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>起飞时间</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>落地时间</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '60px' }}>是否隔天</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '90px' }}>二程航班</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '60px' }}>路由</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '100px' }}>操作</TableHead>
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
                          <TableCell className="text-center px-1 py-1" style={{ width: '40px' }}>
                            <input
                              type="checkbox"
                              checked={selectedRouteIds.has(config.id)}
                              onChange={() => toggleRouteSelection(config.id)}
                              className="w-4 h-4"
                            />
                          </TableCell>
                          <TableCell className="text-center px-1 py-1" style={{ width: '90px' }}>{config.flight_no}</TableCell>
                          <TableCell className="text-center px-1 py-1" style={{ width: '50px' }}>{config.origin}</TableCell>
                          <TableCell className="text-center px-1 py-1" style={{ width: '50px' }}>{config.transfer || '-'}</TableCell>
                          <TableCell className="text-center px-1 py-1" style={{ width: '50px' }}>{config.dest}</TableCell>
                          <TableCell className="text-center px-1 py-1" style={{ width: '80px' }}>{config.depart_time || '-'}</TableCell>
                          <TableCell className="text-center px-1 py-1" style={{ width: '80px' }}>{config.arrive_time || '-'}</TableCell>
                          <TableCell className="text-center px-1 py-1" style={{ width: '60px' }}>{config.is_next_day || '-'}</TableCell>
                          <TableCell className="text-center px-1 py-1" style={{ width: '90px' }}>{config.second_flight || '-'}</TableCell>
                          <TableCell className="text-center px-1 py-1" style={{ width: '60px' }}>
                            <Badge variant={config.route_type === '空运' ? 'default' : 'secondary'}>
                              {config.route_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center px-1 py-1" style={{ width: '100px' }}>
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
                <div className="grid grid-cols-6 gap-4 mb-5">
                  <div>
                    <Label>揽收日期</Label>
                    <Input type="date" value={volumeForm.collect_date}
                      onChange={e => {
                        const newDate = e.target.value;
                        setVolumeForm(prev => ({ ...prev, collect_date: newDate }));
                        // 自动查找并加载对应的记录
                        loadVolumeEstimateByDateAndWarehouse(newDate, volumeForm.warehouse);
                      }} />
                  </div>
                  <div>
                    <Label>星期</Label>
                    <Input value={volumeForm.collect_date ? getWeekday(volumeForm.collect_date) : ''} readOnly
                      className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>仓库</Label>
                    <Select value={volumeForm.warehouse}
                      onValueChange={v => {
                        setVolumeForm(prev => ({ ...prev, warehouse: v }));
                        // 自动查找并加载对应的记录（包括"全部"）
                        loadVolumeEstimateByDateAndWarehouse(volumeForm.collect_date, v);
                      }}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部</SelectItem>
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
                  <div>
                    <Label>实际出货总方数</Label>
                    <Input type="number" step="0.0001" placeholder="请输入" value={volumeForm.actual_total_volume || ''}
                      onChange={e => {
                        const value = e.target.value;
                        // 保留4位小数，不四舍五入
                        if (value) {
                          const num = parseFloat(value);
                          if (!isNaN(num)) {
                            const truncated = Math.floor(num * 10000) / 10000;
                            setVolumeForm(prev => ({ ...prev, actual_total_volume: truncated }));
                            return;
                          }
                        }
                        setVolumeForm(prev => ({ ...prev, actual_total_volume: parseFloat(value) || 0 }));
                      }} />
                  </div>
                </div>
                
                {/* 计算结果 */}
                <div className="mb-5">
                  <h3 className="font-semibold text-lg mb-3">计算结果</h3>

                  {/* 基础信息 */}
                  <div className="mb-4">
                    <div className="text-base font-bold text-gray-700 mb-2 pl-2 border-l-4 border-blue-500">基础信息</div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200 shadow-sm">
                        <div className="text-2xl font-bold text-black">{volumeResult ? volumeResult.totalVolume.toFixed(3) : '0'}</div>
                        <div className="text-sm font-bold text-blue-700 mt-1">总方数</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200 shadow-sm">
                        <div className="text-2xl font-bold text-black">{volumeResult ? volumeResult.kantoTotal.toFixed(3) : '0'}</div>
                        <div className="text-sm font-bold text-blue-700 mt-1">关东总方数</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200 shadow-sm">
                        <div className="text-2xl font-bold text-black">{volumeResult ? volumeResult.kansaiTotal.toFixed(3) : '0'}</div>
                        <div className="text-sm font-bold text-blue-700 mt-1">关西总方数</div>
                      </div>
                    </div>
                  </div>

                  {/* 货物分类 */}
                  <div className="mb-4">
                    <div className="text-base font-bold text-gray-700 mb-2 pl-2 border-l-4 border-orange-500">货物分类</div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200 shadow-sm">
                        <div className="text-xl font-bold text-black">{volumeResult ? volumeResult.kantoNormal.toFixed(3) : '0'}</div>
                        <div className="text-sm font-bold text-orange-700 mt-1">关东普货</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200 shadow-sm">
                        <div className="text-xl font-bold text-black">{volumeResult ? volumeResult.kantoSpecial.toFixed(3) : '0'}</div>
                        <div className="text-sm font-bold text-orange-700 mt-1">关东特货</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200 shadow-sm">
                        <div className="text-xl font-bold text-black">{volumeResult ? volumeResult.kansaiNormal.toFixed(3) : '0'}</div>
                        <div className="text-sm font-bold text-orange-700 mt-1">关西普货</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200 shadow-sm">
                        <div className="text-xl font-bold text-black">{volumeResult ? volumeResult.kansaiSpecial.toFixed(3) : '0'}</div>
                        <div className="text-sm font-bold text-orange-700 mt-1">关西特货</div>
                      </div>
                    </div>
                  </div>

                  {/* 应配置 */}
                  <div className="mb-4">
                    <div className="text-base font-bold text-gray-700 mb-2 pl-2 border-l-4 border-emerald-500">应配置（当天按照配舱规则应该配置的空运、海空汇总）</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-200 shadow-sm">
                        <div className="text-xl font-bold text-black">{volumeResult ? volumeResult.airVolume.toFixed(3) : '0'}</div>
                        <div className="text-sm font-bold text-emerald-700 mt-1">应配置空运方数</div>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-200 shadow-sm">
                        <div className="text-xl font-bold text-black">{volumeResult ? volumeResult.seaAirVolume.toFixed(3) : '0'}</div>
                        <div className="text-sm font-bold text-emerald-700 mt-1">应配置海空方数</div>
                      </div>
                    </div>
                  </div>

                  {/* 实际配置 */}
                  <div>
                    <div className="text-base font-bold text-gray-700 mb-2 pl-2 border-l-4 border-violet-500">实际配置（当天航线已发放的空运、海空汇总）</div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-violet-50 rounded-lg p-4 text-center border border-violet-200 shadow-sm">
                        <div className="text-lg font-bold text-black">{volumeResult ? volumeResult.configuredAirVolume.toFixed(3) : '0'}</div>
                        <div className="text-sm font-bold text-violet-700 mt-1">空运主单<br/>已配置方数</div>
                      </div>
                      <div className="bg-violet-50 rounded-lg p-4 text-center border border-violet-200 shadow-sm">
                        <div className="text-lg font-bold text-black">{volumeResult ? volumeResult.configuredSeaAirVolume.toFixed(3) : '0'}</div>
                        <div className="text-sm font-bold text-violet-700 mt-1">海空主单<br/>已配置方数</div>
                      </div>
                      <div className="bg-violet-50 rounded-lg p-4 text-center border border-violet-200 shadow-sm">
                        <div className="text-lg font-bold text-black">{volumeResult ? volumeResult.unconfiguredVolume.toFixed(3) : '0'}</div>
                        <div className="text-sm font-bold text-violet-700 mt-1">未配置<br/>方数</div>
                      </div>
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
                    <Button variant="outline" onClick={() => { setEditingVolume(null); setVolumeForm({ collect_date: '', warehouse: '', package_count: 0, weight: 0, actual_total_volume: 0, is_complete: '是' }); setVolumeResult(null); }}>
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
                  <Table style={{ tableLayout: 'fixed', minWidth: '1400px' }}>
                    <TableHeader className="sticky top-0 bg-white z-50" style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'white' }}>
                      <TableRow>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '90px' }}>揽收日期</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '60px' }}>仓库</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '70px' }}>大包数</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '70px' }}>重量</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>实际出货</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>总方数</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>关东总</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>关西总</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>关东普货</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>关东特货</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>关西普货</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>关西特货</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '70px' }}>空运</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '70px' }}>海空</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '110px' }}>货物袋数齐全</TableHead>
                        <TableHead className="bg-white text-center px-1 py-1" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '120px' }}>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredVolumeEstimates().slice(0, 10).map(record => (
                        <TableRow key={record.id}>
                          <TableCell className="text-center px-1 py-1">{record.collect_date}</TableCell>
                          <TableCell className="text-center px-1 py-1">{record.warehouse}</TableCell>
                          <TableCell className="text-center px-1 py-1">{record.package_count}</TableCell>
                          <TableCell className="text-center px-1 py-1">{record.weight ? truncateToDecimals(record.weight, 2) : '0.00'}</TableCell>
                          <TableCell className="text-center px-1 py-1">{record.actual_total_volume ? truncateToDecimals(record.actual_total_volume, 4) : '-'}</TableCell>
                          <TableCell className="text-center px-1 py-1">{(record.total_volume || 0).toFixed(3)}</TableCell>
                          <TableCell className="text-center px-1 py-1">{(record.kanto_total || 0).toFixed(3)}</TableCell>
                          <TableCell className="text-center px-1 py-1">{(record.kansai_total || 0).toFixed(3)}</TableCell>
                          <TableCell className="text-center px-1 py-1">{(record.kanto_normal || 0).toFixed(3)}</TableCell>
                          <TableCell className="text-center px-1 py-1">{(record.kanto_special || 0).toFixed(3)}</TableCell>
                          <TableCell className="text-center px-1 py-1">{(record.kansai_normal || 0).toFixed(3)}</TableCell>
                          <TableCell className="text-center px-1 py-1">{(record.kansai_special || 0).toFixed(3)}</TableCell>
                          <TableCell className="text-center px-1 py-1">{(record.air_volume || 0).toFixed(3)}</TableCell>
                          <TableCell className="text-center px-1 py-1">{(record.sea_air_volume || 0).toFixed(3)}</TableCell>
                          <TableCell className="text-center px-1 py-1">{record.is_complete || '-'}</TableCell>
                          <TableCell className="text-center px-1 py-1">
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
                    <Input className="bg-gray-100" value={formatArrivalDateTime({
                      flight_no: orderForm.flight_no || '',
                      origin: orderForm.origin || '',
                      transfer: orderForm.transfer || '',
                      dest: orderForm.dest || '',
                      actual_flight_date: orderForm.actual_flight_date || null,
                      depart_time: orderForm.depart_time || null,
                      arrive_time: orderForm.arrive_time || null
                    })}
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
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">是否开具售卡</Label>
                    <select
                      value={orderForm.issue_card || '否'}
                      onChange={e => setOrderForm(prev => ({ ...prev, issue_card: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="否">否</option>
                      <option value="是">是</option>
                    </select>
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
                      actual_pieces: '', actual_weight: '', actual_volume: '', actual_bills: '', remark: '', issue_card: '否',
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
            {/* 筛选器区域 - 固定不滚动 */}
            <Card className="mb-4" style={{ position: 'sticky', top: saving ? '32px' : '0', zIndex: 50, backgroundColor: 'white', overflow: 'visible' }}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>主单查询</CardTitle>
                <Button
                  onClick={() => exportToExcel(mainOrders, `主单查询_${new Date().toISOString().split('T')[0]}`, routeConfigs)}
                  disabled={mainOrders.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  📥 导出Excel
                </Button>
              </CardHeader>
              <CardContent>
                {/* 第一行：日期范围 */}
                <div className="flex gap-2 mb-5">
                  <div className="flex flex-col gap-2 flex-[2]">
                    <Label>揽收日期范围</Label>
                    <DateTimeRangePicker
                      value={{ start: orderQueryStartDate, end: orderQueryEndDate }}
                      onChange={(value) => {
                        setOrderQueryStartDate(value.start);
                        setOrderQueryEndDate(value.end);
                      }}
                      placeholder="选择日期"
                      showTime={false}
                      onOpenChange={setDatePickerOpen}
                    />
                  </div>
                  <div className="flex flex-col gap-2 flex-[1]">
                    <Label>预计起飞日期范围</Label>
                    <DateTimeRangePicker
                      value={{ start: orderQueryDepartStartDate, end: orderQueryDepartEndDate }}
                      onChange={(value) => {
                        setOrderQueryDepartStartDate(value.start);
                        setOrderQueryDepartEndDate(value.end);
                      }}
                      placeholder="选择日期时间"
                      showTime={true}
                      onOpenChange={setDatePickerOpen}
                    />
                  </div>
                </div>
                {/* 分隔线 */}
                <div className="border-t border-gray-200 mb-5"></div>
                {/* 第二行：筛选项 */}
                <div className="flex gap-6 mb-5">
                  <div className="flex flex-col gap-2" style={{ width: '100px' }}>
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
                  <div className="flex flex-col gap-2" style={{ width: '100px' }}>
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
                  <div className="flex flex-col gap-2" style={{ width: '100px' }}>
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
                  <div className="flex flex-col gap-2" style={{ width: '100px' }}>
                    <Label>货物属性</Label>
                    <Select value={orderQueryCargoType} onValueChange={v => setOrderQueryCargoType(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="全部">
                          {orderQueryCargoType === '全部' ? '全部' : orderQueryCargoType}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部</SelectItem>
                        <SelectItem value="普货">普货</SelectItem>
                        <SelectItem value="特货">特货</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2" style={{ width: '100px' }}>
                    <Label>是否开具售卡</Label>
                    <Select value={orderQueryIssueCard} onValueChange={v => setOrderQueryIssueCard(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="全部">
                          {orderQueryIssueCard === '全部' ? '全部' : orderQueryIssueCard}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部</SelectItem>
                        <SelectItem value="是">是</SelectItem>
                        <SelectItem value="否">否</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2" style={{ width: '150px' }}>
                    <Label>主单号</Label>
                    <Input
                      placeholder="搜索"
                      value={orderQueryMainOrderNo}
                      onChange={(e) => setOrderQueryMainOrderNo(e.target.value)}
                    />
                  </div>
                </div>
                {/* 第三行：按钮 */}
                <div className="flex gap-3">
                  <Button onClick={queryMainOrders}>查询</Button>
                  <Button variant="outline" onClick={() => {
                    setOrderQueryStartDate(null);
                    setOrderQueryEndDate(null);
                    setOrderQueryDepartStartDate(null);
                    setOrderQueryDepartEndDate(null);
                    setOrderQueryWarehouse('全部');
                    setOrderQueryCargoType('全部');
                    setOrderQueryOrigin('全部');
                    setOrderQueryRouteType('全部');
                    setOrderQueryIssueCard('全部');
                    setOrderQueryMainOrderNo('');
                  }}>重置筛选</Button>
                </div>
              </CardContent>
            </Card>
            
            <div>
              <div className="flex flex-row items-center justify-between px-6 py-4 border-b bg-white rounded-t-lg">
                <span className="font-semibold">查询结果</span>
                <span className="text-sm text-gray-500">共 {mainOrders.length} 条记录</span>
              </div>
              <div style={{ overflow: 'auto', maxHeight: '800px', position: 'relative' }}>
                <table style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: '2505px' }}>
                  <thead>
                    <tr>
                      <th style={{ position: 'sticky', left: 0, top: 0, zIndex: 50, backgroundColor: '#fff', minWidth: '125px', borderRight: '3px solid #f97316', borderBottom: '2px solid #e5e7eb', visibility: datePickerOpen ? 'hidden' : 'visible' }} className="text-center px-1 py-2 text-sm">揽收日期</th>
                      <th style={{ position: 'sticky', left: '125px', top: 0, zIndex: 50, backgroundColor: '#fff', minWidth: '80px', borderRight: '3px solid #f97316', borderBottom: '2px solid #e5e7eb', visibility: datePickerOpen ? 'hidden' : 'visible' }} className="text-center px-1 py-2 text-sm">仓库</th>
                      <th style={{ position: 'sticky', left: '205px', top: 0, zIndex: 50, backgroundColor: '#fff', minWidth: '80px', borderRight: '3px solid #f97316', borderBottom: '2px solid #e5e7eb', visibility: datePickerOpen ? 'hidden' : 'visible' }} className="text-center px-1 py-2 text-sm">口岸</th>
                      <th style={{ position: 'sticky', left: '285px', top: 0, zIndex: 50, backgroundColor: '#fff', minWidth: '80px', borderRight: '3px solid #f97316', borderBottom: '2px solid #e5e7eb', visibility: datePickerOpen ? 'hidden' : 'visible' }} className="text-center px-1 py-2 text-sm">货物属性</th>
                      <th style={{ position: 'sticky', left: '365px', top: 0, zIndex: 50, backgroundColor: '#fff', minWidth: '90px', borderRight: '3px solid #f97316', borderBottom: '2px solid #e5e7eb', visibility: datePickerOpen ? 'hidden' : 'visible' }} className="text-center px-1 py-2 text-sm">路由类型</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f3f4f6', minWidth: '120px', borderBottom: '2px solid #e5e7eb' }} className="text-center px-2 py-2">主单号</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f3f4f6', minWidth: '90px', borderBottom: '2px solid #e5e7eb' }} className="text-center px-2 py-2">航班号</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f3f4f6', minWidth: '60px', borderBottom: '2px solid #e5e7eb' }} className="text-center px-2 py-2">始发</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f3f4f6', minWidth: '60px', borderBottom: '2px solid #e5e7eb' }} className="text-center px-2 py-2">中转</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f3f4f6', minWidth: '60px', borderBottom: '2px solid #e5e7eb' }} className="text-center px-2 py-2">目的</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f3f4f6', minWidth: '160px', borderBottom: '2px solid #e5e7eb' }} className="text-center px-2 py-2">预计起飞</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f3f4f6', minWidth: '160px', borderBottom: '2px solid #e5e7eb' }} className="text-center px-2 py-2">预计落地</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f3f4f6', minWidth: '90px', borderBottom: '2px solid #e5e7eb' }} className="text-center px-2 py-2">打货上限(方)</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f3f4f6', minWidth: '90px', borderBottom: '2px solid #e5e7eb' }} className="text-center px-2 py-2">打货上限(件)</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f3f4f6', minWidth: '90px', borderBottom: '2px solid #e5e7eb' }} className="text-center px-2 py-2">实际件数</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f3f4f6', minWidth: '90px', borderBottom: '2px solid #e5e7eb' }} className="text-center px-2 py-2">实际方数</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f3f4f6', minWidth: '100px', borderBottom: '2px solid #e5e7eb' }} className="text-center px-2 py-2">是否开具售卡</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f3f4f6', minWidth: '100px', borderBottom: '2px solid #e5e7eb' }} className="text-center px-2 py-2">备注</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#f3f4f6', minWidth: '80px', borderBottom: '2px solid #e5e7eb' }} className="text-center px-2 py-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mainOrders.slice(0, 50).map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ position: 'sticky', left: 0, zIndex: 15, backgroundColor: '#fff', minWidth: '125px', borderRight: '3px solid #f97316', visibility: datePickerOpen ? 'hidden' : 'visible' }} className="text-center px-1 py-2 text-sm">{order.collect_date}</td>
                        <td style={{ position: 'sticky', left: '125px', zIndex: 15, backgroundColor: '#fff', minWidth: '80px', borderRight: '3px solid #f97316', visibility: datePickerOpen ? 'hidden' : 'visible' }} className="text-center px-1 py-2 text-sm">{order.warehouse}</td>
                        <td style={{ position: 'sticky', left: '205px', zIndex: 15, backgroundColor: '#fff', minWidth: '80px', borderRight: '3px solid #f97316', visibility: datePickerOpen ? 'hidden' : 'visible' }} className="text-center px-1 py-2 text-sm">{order.port}</td>
                        <td style={{ position: 'sticky', left: '285px', zIndex: 15, backgroundColor: '#fff', minWidth: '80px', borderRight: '3px solid #f97316', visibility: datePickerOpen ? 'hidden' : 'visible' }} className="text-center px-1 py-2 text-sm">{order.cargo_type}</td>
                        <td style={{ position: 'sticky', left: '365px', zIndex: 15, backgroundColor: '#fff', minWidth: '90px', borderRight: '3px solid #f97316', visibility: datePickerOpen ? 'hidden' : 'visible' }} className="text-center px-1 py-2 text-sm">
                          {order.route_type ? (
                            <Badge variant={order.route_type === '空运' ? 'default' : 'secondary'}>
                              {order.route_type}
                            </Badge>
                          ) : '-'}
                        </td>
                        <td style={{ minWidth: '120px', backgroundColor: '#fff' }} className="text-center px-2 py-2">{order.main_no || '-'}</td>
                        <td style={{ minWidth: '90px', backgroundColor: '#fff' }} className="text-center px-2 py-2">{order.flight_no || '-'}</td>
                        <td style={{ minWidth: '60px', backgroundColor: '#fff' }} className="text-center px-2 py-2">{order.origin || '-'}</td>
                        <td style={{ minWidth: '60px', backgroundColor: '#fff' }} className="text-center px-2 py-2">{order.transfer || '-'}</td>
                        <td style={{ minWidth: '60px', backgroundColor: '#fff' }} className="text-center px-2 py-2">{order.dest || '-'}</td>
                        <td style={{ minWidth: '160px', backgroundColor: '#fff' }} className="text-center px-2 py-2">
                          {formatDateTime(order.actual_flight_date, order.depart_time) || '-'}
                        </td>
                        <td style={{ minWidth: '160px', backgroundColor: '#fff' }} className="text-center px-2 py-2">
                          {formatArrivalDateTime(order) || '-'}
                        </td>
                        <td style={{ minWidth: '90px', backgroundColor: '#fff' }} className="text-center px-2 py-2">{order.max_volume || '-'}</td>
                        <td style={{ minWidth: '90px', backgroundColor: '#fff' }} className="text-center px-2 py-2">{order.max_pieces || '-'}</td>
                        <td style={{ minWidth: '90px', backgroundColor: '#fff' }} className="text-center px-2 py-2">{order.actual_pieces || '-'}</td>
                        <td style={{ minWidth: '90px', backgroundColor: '#fff' }} className="text-center px-2 py-2">{order.actual_volume || '-'}</td>
                        <td style={{ minWidth: '100px', backgroundColor: '#fff' }} className="text-center px-2 py-2">
                          {order.issue_card ? (
                            <Badge variant={order.issue_card === '是' ? 'default' : 'secondary'}>
                              {order.issue_card}
                            </Badge>
                          ) : '-'}
                        </td>
                        <td style={{ minWidth: '100px', backgroundColor: '#fff' }} className="text-center px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <span className="truncate" style={{ maxWidth: '60px' }} title={order.remark || ''}>
                              {order.remark ? (order.remark.length > 10 ? order.remark.substring(0, 10) + '...' : order.remark) : '-'}
                            </span>
                            {order.remark && (
                              <Button size="sm" variant="ghost" className="h-6 px-1 text-xs"
                                onClick={() => {
                                  setCurrentRemark(order.remark || '');
                                  setRemarkDetailOpen(true);
                                }}
                              >
                                详情
                              </Button>
                            )}
                          </div>
                        </td>
                        <td style={{ minWidth: '80px', backgroundColor: '#fff' }} className="text-center px-2 py-2">
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
                                issue_card: order.issue_card || '否',
                              });
                              setActiveTab('main-order');
                            }}>
                            编辑
                          </Button>
                          <Button size="sm" variant="destructive"
                            onClick={() => deleteMainOrder(order.id)}>
                            删除
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
                  <div className="flex items-end gap-2">
                    <Button onClick={queryBalance}>查询</Button>
                    <Button variant="outline" onClick={resetBalanceQuery}>重置查询</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>查询结果</CardHeader>
              <CardContent>
                {balanceResults.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto relative">
                    <Table style={{ tableLayout: 'fixed' }} className="w-full">
                      <TableHeader className="sticky top-0 bg-white z-50" style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'white' }}>
                        <TableRow>
                          <TableHead className="text-center px-1 py-1 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '60px' }}>仓库</TableHead>
                          <TableHead className="text-center px-1 py-1 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '60px' }}>口岸</TableHead>
                          <TableHead className="text-center px-1 py-1 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '60px' }}>货物属性</TableHead>
                          <TableHead className="text-center px-1 py-1 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>预估方数</TableHead>
                          <TableHead className="text-center px-1 py-1 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '100px' }}>打货上限汇总</TableHead>
                          <TableHead className="text-center px-1 py-1 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>欠方</TableHead>
                          <TableHead className="text-center px-1 py-1 bg-white" style={{ backgroundColor: '#ffffff', zIndex: 10, width: '80px' }}>余方</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {balanceResults.map((r, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-center px-1 py-1">{r.warehouse}</TableCell>
                            <TableCell className="text-center px-1 py-1">{r.port}</TableCell>
                            <TableCell className="text-center px-1 py-1">{r.cargo_type}</TableCell>
                            <TableCell className="text-center px-1 py-1">{r.estVolume.toFixed(3)}</TableCell>
                            <TableCell className="text-center px-1 py-1">{r.maxVolume.toFixed(3)}</TableCell>
                            <TableCell className="text-center px-1 py-1 font-semibold text-red-600">
                              {r.deficit > 0 ? r.deficit.toFixed(3) : '0.000'}
                            </TableCell>
                            <TableCell className="text-center px-1 py-1 font-semibold text-green-600">
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

        {/* 航班异常情况记录 */}
        {activeTab === 'flight-exception' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>航班异常情况记录</CardTitle>
              <Button onClick={exportFlightExceptions} variant="outline" size="sm">
                导出 Excel
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div>
                  <Label>主单号 <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    placeholder="请输入主单号"
                    value={orderForm.main_no}
                    onChange={e => setOrderForm(prev => ({ ...prev, main_no: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>异常原因 <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    placeholder="请输入异常原因"
                    value={orderForm.remark}
                    onChange={e => setOrderForm(prev => ({ ...prev, remark: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>备注</Label>
                  <Input
                    type="text"
                    placeholder="请输入备注"
                    value={orderForm.actual_flight_date}
                    onChange={e => setOrderForm(prev => ({ ...prev, actual_flight_date: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={async () => {
                    if (!orderForm.main_no || !orderForm.remark) {
                      alert('请填写主单号和异常原因');
                      return;
                    }
                    try {
                      const response = await fetch('/api/flight-exception', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          mainNo: orderForm.main_no,
                          exceptionReason: orderForm.remark,
                          remark: orderForm.actual_flight_date,
                        }),
                      });
                      const result = await response.json();
                      if (!result.success) {
                        alert('保存失败: ' + (result.error || '未知错误'));
                        return;
                      }
                      alert('保存成功');
                      // 清空表单
                      setOrderForm({
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
                        issue_card: '否',
                      });
                      // 重新加载数据
                      loadFlightExceptions();
                    } catch (error) {
                      alert('保存失败: ' + (error instanceof Error ? error.message : '网络错误'));
                    }
                  }}>
                    保存
                  </Button>
                </div>
              </div>

              {/* 航班异常列表 */}
              <div className="border rounded-lg overflow-auto relative" style={{ maxHeight: '600px' }}>
                <table className="w-full" style={{ tableLayout: 'fixed', minWidth: '1800px' }}>
                  <thead className="sticky top-0 bg-gray-50 z-10" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f9fafb' }}>
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 border-b border-r border-gray-200" style={{ width: '120px', position: 'sticky', left: 0, zIndex: 20, backgroundColor: '#f9fafb' }}>发车日期</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 border-b border-r border-gray-200" style={{ width: '120px', position: 'sticky', left: '120px', zIndex: 20, backgroundColor: '#f9fafb' }}>航班日期</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 border-b border-r border-gray-200" style={{ width: '100px', position: 'sticky', left: '240px', zIndex: 20, backgroundColor: '#f9fafb' }}>航班号</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 border-b border-r border-gray-200" style={{ width: '150px', position: 'sticky', left: '340px', zIndex: 20, backgroundColor: '#f9fafb' }}>主单号</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 border-b border-r border-gray-200" style={{ width: '80px' }}>票数</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 border-b border-r border-gray-200" style={{ width: '80px' }}>始发港</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 border-b border-r border-gray-200" style={{ width: '80px' }}>中转站</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 border-b border-r border-gray-200" style={{ width: '80px' }}>目的港</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 border-b border-r border-gray-200" style={{ width: '200px' }}>异常原因</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 border-b border-r border-gray-200" style={{ width: '200px' }}>备注</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 border-b border-r border-gray-200" style={{ width: '80px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flightExceptions.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-2 py-8 text-center text-gray-500">
                          暂无航班异常记录
                        </td>
                      </tr>
                    ) : (
                      flightExceptions.map((item) => (
                        <tr key={item.id}>
                          <td className="px-2 py-1 text-sm border-b border-r border-gray-200" style={{ position: 'sticky', left: 0, zIndex: 10, backgroundColor: 'white' }}>{item.depart_date}</td>
                          <td className="px-2 py-1 text-sm border-b border-r border-gray-200" style={{ position: 'sticky', left: '120px', zIndex: 10, backgroundColor: 'white' }}>{item.flight_date}</td>
                          <td className="px-2 py-1 text-sm border-b border-r border-gray-200" style={{ position: 'sticky', left: '240px', zIndex: 10, backgroundColor: 'white' }}>{item.flight_no}</td>
                          <td className="px-2 py-1 text-sm border-b border-r border-gray-200" style={{ position: 'sticky', left: '340px', zIndex: 10, backgroundColor: 'white' }}>{item.main_no}</td>
                          <td className="px-2 py-1 text-sm border-b border-r border-gray-200">{item.bills}</td>
                          <td className="px-2 py-1 text-sm border-b border-r border-gray-200">{item.origin}</td>
                          <td className="px-2 py-1 text-sm border-b border-r border-gray-200">{item.transfer || '-'}</td>
                          <td className="px-2 py-1 text-sm border-b border-r border-gray-200">{item.dest}</td>
                          <td className="px-2 py-1 text-sm border-b border-r border-gray-200">{item.exception_reason}</td>
                          <td className="px-2 py-1 text-sm border-b border-r border-gray-200">{item.remark || '-'}</td>
                          <td className="px-2 py-1 text-sm border-b border-gray-200">
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditFlightException(item)}
                              >
                                编辑
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  if (!confirm('确定要删除这条记录吗？')) return;
                                try {
                                  const response = await fetch(`/api/flight-exception?id=${item.id}`, {
                                    method: 'DELETE',
                                  });
                                  const result = await response.json();
                                  if (!result.success) {
                                    alert('删除失败: ' + (result.error || '未知错误'));
                                    return;
                                  }
                                  loadFlightExceptions();
                                } catch (error) {
                                  alert('删除失败: ' + (error instanceof Error ? error.message : '网络错误'));
                                }
                              }}
                            >
                              删除
                            </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 编辑弹窗 */}
              {isEditDialogOpen && editingFlightException && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>编辑航班异常记录</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>主单号</Label>
                          <Input value={editingFlightException.main_no} disabled className="bg-gray-50" />
                        </div>
                        <div>
                          <Label>航班号</Label>
                          <Input value={editingFlightException.flight_no} disabled className="bg-gray-50" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>发车日期</Label>
                          <Input value={editingFlightException.depart_date} disabled className="bg-gray-50" />
                        </div>
                        <div>
                          <Label>航班日期</Label>
                          <Input value={editingFlightException.flight_date} disabled className="bg-gray-50" />
                        </div>
                      </div>
                      <div>
                        <Label>异常原因 <span className="text-red-500">*</span></Label>
                        <Input
                          value={editingFlightException.exception_reason}
                          onChange={e => setEditingFlightException(prev => prev ? { ...prev, exception_reason: e.target.value } : null)}
                          placeholder="请输入异常原因"
                        />
                      </div>
                      <div>
                        <Label>备注</Label>
                        <Input
                          value={editingFlightException.remark || ''}
                          onChange={e => setEditingFlightException(prev => prev ? { ...prev, remark: e.target.value } : null)}
                          placeholder="请输入备注"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>取消</Button>
                      <Button onClick={saveFlightExceptionEdit}>保存</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        )}

        {/* 实际配置明细 */}
        {activeTab === 'config-detail' && (
          <Card>
            <CardHeader>
              <CardTitle>实际配置明细</CardTitle>
            </CardHeader>
            <CardContent>
              {/* 顶部筛选 */}
              <div className="grid grid-cols-5 gap-4 mb-5">
                <div>
                  <Label>揽收日期</Label>
                  <Input type="date" value={configDetailForm.collect_date}
                    onChange={e => {
                      const newDate = e.target.value;
                      setConfigDetailForm(prev => ({ ...prev, collect_date: newDate }));
                      // 自动加载揽收大包数和重量
                      loadConfigDetailByDateAndWarehouse(newDate, configDetailForm.warehouse);
                    }} />
                </div>
                <div>
                  <Label>星期</Label>
                  <Input value={configDetailForm.collect_date ? getWeekday(configDetailForm.collect_date) : ''} readOnly
                    className="bg-gray-50" />
                </div>
                <div>
                  <Label>仓库</Label>
                  <Select value={configDetailForm.warehouse}
                    onValueChange={v => {
                      setConfigDetailForm(prev => ({ ...prev, warehouse: v }));
                      // 自动加载揽收大包数和重量
                      loadConfigDetailByDateAndWarehouse(configDetailForm.collect_date, v);
                    }}>
                    <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="全部">全部</SelectItem>
                      <SelectItem value="东莞">东莞</SelectItem>
                      <SelectItem value="加工区">加工区</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>揽收大包数</Label>
                  <Input type="number" placeholder="请输入" value={configDetailForm.package_count || ''}
                    onChange={e => setConfigDetailForm(prev => ({ ...prev, package_count: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>重量 (kg)</Label>
                  <Input type="number" step="0.01" placeholder="请输入" value={configDetailForm.weight || ''}
                    onChange={e => setConfigDetailForm(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>

              {/* 配置明细展示 */}
              {configDetailResult ? (
                <div>
                  {/* 空运配置明细 */}
                  <div className="mb-4">
                    <div className="text-base font-bold text-gray-700 mb-2 pl-2 border-l-4 border-indigo-500">空运配置明细</div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-indigo-50 rounded-md p-2 text-center border border-indigo-200 shadow-sm">
                        <div className="text-xl font-bold text-gray-900">{configDetailResult.airConfig.kantoNormal.toFixed(3)}</div>
                        <div className="text-xs font-bold text-gray-700 mt-1">关东普货</div>
                      </div>
                      <div className="bg-indigo-50 rounded-md p-2 text-center border border-indigo-200 shadow-sm">
                        <div className="text-xl font-bold text-gray-900">{configDetailResult.airConfig.kantoSpecial.toFixed(3)}</div>
                        <div className="text-xs font-bold text-gray-700 mt-1">关东特货</div>
                      </div>
                      <div className="bg-indigo-50 rounded-md p-2 text-center border border-indigo-200 shadow-sm">
                        <div className="text-xl font-bold text-gray-900">{configDetailResult.airConfig.kansaiNormal.toFixed(3)}</div>
                        <div className="text-xs font-bold text-gray-700 mt-1">关西普货</div>
                      </div>
                      <div className="bg-indigo-50 rounded-md p-2 text-center border border-indigo-200 shadow-sm">
                        <div className="text-xl font-bold text-gray-900">{configDetailResult.airConfig.kansaiSpecial.toFixed(3)}</div>
                        <div className="text-xs font-bold text-gray-700 mt-1">关西特货</div>
                      </div>
                    </div>
                  </div>

                  {/* 海空配置明细 */}
                  <div>
                    <div className="text-base font-bold text-gray-700 mb-2 pl-2 border-l-4 border-emerald-500">海空配置明细</div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-emerald-50 rounded-md p-2 text-center border border-emerald-200 shadow-sm">
                        <div className="text-xl font-bold text-gray-900">{configDetailResult.seaAirConfig.kantoNormal.toFixed(3)}</div>
                        <div className="text-xs font-bold text-gray-700 mt-1">关东普货</div>
                      </div>
                      <div className="bg-emerald-50 rounded-md p-2 text-center border border-emerald-200 shadow-sm">
                        <div className="text-xl font-bold text-gray-900">{configDetailResult.seaAirConfig.kantoSpecial.toFixed(3)}</div>
                        <div className="text-xs font-bold text-gray-700 mt-1">关东特货</div>
                      </div>
                      <div className="bg-emerald-50 rounded-md p-2 text-center border border-emerald-200 shadow-sm">
                        <div className="text-xl font-bold text-gray-900">{configDetailResult.seaAirConfig.kansaiNormal.toFixed(3)}</div>
                        <div className="text-xs font-bold text-gray-700 mt-1">关西普货</div>
                      </div>
                      <div className="bg-emerald-50 rounded-md p-2 text-center border border-emerald-200 shadow-sm">
                        <div className="text-xl font-bold text-gray-900">{configDetailResult.seaAirConfig.kansaiSpecial.toFixed(3)}</div>
                        <div className="text-xs font-bold text-gray-700 mt-1">关西特货</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : configDetailForm.collect_date ? (
                <div className="text-center py-8 text-gray-500">
                  该日期下没有配置明细数据，请先在主单发放模块创建主单
                </div>
              ) : null}

              {/* 操作区 */}
              <div className="flex items-center gap-4 mt-5">
                <Button variant="outline" onClick={() => { setConfigDetailForm({ collect_date: '', warehouse: '', package_count: 0, weight: 0 }); setConfigDetailResult(null); }}>
                  清空
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 配置文档 */}
        {activeTab === 'config-docs' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>📄 模块逻辑流程文档</CardTitle>
                <p className="text-sm text-gray-500 mt-1">查看各模块之间的数据流和计算逻辑</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={async () => {
                  try {
                    const response = await fetch('/api/logic-flow-docs');
                    const data = await response.json();
                    if (!data.success) throw new Error('获取文档失败');
                    
                    // 下载 Markdown
                    const blob = new Blob([data.content], { type: 'text/markdown;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = '模块逻辑流程文档.md';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    alert('下载失败: ' + (error instanceof Error ? error.message : '网络错误'));
                  }
                }}>
                  📄 下载 Markdown
                </Button>
                <Button onClick={async () => {
                  try {
                    const response = await fetch('/api/logic-flow-docs');
                    const data = await response.json();
                    if (!data.success) throw new Error('获取文档失败');
                    
                    // 将 Markdown 转换为 HTML 用于 Word
                    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>模块逻辑流程文档</title>
  <style>
    body { font-family: "Microsoft YaHei", sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #1e3a8a; border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; }
    h2 { color: #1e40af; border-bottom: 2px solid #93c5fd; padding-bottom: 8px; margin-top: 30px; }
    h3 { color: #3b82f6; margin-top: 25px; }
    h4 { color: #2563eb; margin-top: 20px; }
    pre { background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
    code { background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    pre code { background: none; padding: 0; }
    ul, ol { padding-left: 20px; }
    li { margin: 5px 0; }
    strong { color: #1e40af; }
    hr { border: none; border-top: 2px dashed #d1d5db; margin: 30px 0; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 15px; color: #4b5563; background: #f9fafb; padding: 10px 15px; }
  </style>
</head>
<body>
${markdownToHtml(data.content)}
</body>
</html>`;

                    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = '模块逻辑流程文档.doc';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    alert('下载失败: ' + (error instanceof Error ? error.message : '网络错误'));
                  }
                }}>
                  📥 下载 Word
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                <div className="prose prose-slate max-w-none bg-white rounded-lg border p-8" style={{ minWidth: '1200px' }}>
                  {renderLogicFlowDoc()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Markdown 转 HTML 辅助函数 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .prose h1 { font-size: 2.25em; font-weight: 700; margin-bottom: 1em; color: #1e3a8a; border-bottom: 3px solid #1e3a8a; padding-bottom: 0.5em; }
          .prose h2 { font-size: 1.875em; font-weight: 600; margin-top: 2em; margin-bottom: 1em; color: #1e40af; border-bottom: 2px solid #93c5fd; padding-bottom: 0.5em; }
          .prose h3 { font-size: 1.5em; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.75em; color: #3b82f6; }
          .prose h4 { font-size: 1.25em; font-weight: 600; margin-top: 1.25em; margin-bottom: 0.5em; color: #2563eb; }
          .prose p { margin-bottom: 1em; line-height: 1.8; color: #374151; }
          .prose ul, .prose ol { margin-bottom: 1em; padding-left: 2em; }
          .prose li { margin-bottom: 0.5em; line-height: 1.7; }
          .prose pre { background: #f3f4f6; padding: 1.5em; border-radius: 0.5em; overflow-x: auto; margin: 1em 0; font-size: 0.875em; line-height: 1.6; }
          .prose code { background: #fef3c7; padding: 0.125em 0.375em; border-radius: 0.25em; font-size: 0.875em; color: #92400e; }
          .prose pre code { background: none; padding: 0; color: inherit; }
          .prose strong { color: #1e40af; font-weight: 700; }
          .prose hr { border: none; border-top: 2px dashed #d1d5db; margin: 2em 0; }
          .prose blockquote { border-left: 4px solid #3b82f6; padding-left: 1em; margin: 1em 0; color: #4b5563; background: #f9fafb; padding: 1em; border-radius: 0 0.5em 0.5em 0; }
          .flow-step { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 1em 1.5em; margin: 1em 0; border-radius: 0.5em; }
          .flow-step-title { font-weight: 700; color: #1e40af; margin-bottom: 0.5em; font-size: 1.1em; }
          .formula { background: #fef3c7; border: 1px solid #fbbf24; padding: 1em; border-radius: 0.5em; margin: 1em 0; font-family: monospace; }
        `
      }} />

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
            <Input type="date" id="filter-order-date" placeholder="揽收日期" value={orderListFilterDate} onChange={e => setOrderListFilterDate(e.target.value)} />
            <Select value={orderListFilterWarehouse} onValueChange={setOrderListFilterWarehouse}>
              <SelectTrigger><SelectValue placeholder="仓库" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="东莞">东莞</SelectItem>
                <SelectItem value="加工区">加工区</SelectItem>
              </SelectContent>
            </Select>
            <Select value={orderListFilterPort} onValueChange={setOrderListFilterPort}>
              <SelectTrigger><SelectValue placeholder="口岸" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="关东">关东</SelectItem>
                <SelectItem value="关西">关西</SelectItem>
              </SelectContent>
            </Select>
            <Select value={orderListFilterCargoType} onValueChange={setOrderListFilterCargoType}>
              <SelectTrigger><SelectValue placeholder="货物属性" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="普货">普货</SelectItem>
                <SelectItem value="特货">特货</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => {
              loadMainOrdersWithFilter(orderListFilterDate, orderListFilterWarehouse, orderListFilterPort, orderListFilterCargoType);
            }}>查询</Button>
          </div>
          <div className="mb-4">
            <Button variant="outline" onClick={() => {
              setOrderListFilterDate('');
              setOrderListFilterWarehouse('全部');
              setOrderListFilterPort('全部');
              setOrderListFilterCargoType('全部');
              loadMainOrdersWithFilter();
            }}>重置筛选</Button>
          </div>
          <div className="flex-1 overflow-auto border rounded-lg" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <Table style={{ tableLayout: 'fixed', minWidth: '1800px' }} className="w-full text-base">
              <TableHeader className="sticky top-0 bg-white z-50">
                <TableRow>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '100px' }}>揽收日期</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '70px' }}>仓库</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '70px' }}>口岸</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '70px' }}>货物属性</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '80px' }}>路由类型</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '120px' }}>主单号</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '90px' }}>航班号</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '70px' }}>目的港</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '100px' }}>打货上限</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '140px' }}>起飞时间</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '150px', minWidth: '150px' }}>二程航班</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '140px' }}>到港时间</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '90px' }}>实际件数</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '90px' }}>实际重量</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '90px' }}>实际体积</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '90px' }}>实际票数</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '80px' }}>备注</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1" style={{ width: '100px' }}>是否开具售卡</TableHead>
                  <TableHead className="bg-gray-50 text-center px-1 py-1 sticky right-0" style={{ width: '120px' }}>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mainOrders.slice(0, 100).map(order => (
                  <TableRow key={order.id} style={{ height: 'auto' }}>
                    <TableCell className="text-center px-1 py-2">{order.collect_date}</TableCell>
                    <TableCell className="text-center px-1 py-2">{order.warehouse}</TableCell>
                    <TableCell className="text-center px-1 py-2">{order.port}</TableCell>
                    <TableCell className="text-center px-1 py-2">{order.cargo_type}</TableCell>
                    <TableCell className="text-center px-1 py-2">
                      {order.route_type ? (
                        <Badge variant={order.route_type === '空运' ? 'default' : 'secondary'}>
                          {order.route_type}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center px-1 py-2">{order.main_no || '-'}</TableCell>
                    <TableCell className="text-center px-1 py-2">{order.flight_no || '-'}</TableCell>
                    <TableCell className="text-center px-1 py-2">{order.dest || '-'}</TableCell>
                    <TableCell className="text-center px-1 py-2">{order.max_volume || '-'}</TableCell>
                    <TableCell className="text-center px-1 py-2">
                      {formatDateTime(order.actual_flight_date, order.depart_time) || '-'}
                    </TableCell>
                    <TableCell className="text-center px-1 py-2 whitespace-normal break-words" style={{ minWidth: '150px' }}>{order.second_flight || '-'}</TableCell>
                    <TableCell className="text-center px-1 py-2">
                      {formatArrivalDateTime(order) || '-'}
                    </TableCell>
                    <TableCell className="text-center px-1 py-2">{order.actual_pieces || '-'}</TableCell>
                    <TableCell className="text-center px-1 py-2">{order.actual_weight || '-'}</TableCell>
                    <TableCell className="text-center px-1 py-2">{order.actual_volume || '-'}</TableCell>
                    <TableCell className="text-center px-1 py-2">{order.actual_bills || '-'}</TableCell>
                    <TableCell className="text-center px-1 py-2" style={{ minWidth: '80px', maxWidth: '80px' }}>
                      <div className="flex items-center justify-center gap-1">
                        <span className="truncate" style={{ maxWidth: '60px' }} title={order.remark || ''}>
                          {order.remark ? (order.remark.length > 10 ? order.remark.substring(0, 10) + '...' : order.remark) : '-'}
                        </span>
                        {order.remark && (
                          <Button size="sm" variant="ghost" className="h-6 px-1 text-xs"
                            onClick={() => {
                              setCurrentRemark(order.remark || '');
                              setRemarkDetailOpen(true);
                            }}
                          >
                            详情
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-1 py-2">
                      {order.issue_card ? (
                        <Badge variant={order.issue_card === '是' ? 'default' : 'secondary'}>
                          {order.issue_card}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center px-1 py-2 sticky right-0 bg-white">
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
                            issue_card: order.issue_card || '否',
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

      {/* 备注详情弹窗 */}
      <Dialog open={remarkDetailOpen} onOpenChange={setRemarkDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>备注详情</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-gray-50 rounded-lg min-h-[100px] max-h-[400px] overflow-y-auto">
            <p className="whitespace-pre-wrap break-words">{currentRemark}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setRemarkDetailOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
