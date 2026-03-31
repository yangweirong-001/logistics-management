'use client';

import { useState, useEffect } from 'react';
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
  total_volume: string | null;
  kanto_total: string | null;
  kansai_total: string | null;
  kanto_normal: string | null;
  kanto_special: string | null;
  kansai_normal: string | null;
  kansai_special: string | null;
  air_volume: string | null;
  sea_air_volume: string | null;
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
  req_flight_date: string | null;
  actual_flight_date: string | null;
  main_no: string | null;
  flight_no: string | null;
  origin: string | null;
  transfer: string | null;
  dest: string | null;
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
    actual_flight_date: '',
    main_no: '',
    flight_no: '',
    origin: '',
    transfer: '',
    dest: '',
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
    if (data.success) setRouteConfigs(data.data);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeForm.collect_date, volumeForm.warehouse, volumeForm.package_count, areaConfigs, flightConfigs]);
  
  // 区域参数配置操作
  const saveAreaConfig = async (formData: FormData) => {
    const data = {
      warehouse: formData.get('warehouse') as string,
      package_volume: formData.get('package_volume') as string,
      kanto_ratio: formData.get('kanto_ratio') as string,
      kansai_ratio: formData.get('kansai_ratio') as string,
      kanto_normal_ratio: formData.get('kanto_normal_ratio') as string,
      kanto_special_ratio: formData.get('kanto_special_ratio') as string,
      kansai_normal_ratio: formData.get('kansai_normal_ratio') as string,
      kansai_special_ratio: formData.get('kansai_special_ratio') as string,
    };
    
    if (editingArea) {
      await fetch(`/api/area-config/${editingArea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/area-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    
    setAreaModalOpen(false);
    setEditingArea(null);
    loadAreaConfigs();
  };
  
  const deleteAreaConfig = async (id: number) => {
    if (confirm('确定删除此配置？')) {
      await fetch(`/api/area-config/${id}`, { method: 'DELETE' });
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
    
    if (editingFlight) {
      await fetch(`/api/flight-config/${editingFlight.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/flight-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    
    setFlightModalOpen(false);
    setEditingFlight(null);
    loadFlightConfigs();
  };
  
  const deleteFlightConfig = async (id: number) => {
    if (confirm('确定删除此配置？')) {
      await fetch(`/api/flight-config/${id}`, { method: 'DELETE' });
      loadFlightConfigs();
    }
  };
  
  // 目的港配置操作
  const savePortConfig = async (formData: FormData) => {
    const data = {
      port_code: formData.get('port_code') as string,
      region: formData.get('region') as string,
    };
    
    if (editingPort) {
      await fetch(`/api/port-config/${editingPort.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/port-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    
    setPortModalOpen(false);
    setEditingPort(null);
    loadPortConfigs();
  };
  
  const deletePortConfig = async (id: number) => {
    if (confirm('确定删除此配置？')) {
      await fetch(`/api/port-config/${id}`, { method: 'DELETE' });
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
    
    if (editingRoute) {
      await fetch(`/api/route-config/${editingRoute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/route-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    
    setRouteModalOpen(false);
    setEditingRoute(null);
    loadRouteConfigs();
  };
  
  const deleteRouteConfig = async (id: number) => {
    if (confirm('确定删除此配置？')) {
      await fetch(`/api/route-config/${id}`, { method: 'DELETE' });
      loadRouteConfigs();
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
    
    if (editingVolume) {
      await fetch(`/api/volume-estimate/${editingVolume.id}`, {
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
          is_complete: volumeForm.is_complete,
        }),
      });
    } else {
      await fetch('/api/volume-estimate', {
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
          is_complete: volumeForm.is_complete,
        }),
      });
    }
    
    loadVolumeEstimates();
    setEditingVolume(null);
    setVolumeForm({ collect_date: '', warehouse: '', package_count: 0, is_complete: '是' });
    setVolumeResult(null);
    alert('保存成功！');
  };
  
  // 编辑方数预估记录
  const editVolumeEstimate = (record: VolumeEstimate) => {
    setEditingVolume(record);
    setVolumeForm({
      collect_date: record.collect_date,
      warehouse: record.warehouse,
      package_count: record.package_count,
      is_complete: record.is_complete || '是',
    });
  };
  
  // 删除方数预估记录
  const deleteVolumeEstimate = async (id: number) => {
    if (confirm('确定删除此记录？')) {
      await fetch(`/api/volume-estimate/${id}`, { method: 'DELETE' });
      loadVolumeEstimates();
    }
  };
  
  // 主单操作
  const saveMainOrder = async () => {
    const category = `${orderForm.port}${orderForm.cargo_type}`;
    
    // 计算预估方数
    const estimate = volumeEstimates.find(
      e => e.collect_date === orderForm.collect_date && e.warehouse === orderForm.warehouse
    );
    
    let estVolume = 0;
    let estPieces = 0;
    
    if (estimate) {
      if (orderForm.port === '关东' && orderForm.cargo_type === '普货') {
        estVolume = parseFloat(estimate.kanto_normal || '0');
      } else if (orderForm.port === '关东' && orderForm.cargo_type === '特货') {
        estVolume = parseFloat(estimate.kanto_special || '0');
      } else if (orderForm.port === '关西' && orderForm.cargo_type === '普货') {
        estVolume = parseFloat(estimate.kansai_normal || '0');
      } else if (orderForm.port === '关西' && orderForm.cargo_type === '特货') {
        estVolume = parseFloat(estimate.kansai_special || '0');
      }
      
      // 预估件数 = 预估方数 / 0.06
      estPieces = Math.round(estVolume / 0.06);
    }
    
    // 计算打货上限件数
    let maxPieces = 0;
    if (orderForm.max_volume && orderForm.pack_req && orderForm.warehouse) {
      const maxVolume = parseFloat(orderForm.max_volume);
      if (orderForm.warehouse === '东莞') {
        maxPieces = Math.round(maxVolume / (orderForm.pack_req === '纸箱' ? 0.12 : 0.159));
      } else {
        maxPieces = Math.round(maxVolume / (orderForm.pack_req === '纸箱' ? 0.12 : 0.18));
      }
    }
    
    const data = {
      ...orderForm,
      collect_weekday: orderForm.collect_date ? getWeekday(orderForm.collect_date) : null,
      depart_weekday: orderForm.depart_date ? getWeekday(orderForm.depart_date) : null,
      category,
      req_flight_date: orderForm.depart_date ? addDays(orderForm.depart_date, 1) : null,
      est_volume: estVolume.toFixed(3),
      est_pieces: estPieces,
      max_pieces: maxPieces,
    };
    
    if (editingOrder) {
      await fetch(`/api/main-order/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/main-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    
    loadMainOrders();
    alert('保存成功！');
    setEditingOrder(null);
  };
  
  const deleteMainOrder = async (id: number) => {
    if (confirm('确定删除此主单？')) {
      await fetch(`/api/main-order/${id}`, { method: 'DELETE' });
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
              estVolume = parseFloat(estimate.kanto_normal || '0');
            } else if (pt === '关东' && ct === '特货') {
              estVolume = parseFloat(estimate.kanto_special || '0');
            } else if (pt === '关西' && ct === '普货') {
              estVolume = parseFloat(estimate.kansai_normal || '0');
            } else if (pt === '关西' && ct === '特货') {
              estVolume = parseFloat(estimate.kansai_special || '0');
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
  
  // 填充航班信息
  const fillFlightInfo = (flightNo: string) => {
    const route = routeConfigs.find(r => r.flight_no === flightNo);
    if (route) {
      setOrderForm(prev => ({
        ...prev,
        flight_no: flightNo,
        origin: route.origin,
        transfer: route.transfer || '',
        dest: route.dest,
        depart_time: route.depart_time || '',
        arrive_time: route.arrive_time || '',
      }));
    }
  };
  
  // 获取可用航班号列表
  const getAvailableFlights = () => {
    // 如果没有配置路由，返回空数组
    if (!routeConfigs || routeConfigs.length === 0) return [];
    
    // 获取类别对应的路由类型
    const category = `${orderForm.port}${orderForm.cargo_type}`;
    
    // 根据航班配置确定路由类型
    const weekday = orderForm.collect_date ? getWeekday(orderForm.collect_date) : '';
    const flightConfig = flightConfigs.find(
      f => f.warehouse === orderForm.warehouse && f.weekday === weekday
    );
    
    // 如果没有航班配置或类别为空，显示所有航班
    if (!flightConfig || !category) {
      return routeConfigs;
    }
    
    let routeType = '';
    if (category === '关东普货') routeType = flightConfig.kanto_normal || '';
    else if (category === '关东特货') routeType = flightConfig.kanto_special || '';
    else if (category === '关西普货') routeType = flightConfig.kansai_normal || '';
    else if (category === '关西特货') routeType = flightConfig.kansai_special || '';
    
    // 如果没有匹配的路由类型，显示所有航班
    if (!routeType) {
      return routeConfigs;
    }
    
    return routeConfigs.filter(r => r.route_type === routeType);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 侧边栏 */}
      <aside className="w-60 bg-slate-900 text-white flex flex-col">
        <div className="p-5 text-lg font-bold border-b border-white/10 text-center">
          物流管理系统
        </div>
        
        <nav className="flex-1 py-2">
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
          <div className="text-sm text-white/70 mb-2">联网版本</div>
          <div className="text-xs text-green-400">在线同步</div>
        </div>
      </aside>
      
      {/* 主内容区 */}
      <main className="flex-1 p-5">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>仓库</TableHead>
                      <TableHead>大包预估体积</TableHead>
                      <TableHead>关东目的港占比</TableHead>
                      <TableHead>关西目的港占比</TableHead>
                      <TableHead>关东普货占比</TableHead>
                      <TableHead>关东特货占比</TableHead>
                      <TableHead>关西普货占比</TableHead>
                      <TableHead>关西特货占比</TableHead>
                      <TableHead>操作</TableHead>
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
                <Button onClick={() => { setEditingFlight(null); setFlightModalOpen(true); }}>
                  新增配置
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>仓库</TableHead>
                      <TableHead>周几</TableHead>
                      <TableHead>关东普货路由</TableHead>
                      <TableHead>关西普货路由</TableHead>
                      <TableHead>关东特货路由</TableHead>
                      <TableHead>关西特货路由</TableHead>
                      <TableHead>备注</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flightConfigs.map(config => (
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>目的港代码</TableHead>
                      <TableHead>所属区域</TableHead>
                      <TableHead>操作</TableHead>
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
                <Button onClick={() => { setEditingRoute(null); setRouteModalOpen(true); }}>
                  新增配置
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>航班号</TableHead>
                      <TableHead>始发</TableHead>
                      <TableHead>中转</TableHead>
                      <TableHead>目的</TableHead>
                      <TableHead>起飞时间</TableHead>
                      <TableHead>落地时间</TableHead>
                      <TableHead>是否隔天</TableHead>
                      <TableHead>路由</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routeConfigs.map(config => (
                      <TableRow key={config.id}>
                        <TableCell>{config.flight_no}</TableCell>
                        <TableCell>{config.origin}</TableCell>
                        <TableCell>{config.transfer || '-'}</TableCell>
                        <TableCell>{config.dest}</TableCell>
                        <TableCell>{config.depart_time || '-'}</TableCell>
                        <TableCell>{config.arrive_time || '-'}</TableCell>
                        <TableCell>{config.is_next_day || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={config.route_type === '空运' ? 'default' : 'secondary'}>
                            {config.route_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
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
                <div className="grid grid-cols-4 gap-4 mb-5">
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
                    <Button variant="outline" onClick={() => { setEditingVolume(null); setVolumeForm({ collect_date: '', warehouse: '', package_count: 0, is_complete: '是' }); setVolumeResult(null); }}>
                      清空
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 最近保存的记录 */}
            <Card>
              <CardHeader>
                <CardTitle>最近保存的记录</CardTitle>
              </CardHeader>
              <CardContent>
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
                      <TableHead>货物袋数齐全</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {volumeEstimates.slice(0, 10).map(record => (
                      <TableRow key={record.id}>
                        <TableCell>{record.collect_date}</TableCell>
                        <TableCell>{record.warehouse}</TableCell>
                        <TableCell>{record.package_count}</TableCell>
                        <TableCell>{parseFloat(record.total_volume || '0').toFixed(3)}</TableCell>
                        <TableCell>{parseFloat(record.kanto_total || '0').toFixed(3)}</TableCell>
                        <TableCell>{parseFloat(record.kansai_total || '0').toFixed(3)}</TableCell>
                        <TableCell>{parseFloat(record.kanto_normal || '0').toFixed(3)}</TableCell>
                        <TableCell>{parseFloat(record.kanto_special || '0').toFixed(3)}</TableCell>
                        <TableCell>{parseFloat(record.kansai_normal || '0').toFixed(3)}</TableCell>
                        <TableCell>{parseFloat(record.kansai_special || '0').toFixed(3)}</TableCell>
                        <TableCell>{parseFloat(record.air_volume || '0').toFixed(3)}</TableCell>
                        <TableCell>{parseFloat(record.sea_air_volume || '0').toFixed(3)}</TableCell>
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
                    {volumeEstimates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center text-gray-500">暂无记录</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* 主单发放 */}
        {activeTab === 'main-order' && (
          <div>
            <Card className="mb-5">
              <CardHeader>
                <CardTitle>主单发放</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label>揽收日期</Label>
                    <div className="flex gap-2">
                      <Input type="date" className="flex-1" value={orderForm.collect_date}
                        onChange={e => setOrderForm(prev => ({ ...prev, collect_date: e.target.value }))} />
                      <Input className="w-14 bg-blue-50 text-blue-600 font-semibold text-center text-sm"
                        value={orderForm.collect_date ? getWeekday(orderForm.collect_date) : ''} readOnly />
                    </div>
                  </div>
                  <div>
                    <Label>发车日期</Label>
                    <div className="flex gap-2">
                      <Input type="date" className="flex-1" value={orderForm.depart_date}
                        onChange={e => setOrderForm(prev => ({ ...prev, depart_date: e.target.value }))} />
                      <Input className="w-14 bg-blue-50 text-blue-600 font-semibold text-center text-sm"
                        value={orderForm.depart_date ? getWeekday(orderForm.depart_date) : ''} readOnly />
                    </div>
                  </div>
                  <div>
                    <Label>仓库</Label>
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
                    <Label>货物属性</Label>
                    <Select value={orderForm.cargo_type}
                      onValueChange={v => setOrderForm(prev => ({ ...prev, cargo_type: v }))}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="特货">特货</SelectItem>
                        <SelectItem value="普货">普货</SelectItem>
                        <SelectItem value="混打">混打</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label>口岸</Label>
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
                    <Label>类别（路由）</Label>
                    <Input className="bg-gray-50" value={orderForm.port && orderForm.cargo_type ? `${orderForm.port}${orderForm.cargo_type}` : ''} readOnly placeholder="自动计算" />
                  </div>
                  <div>
                    <Label>主单状态</Label>
                    <Select value={orderForm.status}
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
                    <Label>打货要求</Label>
                    <Select value={orderForm.pack_req}
                      onValueChange={v => setOrderForm(prev => ({ ...prev, pack_req: v }))}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="纸箱">纸箱</SelectItem>
                        <SelectItem value="麻袋">麻袋</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label>打货上限（航线提供）</Label>
                    <Input type="number" step="0.001" value={orderForm.max_volume}
                      onChange={e => setOrderForm(prev => ({ ...prev, max_volume: e.target.value }))} />
                  </div>
                  <div>
                    <Label>打货上限件数</Label>
                    <Input className="bg-gray-50" readOnly placeholder="自动计算"
                      value={orderForm.max_volume && orderForm.pack_req && orderForm.warehouse
                        ? Math.round(parseFloat(orderForm.max_volume) / (orderForm.warehouse === '东莞'
                          ? (orderForm.pack_req === '纸箱' ? 0.12 : 0.159)
                          : (orderForm.pack_req === '纸箱' ? 0.12 : 0.18)))
                        : ''} />
                  </div>
                  <div>
                    <Label>预估方数</Label>
                    <Input className="bg-gray-50" readOnly placeholder="自动计算"
                      value={(() => {
                        if (!orderForm.collect_date || !orderForm.warehouse || !orderForm.port || !orderForm.cargo_type) return '';
                        const estimate = volumeEstimates.find(e => e.collect_date === orderForm.collect_date && e.warehouse === orderForm.warehouse);
                        if (!estimate) return '';
                        if (orderForm.port === '关东' && orderForm.cargo_type === '普货') return parseFloat(estimate.kanto_normal || '0').toFixed(3);
                        if (orderForm.port === '关东' && orderForm.cargo_type === '特货') return parseFloat(estimate.kanto_special || '0').toFixed(3);
                        if (orderForm.port === '关西' && orderForm.cargo_type === '普货') return parseFloat(estimate.kansai_normal || '0').toFixed(3);
                        if (orderForm.port === '关西' && orderForm.cargo_type === '特货') return parseFloat(estimate.kansai_special || '0').toFixed(3);
                        return '';
                      })()} />
                  </div>
                  <div>
                    <Label>预估件数</Label>
                    <Input className="bg-gray-50" readOnly placeholder="自动计算"
                      value={(() => {
                        if (!orderForm.collect_date || !orderForm.warehouse || !orderForm.port || !orderForm.cargo_type) return '';
                        const estimate = volumeEstimates.find(e => e.collect_date === orderForm.collect_date && e.warehouse === orderForm.warehouse);
                        if (!estimate) return '';
                        let estVol = 0;
                        if (orderForm.port === '关东' && orderForm.cargo_type === '普货') estVol = parseFloat(estimate.kanto_normal || '0');
                        else if (orderForm.port === '关东' && orderForm.cargo_type === '特货') estVol = parseFloat(estimate.kanto_special || '0');
                        else if (orderForm.port === '关西' && orderForm.cargo_type === '普货') estVol = parseFloat(estimate.kansai_normal || '0');
                        else if (orderForm.port === '关西' && orderForm.cargo_type === '特货') estVol = parseFloat(estimate.kansai_special || '0');
                        return Math.round(estVol / 0.06);
                      })()} />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label>实际航班日期</Label>
                    <Input type="date" value={orderForm.actual_flight_date}
                      onChange={e => setOrderForm(prev => ({ ...prev, actual_flight_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>主单号</Label>
                    <Input value={orderForm.main_no}
                      onChange={e => setOrderForm(prev => ({ ...prev, main_no: e.target.value }))} />
                  </div>
                  <div>
                    <Label>航班号</Label>
                    <Select value={orderForm.flight_no}
                      onValueChange={v => { setOrderForm(prev => ({ ...prev, flight_no: v })); fillFlightInfo(v); }}>
                      <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                      <SelectContent>
                        {getAvailableFlights().map(r => (
                          <SelectItem key={r.id} value={r.flight_no}>{r.flight_no}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>始发港</Label>
                    <Input className="bg-gray-50" value={orderForm.origin} readOnly placeholder="自动填充" />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label>中转站</Label>
                    <Input className="bg-gray-50" value={orderForm.transfer} readOnly placeholder="自动填充" />
                  </div>
                  <div>
                    <Label>目的港</Label>
                    <Input className="bg-gray-50" value={orderForm.dest} readOnly placeholder="自动填充" />
                  </div>
                  <div>
                    <Label>起飞时间</Label>
                    <Input className="bg-gray-50" value={
                      orderForm.actual_flight_date && orderForm.depart_time 
                        ? `${orderForm.actual_flight_date} ${orderForm.depart_time}`
                        : orderForm.depart_time || ''
                    } readOnly placeholder="自动填充" />
                  </div>
                  <div>
                    <Label>到港时间</Label>
                    <Input className="bg-gray-50" value={
                      orderForm.actual_flight_date && orderForm.arrive_time 
                        ? `${orderForm.actual_flight_date} ${orderForm.arrive_time}`
                        : orderForm.arrive_time || ''
                    } readOnly placeholder="自动填充" />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label>实际件数</Label>
                    <Input type="number" value={orderForm.actual_pieces}
                      onChange={e => setOrderForm(prev => ({ ...prev, actual_pieces: e.target.value }))} />
                  </div>
                  <div>
                    <Label>实际重量</Label>
                    <Input type="number" step="0.01" value={orderForm.actual_weight}
                      onChange={e => setOrderForm(prev => ({ ...prev, actual_weight: e.target.value }))} />
                  </div>
                  <div>
                    <Label>实际体积</Label>
                    <Input type="number" step="0.001" value={orderForm.actual_volume}
                      onChange={e => setOrderForm(prev => ({ ...prev, actual_volume: e.target.value }))} />
                  </div>
                  <div>
                    <Label>实际票数</Label>
                    <Input type="number" value={orderForm.actual_bills}
                      onChange={e => setOrderForm(prev => ({ ...prev, actual_bills: e.target.value }))} />
                  </div>
                </div>
                
                <div className="mb-4">
                  <Label>备注</Label>
                  <Input placeholder="请输入备注信息" value={orderForm.remark}
                    onChange={e => setOrderForm(prev => ({ ...prev, remark: e.target.value }))} />
                </div>
                
                <div className="flex gap-3">
                  <Button onClick={saveMainOrder} className="bg-green-600 hover:bg-green-700">
                    保存主单
                  </Button>
                  <Button variant="default" onClick={() => setOrderListOpen(true)}>查看主单列表</Button>
                  <Button variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => {
                    setOrderForm({
                      collect_date: '', depart_date: '', warehouse: '', cargo_type: '', port: '',
                      status: '', pack_req: '', max_volume: '', actual_flight_date: '', main_no: '',
                      flight_no: '', origin: '', transfer: '', dest: '', depart_time: '', arrive_time: '',
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
              <CardHeader>
                <CardTitle>主单查询</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label>揽收日期</Label>
                    <Input type="date" id="query-order-date" />
                  </div>
                  <div>
                    <Label>仓库</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="东莞">东莞</SelectItem>
                        <SelectItem value="加工区">加工区</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={async () => {
                      const date = (document.getElementById('query-order-date') as HTMLInputElement).value;
                      const res = await fetch(`/api/main-order?collectDate=${date}`);
                      const data = await res.json();
                      if (data.success) setMainOrders(data.data);
                    }}>查询</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>查询结果</CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>揽收日期</TableHead>
                      <TableHead>仓库</TableHead>
                      <TableHead>口岸</TableHead>
                      <TableHead>货物属性</TableHead>
                      <TableHead>类别</TableHead>
                      <TableHead>主单号</TableHead>
                      <TableHead>航班号</TableHead>
                      <TableHead>目的港</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mainOrders.slice(0, 20).map(order => (
                      <TableRow key={order.id}>
                        <TableCell>{order.collect_date}</TableCell>
                        <TableCell>{order.warehouse}</TableCell>
                        <TableCell>{order.port}</TableCell>
                        <TableCell>{order.cargo_type}</TableCell>
                        <TableCell>{order.category}</TableCell>
                        <TableCell>{order.main_no || '-'}</TableCell>
                        <TableCell>{order.flight_no || '-'}</TableCell>
                        <TableCell>{order.dest || '-'}</TableCell>
                        <TableCell>
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
                                actual_flight_date: order.actual_flight_date || '',
                                main_no: order.main_no || '',
                                flight_no: order.flight_no || '',
                                origin: order.origin || '',
                                transfer: order.transfer || '',
                                dest: order.dest || '',
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>仓库</TableHead>
                        <TableHead>口岸</TableHead>
                        <TableHead>货物属性</TableHead>
                        <TableHead className="text-right">预估方数</TableHead>
                        <TableHead className="text-right">打货上限汇总</TableHead>
                        <TableHead className="text-right">欠方</TableHead>
                        <TableHead className="text-right">余方</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balanceResults.map((r, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{r.warehouse}</TableCell>
                          <TableCell>{r.port}</TableCell>
                          <TableCell>{r.cargo_type}</TableCell>
                          <TableCell className="text-right">{r.estVolume.toFixed(3)}</TableCell>
                          <TableCell className="text-right">{r.maxVolume.toFixed(3)}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            {r.deficit > 0 ? r.deficit.toFixed(3) : '0.000'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {r.surplus > 0 ? r.surplus.toFixed(3) : '0.000'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                <Input name="package_volume" type="number" step="0.01" defaultValue={editingArea?.package_volume} />
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
        <DialogContent className="w-[90vw] max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">主单列表</DialogTitle>
          </DialogHeader>
          <div className="mb-4 grid grid-cols-4 gap-3">
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
            <Button onClick={() => {
              const date = (document.getElementById('filter-order-date') as HTMLInputElement).value;
              loadMainOrdersWithFilter(date);
            }}>查询</Button>
          </div>
          <div className="flex-1 overflow-auto space-y-4" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            {mainOrders.length === 0 ? (
              <div className="text-center text-gray-500 py-8">暂无记录</div>
            ) : (
              mainOrders.slice(0, 50).map(order => (
                <Card key={order.id} className="overflow-hidden">
                  <div className="grid grid-cols-2 gap-0 text-sm">
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">揽收日期</div>
                    <div className="border-b p-3">{order.collect_date}</div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">仓库</div>
                    <div className="border-b p-3">{order.warehouse}</div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">口岸</div>
                    <div className="border-b p-3">{order.port}</div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">货物属性</div>
                    <div className="border-b p-3">{order.cargo_type}</div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">类别</div>
                    <div className="border-b p-3">{order.category}</div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">主单号</div>
                    <div className="border-b p-3">{order.main_no || '-'}</div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">航班号</div>
                    <div className="border-b p-3">{order.flight_no || '-'}</div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">目的港</div>
                    <div className="border-b p-3">{order.dest || '-'}</div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">打货上限</div>
                    <div className="border-b p-3">{order.max_volume || '-'}</div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">起飞时间</div>
                    <div className="border-b p-3">
                      {order.actual_flight_date && order.depart_time 
                        ? `${order.actual_flight_date} ${order.depart_time}` 
                        : order.depart_time || '-'}
                    </div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">到港时间</div>
                    <div className="border-b p-3">
                      {order.actual_flight_date && order.arrive_time 
                        ? `${order.actual_flight_date} ${order.arrive_time}` 
                        : order.arrive_time || '-'}
                    </div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">实际件数</div>
                    <div className="border-b p-3">{order.actual_pieces || '-'}</div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">实际重量</div>
                    <div className="border-b p-3">{order.actual_weight || '-'}</div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">实际体积</div>
                    <div className="border-b p-3">{order.actual_volume || '-'}</div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">实际票数</div>
                    <div className="border-b p-3">{order.actual_bills || '-'}</div>
                    
                    <div className="border-b border-r p-3 bg-gray-50 font-medium text-gray-600">备注</div>
                    <div className="border-b p-3">{order.remark || '-'}</div>
                    
                    <div className="border-r p-3 bg-gray-50 font-medium text-gray-600">操作</div>
                    <div className="p-3">
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
                            actual_flight_date: order.actual_flight_date || '',
                            main_no: order.main_no || '',
                            flight_no: order.flight_no || '',
                            origin: order.origin || '',
                            transfer: order.transfer || '',
                            dest: order.dest || '',
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
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
          <DialogFooter className="mt-4">
            <div className="text-sm text-gray-500 mr-auto">共 {mainOrders.length} 条记录</div>
            <Button variant="secondary" onClick={() => setOrderListOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
