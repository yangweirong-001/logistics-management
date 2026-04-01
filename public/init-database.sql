-- ============================================
-- 物流管理系统 - 完整数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 删除所有旧表（如果存在）
DROP TABLE IF EXISTS main_orders CASCADE;
DROP TABLE IF EXISTS volume_estimates CASCADE;
DROP TABLE IF EXISTS route_configs CASCADE;
DROP TABLE IF EXISTS port_configs CASCADE;
DROP TABLE IF EXISTS flight_configs CASCADE;
DROP TABLE IF EXISTS area_configs CASCADE;

-- ============================================
-- 1. 区域参数配置表
-- ============================================
CREATE TABLE area_configs (
  id SERIAL PRIMARY KEY,
  warehouse TEXT NOT NULL,
  package_volume DECIMAL(12,6) NOT NULL DEFAULT 0,
  kanto_ratio INTEGER NOT NULL DEFAULT 0,
  kansai_ratio INTEGER NOT NULL DEFAULT 0,
  kanto_normal_ratio INTEGER NOT NULL DEFAULT 0,
  kanto_special_ratio INTEGER NOT NULL DEFAULT 0,
  kansai_normal_ratio INTEGER NOT NULL DEFAULT 0,
  kansai_special_ratio INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 航班配置表
-- ============================================
CREATE TABLE flight_configs (
  id SERIAL PRIMARY KEY,
  warehouse TEXT NOT NULL,
  weekday TEXT NOT NULL,
  kanto_normal TEXT,
  kansai_normal TEXT,
  kanto_special TEXT,
  kansai_special TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 目的港配置表
-- ============================================
CREATE TABLE port_configs (
  id SERIAL PRIMARY KEY,
  port_code TEXT NOT NULL,
  region TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. 航空路由配置表
-- ============================================
CREATE TABLE route_configs (
  id SERIAL PRIMARY KEY,
  flight_no TEXT NOT NULL,
  origin TEXT NOT NULL,
  transfer TEXT,
  dest TEXT NOT NULL,
  depart_time TEXT,
  arrive_time TEXT,
  is_next_day TEXT,
  second_flight TEXT,
  route_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. 方数预估表
-- ============================================
CREATE TABLE volume_estimates (
  id SERIAL PRIMARY KEY,
  collect_date DATE NOT NULL,
  weekday TEXT,
  warehouse TEXT NOT NULL,
  package_count INTEGER DEFAULT 0,
  total_volume DECIMAL(10,3),
  kanto_total DECIMAL(10,3),
  kansai_total DECIMAL(10,3),
  kanto_normal DECIMAL(10,3),
  kanto_special DECIMAL(10,3),
  kansai_normal DECIMAL(10,3),
  kansai_special DECIMAL(10,3),
  air_volume DECIMAL(10,3),
  sea_air_volume DECIMAL(10,3),
  is_complete TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. 主单发放表
-- ============================================
CREATE TABLE main_orders (
  id SERIAL PRIMARY KEY,
  collect_date DATE NOT NULL,
  collect_weekday TEXT,
  depart_date DATE,
  depart_weekday TEXT,
  warehouse TEXT NOT NULL,
  cargo_type TEXT NOT NULL,
  port TEXT NOT NULL,
  category TEXT,
  status TEXT,
  pack_req TEXT,
  max_volume TEXT,
  max_pieces INTEGER,
  est_volume TEXT,
  est_pieces INTEGER,
  route_type TEXT,
  req_flight_date DATE,
  actual_flight_date DATE,
  main_no TEXT,
  flight_no TEXT,
  origin TEXT,
  transfer TEXT,
  dest TEXT,
  depart_time TEXT,
  arrive_time TEXT,
  actual_pieces INTEGER,
  actual_weight TEXT,
  actual_volume TEXT,
  actual_bills INTEGER,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 禁用 RLS（简化权限控制）
-- ============================================
ALTER TABLE area_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE flight_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE port_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE route_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE volume_estimates DISABLE ROW LEVEL SECURITY;
ALTER TABLE main_orders DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 完成！
-- ============================================
-- 执行此脚本后，所有数据表已创建完成
-- 访问 https://projects-roan-beta.vercel.app/ 开始使用
