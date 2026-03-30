import { pgTable, serial, timestamp, varchar, integer, numeric, boolean, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 系统健康检查表（必须保留）
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 区域参数配置表
export const areaConfigs = pgTable(
  "area_configs",
  {
    id: serial().primaryKey(),
    warehouse: varchar("warehouse", { length: 50 }).notNull(),
    package_volume: numeric("package_volume", { precision: 10, scale: 2 }).notNull(),
    kanto_ratio: numeric("kanto_ratio", { precision: 5, scale: 2 }).notNull(),
    kansai_ratio: numeric("kansai_ratio", { precision: 5, scale: 2 }).notNull(),
    kanto_normal_ratio: numeric("kanto_normal_ratio", { precision: 5, scale: 2 }).notNull(),
    kanto_special_ratio: numeric("kanto_special_ratio", { precision: 5, scale: 2 }).notNull(),
    kansai_normal_ratio: numeric("kansai_normal_ratio", { precision: 5, scale: 2 }).notNull(),
    kansai_special_ratio: numeric("kansai_special_ratio", { precision: 5, scale: 2 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("area_configs_warehouse_idx").on(table.warehouse),
  ]
);

// 航班配置表
export const flightConfigs = pgTable(
  "flight_configs",
  {
    id: serial().primaryKey(),
    warehouse: varchar("warehouse", { length: 50 }).notNull(),
    weekday: varchar("weekday", { length: 10 }).notNull(),
    kanto_normal: varchar("kanto_normal", { length: 20 }),
    kansai_normal: varchar("kansai_normal", { length: 20 }),
    kanto_special: varchar("kanto_special", { length: 20 }),
    kansai_special: varchar("kansai_special", { length: 20 }),
    remark: varchar("remark", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("flight_configs_warehouse_idx").on(table.warehouse),
    index("flight_configs_weekday_idx").on(table.weekday),
  ]
);

// 目的港配置表
export const portConfigs = pgTable(
  "port_configs",
  {
    id: serial().primaryKey(),
    port_code: varchar("port_code", { length: 10 }).notNull(),
    region: varchar("region", { length: 20 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("port_configs_region_idx").on(table.region),
  ]
);

// 航空路由配置表
export const routeConfigs = pgTable(
  "route_configs",
  {
    id: serial().primaryKey(),
    flight_no: varchar("flight_no", { length: 20 }).notNull(),
    origin: varchar("origin", { length: 10 }).notNull(),
    transfer: varchar("transfer", { length: 10 }),
    dest: varchar("dest", { length: 10 }).notNull(),
    depart_time: varchar("depart_time", { length: 10 }),
    arrive_time: varchar("arrive_time", { length: 10 }),
    is_next_day: varchar("is_next_day", { length: 5 }),
    second_flight: varchar("second_flight", { length: 20 }),
    route_type: varchar("route_type", { length: 20 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("route_configs_flight_no_idx").on(table.flight_no),
    index("route_configs_route_type_idx").on(table.route_type),
  ]
);

// 方数预估表
export const volumeEstimates = pgTable(
  "volume_estimates",
  {
    id: serial().primaryKey(),
    collect_date: varchar("collect_date", { length: 20 }).notNull(),
    weekday: varchar("weekday", { length: 10 }),
    warehouse: varchar("warehouse", { length: 50 }).notNull(),
    package_count: integer("package_count").notNull(),
    total_volume: numeric("total_volume", { precision: 10, scale: 2 }),
    kanto_total: numeric("kanto_total", { precision: 10, scale: 2 }),
    kansai_total: numeric("kansai_total", { precision: 10, scale: 2 }),
    kanto_normal: numeric("kanto_normal", { precision: 10, scale: 2 }),
    kanto_special: numeric("kanto_special", { precision: 10, scale: 2 }),
    kansai_normal: numeric("kansai_normal", { precision: 10, scale: 2 }),
    kansai_special: numeric("kansai_special", { precision: 10, scale: 2 }),
    air_volume: numeric("air_volume", { precision: 10, scale: 2 }),
    sea_air_volume: numeric("sea_air_volume", { precision: 10, scale: 2 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("volume_estimates_collect_date_idx").on(table.collect_date),
    index("volume_estimates_warehouse_idx").on(table.warehouse),
  ]
);

// 主单发放表
export const mainOrders = pgTable(
  "main_orders",
  {
    id: serial().primaryKey(),
    collect_date: varchar("collect_date", { length: 20 }).notNull(),
    collect_weekday: varchar("collect_weekday", { length: 10 }),
    depart_date: varchar("depart_date", { length: 20 }),
    depart_weekday: varchar("depart_weekday", { length: 10 }),
    warehouse: varchar("warehouse", { length: 50 }).notNull(),
    cargo_type: varchar("cargo_type", { length: 20 }).notNull(),
    port: varchar("port", { length: 20 }).notNull(),
    category: varchar("category", { length: 50 }),
    status: varchar("status", { length: 20 }),
    pack_req: varchar("pack_req", { length: 20 }),
    max_volume: numeric("max_volume", { precision: 10, scale: 2 }),
    max_pieces: integer("max_pieces"),
    est_volume: numeric("est_volume", { precision: 10, scale: 2 }),
    est_pieces: integer("est_pieces"),
    req_flight_date: varchar("req_flight_date", { length: 20 }),
    actual_flight_date: varchar("actual_flight_date", { length: 20 }),
    main_no: varchar("main_no", { length: 50 }),
    flight_no: varchar("flight_no", { length: 20 }),
    origin: varchar("origin", { length: 10 }),
    transfer: varchar("transfer", { length: 10 }),
    dest: varchar("dest", { length: 10 }),
    depart_time: varchar("depart_time", { length: 10 }),
    arrive_time: varchar("arrive_time", { length: 10 }),
    actual_pieces: integer("actual_pieces"),
    actual_weight: numeric("actual_weight", { precision: 10, scale: 2 }),
    actual_volume: numeric("actual_volume", { precision: 10, scale: 2 }),
    actual_bills: integer("actual_bills"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("main_orders_collect_date_idx").on(table.collect_date),
    index("main_orders_warehouse_idx").on(table.warehouse),
    index("main_orders_port_idx").on(table.port),
    index("main_orders_cargo_type_idx").on(table.cargo_type),
  ]
);

// 类型导出
export type AreaConfig = typeof areaConfigs.$inferSelect;
export type FlightConfig = typeof flightConfigs.$inferSelect;
export type PortConfig = typeof portConfigs.$inferSelect;
export type RouteConfig = typeof routeConfigs.$inferSelect;
export type VolumeEstimate = typeof volumeEstimates.$inferSelect;
export type MainOrder = typeof mainOrders.$inferSelect;
