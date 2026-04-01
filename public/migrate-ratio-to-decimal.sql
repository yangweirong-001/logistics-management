-- ============================================
-- 迁移脚本：将占比字段从 INTEGER 改为 DECIMAL(5,2)
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 修改占比字段类型为 DECIMAL(5,2)，支持小数点后两位
ALTER TABLE area_configs 
  ALTER COLUMN kanto_ratio TYPE DECIMAL(5,2),
  ALTER COLUMN kansai_ratio TYPE DECIMAL(5,2),
  ALTER COLUMN kanto_normal_ratio TYPE DECIMAL(5,2),
  ALTER COLUMN kanto_special_ratio TYPE DECIMAL(5,2),
  ALTER COLUMN kansai_normal_ratio TYPE DECIMAL(5,2),
  ALTER COLUMN kansai_special_ratio TYPE DECIMAL(5,2);
