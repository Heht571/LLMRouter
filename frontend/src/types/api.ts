// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// User Types
export interface User {
  user_id: number;
  username: string;
  email: string;
  role: 'seller' | 'buyer';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'seller' | 'buyer';
}

export interface AuthResponse {
  token: string;
}

// API Service Types
export interface ApiService {
  service_id: number;
  seller_user_id: number;
  name: string;
  description: string;
  seller_username?: string;
  is_active?: boolean;
  platform_proxy_url_prefix?: string;
  // 定价相关字段
  pricing_model?: 'per_call' | 'per_token';
  price_per_call?: number;
  price_per_token?: number;
}

// Browse APIs - Extended interface for marketplace display
export interface BrowseApiService {
  service_id: number;
  seller_user_id: number;
  name: string;
  description: string;
  platform_proxy_prefix: string;
  is_active: boolean;
  seller_username: string;
  // API市场扩展字段
  category?: string;
  rating?: number;
  review_count?: number;
  price_per_call?: number;
  // 定价模式字段
  pricing_model?: 'per_call' | 'per_token';
  price_per_token?: number;
  total_calls?: number;
  subscriber_count?: number;
  features?: string[];
  documentation?: string;
}

// API详情响应接口
export interface ApiServiceDetail extends BrowseApiService {
  is_subscribed: boolean;
  subscription_date?: string;
  platform_api_key?: string;
}

export interface CreateApiService {
  name: string;
  description: string;
  original_endpoint_url: string;
  original_api_key: string;
  documentation?: string;
}

// Subscription Types
export interface Subscription {
  platform_api_key: string;
  platform_proxy_url: string;
}

// Usage Types
export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface UsageStats {
  calls_made: number;
  total_tokens: number;
  indicative_cost: number;
  usage_details_by_api: UsageDetail[];
  period: string;
}

export interface UsageDetail {
  api_service_id: number;
  api_service_name: string;
  calls: number;
  total_tokens: number;
  cost: number;
}

// Time Series Types
export interface TimeSeriesPoint {
  date: string;
  calls: number;
  total_tokens: number;
  cost: number;
}

export interface UsageTimeSeries {
  data_points: TimeSeriesPoint[];
  period: string;
}

// Error Types
export interface ErrorResponse {
  code: number;
  message: string;
}

// Common Types
export type UserRole = 'seller' | 'buyer';