-- ============================================
-- 物流管理系统 - 安全数据库初始化脚本
-- 特点：不删除现有数据，仅创建不存在的表
-- ============================================

-- 1. 区域参数配置表
CREATE TABLE IF NOT EXISTS area_configs (
  id SERIAL PRIMARY KEY,
  warehouse TEXT NOT NULL,
  package_volume DECIMAL(12,6) NOT NULL DEFAULT 0,
  kanto_ratio DECIMAL(5,2) NOT NULL DEFAULT 0,
  kansai_ratio DECIMAL(5,2) NOT NULL DEFAULT 0,
  kanto_normal_ratio DECIMAL(5,2) NOT NULL DEFAULT 0,
  kanto_special_ratio DECIMAL(5,2) NOT NULL DEFAULT 0,
  kansai_normal_ratio DECIMAL(5,2) NOT NULL DEFAULT 0,
  kansai_special_ratio DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 航班配置表
CREATE TABLE IF NOT EXISTS flight_configs (
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

-- 3. 目的港配置表
CREATE TABLE IF NOT EXISTS port_configs (
  id SERIAL PRIMARY KEY,
  port_code TEXT NOT NULL,
  region TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 航空路由配置表
CREATE TABLE IF NOT EXISTS route_configs (
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

-- 5. 方数预估表
CREATE TABLE IF NOT EXISTS volume_estimates (
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

-- 6. 主单发放表
CREATE TABLE IF NOT EXISTS main_orders (
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

-- 禁用 RLS（简化权限控制）
ALTER TABLE area_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE flight_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE port_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE route_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE volume_estimates DISABLE ROW LEVEL SECURITY;
ALTER TABLE main_orders DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 如果需要将现有数据的占比字段改为小数类型
-- 取消下面这段注释后执行（仅执行一次）
-- ============================================
/*
ALTER TABLE area_configs 
  ALTER COLUMN kanto_ratio TYPE DECIMAL(5,2),
  ALTER COLUMN kansai_ratio TYPE DECIMAL(5,2),
  ALTER COLUMN kanto_normal_ratio TYPE DECIMAL(5,2),
  ALTER COLUMN kanto_special_ratio TYPE DECIMAL(5,2),
  ALTER COLUMN kansai_normal_ratio TYPE DECIMAL(5,2),
  ALTER COLUMN kansai_special_ratio TYPE DECIMAL(5,2);
*/
