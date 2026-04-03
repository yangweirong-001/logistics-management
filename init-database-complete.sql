-- =====================================================
-- 物流管理系统 - 完整数据库初始化脚本
-- 请在 Supabase SQL Editor 中执行
-- =====================================================

-- =====================================================
-- 第一步：创建表结构（如果不存在）
-- =====================================================

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
  weight DECIMAL(15,2),
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
  second_flight TEXT,
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

-- =====================================================
-- 第二步：禁用 RLS（Row Level Security）
-- =====================================================

ALTER TABLE area_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE flight_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE port_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE route_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE volume_estimates DISABLE ROW LEVEL SECURITY;
ALTER TABLE main_orders DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 第三步：添加缺失的字段（如果表已存在）
-- =====================================================

-- 添加 main_orders 的缺失字段
ALTER TABLE main_orders ADD COLUMN IF NOT EXISTS second_flight TEXT;
ALTER TABLE main_orders ADD COLUMN IF NOT EXISTS route_type TEXT;

-- 添加 volume_estimates 的缺失字段
ALTER TABLE volume_estimates ADD COLUMN IF NOT EXISTS weight DECIMAL(15,2);

-- =====================================================
-- 第四步：修改字段类型（如果需要）
-- =====================================================

-- 将 area_configs 的占比字段改为 DECIMAL(5,2)
DO $$
BEGIN
  -- 检查字段是否存在并修改类型
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_configs' AND column_name = 'kanto_ratio'
  ) THEN
    ALTER TABLE area_configs ALTER COLUMN kanto_ratio TYPE DECIMAL(5,2) USING kanto_ratio::DECIMAL(5,2);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_configs' AND column_name = 'kansai_ratio'
  ) THEN
    ALTER TABLE area_configs ALTER COLUMN kansai_ratio TYPE DECIMAL(5,2) USING kansai_ratio::DECIMAL(5,2);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_configs' AND column_name = 'kanto_normal_ratio'
  ) THEN
    ALTER TABLE area_configs ALTER COLUMN kanto_normal_ratio TYPE DECIMAL(5,2) USING kanto_normal_ratio::DECIMAL(5,2);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_configs' AND column_name = 'kanto_special_ratio'
  ) THEN
    ALTER TABLE area_configs ALTER COLUMN kanto_special_ratio TYPE DECIMAL(5,2) USING kanto_special_ratio::DECIMAL(5,2);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_configs' AND column_name = 'kansai_normal_ratio'
  ) THEN
    ALTER TABLE area_configs ALTER COLUMN kansai_normal_ratio TYPE DECIMAL(5,2) USING kansai_normal_ratio::DECIMAL(5,2);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'area_configs' AND column_name = 'kansai_special_ratio'
  ) THEN
    ALTER TABLE area_configs ALTER COLUMN kansai_special_ratio TYPE DECIMAL(5,2) USING kansai_special_ratio::DECIMAL(5,2);
  END IF;
END $$;

-- =====================================================
-- 第五步：插入示例数据（仅在表为空时）
-- =====================================================

-- 插入区域参数配置示例数据
INSERT INTO area_configs (warehouse, package_volume, kanto_ratio, kansai_ratio, kanto_normal_ratio, kanto_special_ratio, kansai_normal_ratio, kansai_special_ratio)
SELECT '东莞', 0.05, 0.6, 0.4, 0.7, 0.3, 0.8, 0.2
WHERE NOT EXISTS (SELECT 1 FROM area_configs LIMIT 1);

INSERT INTO area_configs (warehouse, package_volume, kanto_ratio, kansai_ratio, kanto_normal_ratio, kanto_special_ratio, kansai_normal_ratio, kansai_special_ratio)
SELECT '加工区', 0.04, 0.5, 0.5, 0.6, 0.4, 0.7, 0.3
WHERE NOT EXISTS (SELECT 1 FROM area_configs WHERE warehouse = '加工区');

-- 插入目的港配置示例数据
INSERT INTO port_configs (port_code, region) VALUES ('HND', '关东')
ON CONFLICT DO NOTHING;

INSERT INTO port_configs (port_code, region) VALUES ('NRT', '关东')
ON CONFLICT DO NOTHING;

INSERT INTO port_configs (port_code, region) VALUES ('KIX', '关西')
ON CONFLICT DO NOTHING;

INSERT INTO port_configs (port_code, region) VALUES ('OSA', '关西')
ON CONFLICT DO NOTHING;

INSERT INTO port_configs (port_code, region) VALUES ('TYO', '关东')
ON CONFLICT DO NOTHING;

-- 插入航班配置示例数据（东莞）
INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
SELECT '东莞', '周一', '空运', '空运', '空运', '空运', '常规航班'
WHERE NOT EXISTS (SELECT 1 FROM flight_configs WHERE warehouse = '东莞' AND weekday = '周一');

INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
SELECT '东莞', '周二', '空运', '空运', '空运', '空运', '常规航班'
WHERE NOT EXISTS (SELECT 1 FROM flight_configs WHERE warehouse = '东莞' AND weekday = '周二');

INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
SELECT '东莞', '周三', '空运', '空运', '空运', '空运', '常规航班'
WHERE NOT EXISTS (SELECT 1 FROM flight_configs WHERE warehouse = '东莞' AND weekday = '周三');

INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
SELECT '东莞', '周四', '空运', '空运', '空运', '空运', '常规航班'
WHERE NOT EXISTS (SELECT 1 FROM flight_configs WHERE warehouse = '东莞' AND weekday = '周四');

INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
SELECT '东莞', '周五', '空运', '空运', '空运', '空运', '常规航班'
WHERE NOT EXISTS (SELECT 1 FROM flight_configs WHERE warehouse = '东莞' AND weekday = '周五');

INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
SELECT '东莞', '周六', '空运', '空运', '空运', '空运', '常规航班'
WHERE NOT EXISTS (SELECT 1 FROM flight_configs WHERE warehouse = '东莞' AND weekday = '周六');

INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
SELECT '东莞', '周日', '空运', '空运', '空运', '空运', '常规航班'
WHERE NOT EXISTS (SELECT 1 FROM flight_configs WHERE warehouse = '东莞' AND weekday = '周日');

-- 插入航班配置示例数据（加工区）
INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
SELECT '加工区', '周一', '空运', '空运', '空运', '空运', '常规航班'
WHERE NOT EXISTS (SELECT 1 FROM flight_configs WHERE warehouse = '加工区' AND weekday = '周一');

INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
SELECT '加工区', '周二', '空运', '空运', '空运', '空运', '常规航班'
WHERE NOT EXISTS (SELECT 1 FROM flight_configs WHERE warehouse = '加工区' AND weekday = '周二');

INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
SELECT '加工区', '周三', '空运', '空运', '空运', '空运', '常规航班'
WHERE NOT EXISTS (SELECT 1 FROM flight_configs WHERE warehouse = '加工区' AND weekday = '周三');

INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
SELECT '加工区', '周四', '空运', '空运', '空运', '空运', '常规航班'
WHERE NOT EXISTS (SELECT 1 FROM flight_configs WHERE warehouse = '加工区' AND weekday = '周四');

INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
SELECT '加工区', '周五', '空运', '空运', '空运', '空运', '常规航班'
WHERE NOT EXISTS (SELECT 1 FROM flight_configs WHERE warehouse = '加工区' AND weekday = '周五');

INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
SELECT '加工区', '周六', '空运', '空运', '空运', '空运', '常规航班'
WHERE NOT EXISTS (SELECT 1 FROM flight_configs WHERE warehouse = '加工区' AND weekday = '周六');

INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
SELECT '加工区', '周日', '空运', '空运', '空运', '空运', '常规航班'
WHERE NOT EXISTS (SELECT 1 FROM flight_configs WHERE warehouse = '加工区' AND weekday = '周日');

-- 插入航空路由配置示例数据
INSERT INTO route_configs (flight_no, origin, transfer, dest, depart_time, arrive_time, is_next_day, second_flight, route_type)
SELECT 'MU575', 'PVG', '-', 'HND', '17:25', '20:37', '否', '', '空运'
WHERE NOT EXISTS (SELECT 1 FROM route_configs WHERE flight_no = 'MU575' AND origin = 'PVG' AND dest = 'HND');

INSERT INTO route_configs (flight_no, origin, transfer, dest, depart_time, arrive_time, is_next_day, second_flight, route_type)
SELECT 'NH959', 'PVG', 'NRT', 'KIX', '09:10', '14:30', '否', 'NH991', '空运'
WHERE NOT EXISTS (SELECT 1 FROM route_configs WHERE flight_no = 'NH959' AND origin = 'PVG' AND dest = 'KIX');

INSERT INTO route_configs (flight_no, origin, transfer, dest, depart_time, arrive_time, is_next_day, second_flight, route_type)
SELECT 'JL621', 'PVG', '', 'NRT', '13:20', '17:55', '否', '', '空运'
WHERE NOT EXISTS (SELECT 1 FROM route_configs WHERE flight_no = 'JL621' AND origin = 'PVG' AND dest = 'NRT');

-- =====================================================
-- 第六步：刷新 Schema Cache
-- =====================================================

NOTIFY pgrst, 'reload schema';

-- =====================================================
-- 完成！
-- =====================================================
