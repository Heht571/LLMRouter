-- Migration: Add API pricing fields to api_services table
-- Date: 2025-01-11
-- Description: Add pricing_model, price_per_call, and price_per_token fields to support custom API pricing

-- Add pricing fields to api_services table
ALTER TABLE api_services 
ADD COLUMN IF NOT EXISTS pricing_model VARCHAR(20) DEFAULT 'per_call' CHECK (pricing_model IN ('per_call', 'per_token')),
ADD COLUMN IF NOT EXISTS price_per_token DECIMAL(10,6) DEFAULT 0.0;

-- Update existing records to have default pricing model
UPDATE api_services 
SET pricing_model = 'per_call' 
WHERE pricing_model IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN api_services.pricing_model IS 'Pricing model: per_call or per_token';
COMMENT ON COLUMN api_services.price_per_token IS 'Price per token when using per_token pricing model';