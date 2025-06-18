-- Migration: Add token usage fields to usage_logs table
-- Date: 2024-01-01
-- Description: Add fields to track token usage, costs, and request/response sizes

BEGIN;

-- Add new columns to usage_logs table
ALTER TABLE usage_logs 
ADD COLUMN IF NOT EXISTS input_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS output_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS token_cost DECIMAL(10,6) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS model_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS request_size_bytes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_size_bytes INTEGER DEFAULT 0;

-- Add comments for the new columns
COMMENT ON COLUMN usage_logs.input_tokens IS '输入token数量';
COMMENT ON COLUMN usage_logs.output_tokens IS '输出token数量';
COMMENT ON COLUMN usage_logs.total_tokens IS '总token数量';
COMMENT ON COLUMN usage_logs.token_cost IS 'token使用费用（美元）';
COMMENT ON COLUMN usage_logs.model_name IS '使用的AI模型名称';
COMMENT ON COLUMN usage_logs.request_size_bytes IS '请求体大小（字节）';
COMMENT ON COLUMN usage_logs.response_size_bytes IS '响应体大小（字节）';

-- Create index on token_cost for cost analysis queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_token_cost ON usage_logs(token_cost);

-- Create index on model_name for model usage analysis
CREATE INDEX IF NOT EXISTS idx_usage_logs_model_name ON usage_logs(model_name);

-- Create composite index for buyer token usage queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_buyer_tokens ON usage_logs(buyer_user_id, request_timestamp, total_tokens);

COMMIT;