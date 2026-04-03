-- 物流管理系统数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 创建区域参数配置表
CREATE TABLE IF NOT EXISTS area_configs (
  id SERIAL PRIMARY KEY,
  warehouse VARCHAR(50) NOT NULL,
  package_volume NUMERIC(20, 12) NOT NULL,
  kanto_ratio NUMERIC(5, 2) NOT NULL,
  kansai_ratio NUMERIC(5, 2) NOT NULL,
  kanto_normal_ratio NUMERIC(5, 2) NOT NULL,
  kanto_special_ratio NUMERIC(5, 2) NOT NULL,
  kansai_normal_ratio NUMERIC(5, 2) NOT NULL,
  kansai_special_ratio NUMERIC(5, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS area_configs_warehouse_idx ON area_configs(warehouse);

-- 2. 创建航班配置表
CREATE TABLE IF NOT EXISTS flight_configs (
  id SERIAL PRIMARY KEY,
  warehouse VARCHAR(50) NOT NULL,
  weekday VARCHAR(10) NOT NULL,
  kanto_normal VARCHAR(20),
  kansai_normal VARCHAR(20),
  kanto_special VARCHAR(20),
  kansai_special VARCHAR(20),
  remark VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS flight_configs_warehouse_idx ON flight_configs(warehouse);
CREATE INDEX IF NOT EXISTS flight_configs_weekday_idx ON flight_configs(weekday);

-- 3. 创建目的港配置表
CREATE TABLE IF NOT EXISTS port_configs (
  id SERIAL PRIMARY KEY,
  port_code VARCHAR(10) NOT NULL,
  region VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS port_configs_region_idx ON port_configs(region);

-- 4. 创建航空路由配置表
CREATE TABLE IF NOT EXISTS route_configs (
  id SERIAL PRIMARY KEY,
  flight_no VARCHAR(20) NOT NULL,
  origin VARCHAR(10) NOT NULL,
  transfer VARCHAR(10),
  dest VARCHAR(10) NOT NULL,
  depart_time VARCHAR(10),
  arrive_time VARCHAR(10),
  is_next_day VARCHAR(5),
  second_flight VARCHAR(20),
  route_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS route_configs_flight_no_idx ON route_configs(flight_no);
CREATE INDEX IF NOT EXISTS route_configs_route_type_idx ON route_configs(route_type);

-- 5. 创建方数预估表
CREATE TABLE IF NOT EXISTS volume_estimates (
  id SERIAL PRIMARY KEY,
  collect_date VARCHAR(20) NOT NULL,
  weekday VARCHAR(10),
  warehouse VARCHAR(50) NOT NULL,
  package_count INTEGER NOT NULL,
  total_volume NUMERIC(15, 3),
  kanto_total NUMERIC(15, 3),
  kansai_total NUMERIC(15, 3),
  kanto_normal NUMERIC(15, 3),
  kanto_special NUMERIC(15, 3),
  kansai_normal NUMERIC(15, 3),
  kansai_special NUMERIC(15, 3),
  air_volume NUMERIC(15, 3),
  sea_air_volume NUMERIC(15, 3),
  is_complete VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS volume_estimates_collect_date_idx ON volume_estimates(collect_date);
CREATE INDEX IF NOT EXISTS volume_estimates_warehouse_idx ON volume_estimates(warehouse);

-- 6. 创建主单发放表
CREATE TABLE IF NOT EXISTS main_orders (
  id SERIAL PRIMARY KEY,
  collect_date VARCHAR(20) NOT NULL,
  collect_weekday VARCHAR(10),
  depart_date VARCHAR(20),
  depart_weekday VARCHAR(10),
  warehouse VARCHAR(50) NOT NULL,
  cargo_type VARCHAR(20) NOT NULL,
  port VARCHAR(20) NOT NULL,
  category VARCHAR(50),
  status VARCHAR(20),
  pack_req VARCHAR(20),
  max_volume NUMERIC(15, 3),
  max_pieces INTEGER,
  est_volume NUMERIC(15, 3),
  est_pieces INTEGER,
  req_flight_date VARCHAR(20),
  actual_flight_date VARCHAR(20),
  main_no VARCHAR(50),
  flight_no VARCHAR(20),
  origin VARCHAR(10),
  transfer VARCHAR(10),
  dest VARCHAR(10),
  depart_time VARCHAR(20),
  arrive_time VARCHAR(20),
  actual_pieces INTEGER,
  actual_weight NUMERIC(15, 3),
  actual_volume NUMERIC(15, 3),
  actual_bills INTEGER,
  remark VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS main_orders_cargo_type_idx ON main_orders(cargo_type);
CREATE INDEX IF NOT EXISTS main_orders_collect_date_idx ON main_orders(collect_date);
CREATE INDEX IF NOT EXISTS main_orders_port_idx ON main_orders(port);
CREATE INDEX IF NOT EXISTS main_orders_warehouse_idx ON main_orders(warehouse);

-- 7. 创建健康检查表
CREATE TABLE IF NOT EXISTS health_check (
  id SERIAL PRIMARY KEY,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 配置 Row Level Security (RLS)
ALTER TABLE area_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE port_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE volume_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_orders ENABLE ROW LEVEL SECURITY;

-- 9. 创建 RLS 策略（允许公开读写）
-- area_configs
CREATE POLICY "允许公开读取 area_configs" ON area_configs FOR SELECT USING (true);
CREATE POLICY "允许公开写入 area_configs" ON area_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "允许公开更新 area_configs" ON area_configs FOR UPDATE USING (true);
CREATE POLICY "允许公开删除 area_configs" ON area_configs FOR DELETE USING (true);

-- flight_configs
CREATE POLICY "允许公开读取 flight_configs" ON flight_configs FOR SELECT USING (true);
CREATE POLICY "允许公开写入 flight_configs" ON flight_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "允许公开更新 flight_configs" ON flight_configs FOR UPDATE USING (true);
CREATE POLICY "允许公开删除 flight_configs" ON flight_configs FOR DELETE USING (true);

-- port_configs
CREATE POLICY "允许公开读取 port_configs" ON port_configs FOR SELECT USING (true);
CREATE POLICY "允许公开写入 port_configs" ON port_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "允许公开更新 port_configs" ON port_configs FOR UPDATE USING (true);
CREATE POLICY "允许公开删除 port_configs" ON port_configs FOR DELETE USING (true);

-- route_configs
CREATE POLICY "允许公开读取 route_configs" ON route_configs FOR SELECT USING (true);
CREATE POLICY "允许公开写入 route_configs" ON route_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "允许公开更新 route_configs" ON route_configs FOR UPDATE USING (true);
CREATE POLICY "允许公开删除 route_configs" ON route_configs FOR DELETE USING (true);

-- volume_estimates
CREATE POLICY "允许公开读取 volume_estimates" ON volume_estimates FOR SELECT USING (true);
CREATE POLICY "允许公开写入 volume_estimates" ON volume_estimates FOR INSERT WITH CHECK (true);
CREATE POLICY "允许公开更新 volume_estimates" ON volume_estimates FOR UPDATE USING (true);
CREATE POLICY "允许公开删除 volume_estimates" ON volume_estimates FOR DELETE USING (true);

-- main_orders
CREATE POLICY "允许公开读取 main_orders" ON main_orders FOR SELECT USING (true);
CREATE POLICY "允许公开写入 main_orders" ON main_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "允许公开更新 main_orders" ON main_orders FOR UPDATE USING (true);
CREATE POLICY "允许公开删除 main_orders" ON main_orders FOR DELETE USING (true);

-- 10. 插入示例数据（航空路由配置）
INSERT INTO route_configs (flight_no, origin, transfer, dest, depart_time, arrive_time, is_next_day, second_flight, route_type)
VALUES
('MU575', 'PVG', '-', 'HND', '17:25', '20:37', '否', '', '空运'),
('NH959', 'PVG', 'NRT', 'KIX', '09:10', '14:30', '否', 'NH991', '空运'),
('JL621', 'PVG', '', 'NRT', '13:20', '17:55', '否', '', '空运')
ON CONFLICT DO NOTHING;

-- 11. 插入示例数据（区域参数配置）
INSERT INTO area_configs (warehouse, package_volume, kanto_ratio, kansai_ratio, kanto_normal_ratio, kanto_special_ratio, kansai_normal_ratio, kansai_special_ratio)
VALUES
('东莞', 0.05, 0.6, 0.4, 0.7, 0.3, 0.8, 0.2),
('加工区', 0.04, 0.5, 0.5, 0.6, 0.4, 0.7, 0.3)
ON CONFLICT DO NOTHING;

-- 12. 插入示例数据（目的港配置）
INSERT INTO port_configs (port_code, region)
VALUES
('HND', '关东'),
('NRT', '关东'),
('KIX', '关西'),
('OSA', '关西'),
('TYO', '关东')
ON CONFLICT DO NOTHING;

-- 13. 插入示例数据（航班配置）
INSERT INTO flight_configs (warehouse, weekday, kanto_normal, kansai_normal, kanto_special, kansai_special, remark)
VALUES
('东莞', '周一', '空运', '空运', '空运', '空运', '常规航班'),
('东莞', '周二', '空运', '空运', '空运', '空运', '常规航班'),
('东莞', '周三', '空运', '空运', '空运', '空运', '常规航班'),
('东莞', '周四', '空运', '空运', '空运', '空运', '常规航班'),
('东莞', '周五', '空运', '空运', '空运', '空运', '常规航班'),
('东莞', '周六', '空运', '空运', '空运', '空运', '常规航班'),
('东莞', '周日', '空运', '空运', '空运', '空运', '常规航班'),
('加工区', '周一', '空运', '空运', '空运', '空运', '常规航班'),
('加工区', '周二', '空运', '空运', '空运', '空运', '常规航班'),
('加工区', '周三', '空运', '空运', '空运', '空运', '常规航班'),
('加工区', '周四', '空运', '空运', '空运', '空运', '常规航班'),
('加工区', '周五', '空运', '空运', '空运', '空运', '常规航班'),
('加工区', '周六', '空运', '空运', '空运', '空运', '常规航班'),
('加工区', '周日', '空运', '空运', '空运', '空运', '常规航班')
ON CONFLICT DO NOTHING;
