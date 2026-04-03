-- 修复 weight 字段的完整 SQL
-- 请在 Supabase SQL Editor 中执行此脚本

-- 1. 删除 weight 列（如果存在）
ALTER TABLE volume_estimates DROP COLUMN IF EXISTS weight;

-- 2. 重新添加 weight 列
ALTER TABLE volume_estimates ADD COLUMN weight NUMERIC(15, 2);

-- 3. 刷新 Schema Cache
NOTIFY pgrst, 'reload schema';

-- 4. 验证列是否添加成功
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'volume_estimates' 
ORDER BY ordinal_position;
