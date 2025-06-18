-- Users Table: Stores information about sellers and buyers
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('seller', 'buyer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Services Table: Stores information about APIs registered by sellers
CREATE TABLE IF NOT EXISTS api_services (
    service_id SERIAL PRIMARY KEY,
    seller_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    original_endpoint_url VARCHAR(2048) NOT NULL, -- Base URL of the seller's original API
    encrypted_original_api_key TEXT NOT NULL, -- Seller's original API key, encrypted
    platform_proxy_prefix VARCHAR(255) UNIQUE NOT NULL, -- e.g., /proxy/v1/{service_id}
    is_active BOOLEAN DEFAULT TRUE,
    -- API市场扩展字段
    category VARCHAR(100),
    rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    price_per_call DECIMAL(10,6) DEFAULT 0.01,
    -- 定价字段
    pricing_model VARCHAR(20) DEFAULT 'per_call' CHECK (pricing_model IN ('per_call', 'per_token')),
    price_per_token DECIMAL(10,6) DEFAULT 0.01,
    total_calls BIGINT DEFAULT 0,
    subscriber_count INTEGER DEFAULT 0,
    features TEXT, -- JSON数组字符串
    documentation TEXT, -- Markdown格式的API文档
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Platform API Keys Table: Stores platform-generated API keys for buyers to access services
CREATE TABLE IF NOT EXISTS platform_api_keys (
    key_id SERIAL PRIMARY KEY,
    buyer_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES api_services(service_id) ON DELETE CASCADE,
    platform_api_key VARCHAR(255) UNIQUE NOT NULL, -- The key buyer uses to access via platform
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional: for keys with an expiration date
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_buyer_service_subscription UNIQUE (buyer_user_id, service_id) -- Ensures one active key per buyer per service
);

-- Usage Logs Table: Records each API call made through the platform
CREATE TABLE IF NOT EXISTS usage_logs (
    log_id BIGSERIAL PRIMARY KEY,
    platform_api_key_id INTEGER NOT NULL REFERENCES platform_api_keys(key_id),
    buyer_user_id INTEGER NOT NULL REFERENCES users(user_id), -- Denormalized for easier querying on buyer usage
    api_service_id INTEGER NOT NULL REFERENCES api_services(service_id), -- Denormalized for easier querying on service usage
    seller_user_id INTEGER NOT NULL REFERENCES users(user_id), -- Denormalized for easier querying on seller's API usage
    request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    response_status_code INTEGER, -- HTTP status code from the original seller's API
    is_success BOOLEAN NOT NULL, -- True if the call was successful (e.g., 2xx status)
    request_path VARCHAR(2048) NOT NULL, -- Path requested by the buyer (e.g., /some/resource)
    request_method VARCHAR(10) NOT NULL, -- HTTP method (GET, POST, etc.)
    processing_time_ms INTEGER, -- Time taken by the platform to proxy the request (in milliseconds)
    -- Token usage tracking fields
    input_tokens INTEGER DEFAULT 0, -- Number of input tokens used in the request
    output_tokens INTEGER DEFAULT 0, -- Number of output tokens generated in the response
    total_tokens INTEGER DEFAULT 0, -- Total tokens used (input + output)
    cost REAL NOT NULL DEFAULT 0,
    model_name VARCHAR(100), -- AI model used (e.g., gpt-4, claude-3, etc.)
    request_size_bytes INTEGER DEFAULT 0, -- Size of request payload in bytes
    response_size_bytes INTEGER DEFAULT 0 -- Size of response payload in bytes
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_api_services_seller_user_id ON api_services(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_api_services_platform_proxy_prefix ON api_services(platform_proxy_prefix);

CREATE INDEX IF NOT EXISTS idx_platform_api_keys_platform_api_key ON platform_api_keys(platform_api_key);
CREATE INDEX IF NOT EXISTS idx_platform_api_keys_buyer_user_id ON platform_api_keys(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_platform_api_keys_service_id ON platform_api_keys(service_id);

CREATE INDEX IF NOT EXISTS idx_usage_logs_platform_api_key_id ON usage_logs(platform_api_key_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_buyer_user_id ON usage_logs(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_api_service_id ON usage_logs(api_service_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_request_timestamp ON usage_logs(request_timestamp);

-- Function to automatically update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for 'users' table
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Triggers for 'api_services' table
CREATE TRIGGER set_api_services_updated_at
BEFORE UPDATE ON api_services
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Triggers for 'platform_api_keys' table
CREATE TRIGGER set_platform_api_keys_updated_at
BEFORE UPDATE ON platform_api_keys
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

COMMENT ON COLUMN api_services.original_endpoint_url IS 'Base URL of the seller''s original API, e.g., https://api.seller.com/v2';
COMMENT ON COLUMN api_services.encrypted_original_api_key IS 'Seller''s original API key, encrypted at rest in the database';
COMMENT ON COLUMN api_services.platform_proxy_prefix IS 'The unique path prefix on the platform that maps to this service, e.g., /proxy/v1/service123. The full proxy URL would be [platform_domain]/proxy/v1/service123/{actual_seller_path}';
COMMENT ON COLUMN platform_api_keys.platform_api_key IS 'The API key generated by this platform, which the buyer will use in X-Platform-API-Key header';
-- API Documentation Table: Stores documentation for each API service
CREATE TABLE IF NOT EXISTS api_documentation (
    doc_id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES api_services(service_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL, -- Markdown content for the documentation
    version VARCHAR(50) DEFAULT '1.0.0',
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_service_version UNIQUE (service_id, version)
);

-- API Endpoints Table: Stores individual endpoint documentation
CREATE TABLE IF NOT EXISTS api_endpoints (
    endpoint_id SERIAL PRIMARY KEY,
    doc_id INTEGER NOT NULL REFERENCES api_documentation(doc_id) ON DELETE CASCADE,
    method VARCHAR(10) NOT NULL, -- GET, POST, PUT, DELETE, etc.
    path VARCHAR(500) NOT NULL, -- e.g., /users/{id}
    summary VARCHAR(255),
    description TEXT,
    request_body_schema JSONB, -- JSON schema for request body
    response_schema JSONB, -- JSON schema for response
    parameters JSONB, -- Array of parameter objects
    examples JSONB, -- Request/response examples
    tags VARCHAR(255)[], -- Array of tags for grouping
    is_deprecated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for API documentation
CREATE INDEX IF NOT EXISTS idx_api_documentation_service_id ON api_documentation(service_id);
CREATE INDEX IF NOT EXISTS idx_api_documentation_is_published ON api_documentation(is_published);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_doc_id ON api_endpoints(doc_id);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_method_path ON api_endpoints(method, path);

-- Triggers for API documentation tables
CREATE TRIGGER set_api_documentation_updated_at
BEFORE UPDATE ON api_documentation
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_api_endpoints_updated_at
BEFORE UPDATE ON api_endpoints
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

COMMENT ON TABLE api_documentation IS 'Stores API documentation for each service, supporting versioning and publishing status';
COMMENT ON TABLE api_endpoints IS 'Stores detailed endpoint documentation including schemas, examples, and parameters';
COMMENT ON COLUMN api_documentation.content IS 'Markdown content for general API documentation';
COMMENT ON COLUMN api_endpoints.request_body_schema IS 'JSON schema defining the structure of request body';
COMMENT ON COLUMN api_endpoints.response_schema IS 'JSON schema defining the structure of response';
COMMENT ON COLUMN api_endpoints.parameters IS 'Array of parameter objects with name, type, description, required, etc.';
COMMENT ON COLUMN api_endpoints.examples IS 'Request and response examples in JSON format';

COMMENT ON CONSTRAINT unique_buyer_service_subscription ON platform_api_keys IS 'Ensures that a buyer can only have one active platform API key (subscription) for a specific API service at any given time.';
COMMENT ON COLUMN usage_logs.processing_time_ms IS 'Time in milliseconds it took for the platform to process and proxy the request, excluding network latency to/from the original seller API.';