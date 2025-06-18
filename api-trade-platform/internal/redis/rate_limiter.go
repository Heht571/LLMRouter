package redis

import (
	"fmt"
	"time"
)

// RateLimiter 限流服务
type RateLimiter struct {
	redisClient *RedisClient
}

// RateLimitConfig 限流配置
type RateLimitConfig struct {
	Limit  int64         // 限制次数
	Window time.Duration // 时间窗口
}

// NewRateLimiter 创建限流服务实例
func NewRateLimiter(redisClient *RedisClient) *RateLimiter {
	return &RateLimiter{
		redisClient: redisClient,
	}
}

// 限流键前缀常量
const (
	RateLimitKeyUser       = "rate_limit:user:%d"        // 用户限流
	RateLimitKeyAPIKey     = "rate_limit:api_key:%s"     // API密钥限流
	RateLimitKeyService    = "rate_limit:service:%d"     // 服务限流
	RateLimitKeyIP         = "rate_limit:ip:%s"          // IP限流
	RateLimitKeyUserAPI    = "rate_limit:user_api:%d:%d" // 用户对特定API的限流
)

// 预定义限流配置
var (
	// 用户登录限流：每分钟最多5次
	LoginRateLimit = RateLimitConfig{
		Limit:  5,
		Window: time.Minute,
	}
	
	// API调用限流：每分钟最多100次
	APICallRateLimit = RateLimitConfig{
		Limit:  100,
		Window: time.Minute,
	}
	
	// 注册限流：每小时最多3次
	RegisterRateLimit = RateLimitConfig{
		Limit:  3,
		Window: time.Hour,
	}
	
	// IP限流：每分钟最多200次请求
	IPRateLimit = RateLimitConfig{
		Limit:  200,
		Window: time.Minute,
	}
)

// CheckUserRateLimit 检查用户限流
func (r *RateLimiter) CheckUserRateLimit(userID int64, config RateLimitConfig) (bool, int64, error) {
	key := fmt.Sprintf(RateLimitKeyUser, userID)
	return r.checkRateLimit(key, config)
}

// CheckAPIKeyRateLimit 检查API密钥限流
func (r *RateLimiter) CheckAPIKeyRateLimit(apiKey string, config RateLimitConfig) (bool, int64, error) {
	key := fmt.Sprintf(RateLimitKeyAPIKey, apiKey)
	return r.checkRateLimit(key, config)
}

// CheckServiceRateLimit 检查服务限流
func (r *RateLimiter) CheckServiceRateLimit(serviceID int64, config RateLimitConfig) (bool, int64, error) {
	key := fmt.Sprintf(RateLimitKeyService, serviceID)
	return r.checkRateLimit(key, config)
}

// CheckIPRateLimit 检查IP限流
func (r *RateLimiter) CheckIPRateLimit(ip string, config RateLimitConfig) (bool, int64, error) {
	key := fmt.Sprintf(RateLimitKeyIP, ip)
	return r.checkRateLimit(key, config)
}

// CheckUserAPIRateLimit 检查用户对特定API的限流
func (r *RateLimiter) CheckUserAPIRateLimit(userID, serviceID int64, config RateLimitConfig) (bool, int64, error) {
	key := fmt.Sprintf(RateLimitKeyUserAPI, userID, serviceID)
	return r.checkRateLimit(key, config)
}

// checkRateLimit 通用限流检查方法
// 返回值：(是否允许, 剩余次数, 错误)
func (r *RateLimiter) checkRateLimit(key string, config RateLimitConfig) (bool, int64, error) {
	// 使用滑动窗口计数器算法
	now := time.Now().Unix()
	windowStart := now - int64(config.Window.Seconds())
	
	// Lua脚本实现原子性的限流检查和计数
	luaScript := `
		local key = KEYS[1]
		local window_start = ARGV[1]
		local now = ARGV[2]
		local limit = tonumber(ARGV[3])
		local window_size = tonumber(ARGV[4])
		
		-- 清理过期的记录
		redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
		
		-- 获取当前窗口内的请求数
		local current_count = redis.call('ZCARD', key)
		
		-- 检查是否超过限制
		if current_count < limit then
			-- 添加当前请求
			redis.call('ZADD', key, now, now)
			-- 设置过期时间
			redis.call('EXPIRE', key, window_size)
			return {1, limit - current_count - 1}
		else
			return {0, 0}
		end
	`
	
	result, err := r.redisClient.client.Eval(
		r.redisClient.ctx,
		luaScript,
		[]string{key},
		windowStart,
		now,
		config.Limit,
		int64(config.Window.Seconds()),
	).Result()
	
	if err != nil {
		return false, 0, fmt.Errorf("rate limit check failed: %w", err)
	}
	
	resultSlice, ok := result.([]interface{})
	if !ok || len(resultSlice) != 2 {
		return false, 0, fmt.Errorf("unexpected rate limit result format")
	}
	
	allowed := resultSlice[0].(int64) == 1
	remaining := resultSlice[1].(int64)
	
	return allowed, remaining, nil
}

// GetRateLimitInfo 获取限流信息
func (r *RateLimiter) GetRateLimitInfo(key string, config RateLimitConfig) (int64, int64, error) {
	now := time.Now().Unix()
	windowStart := now - int64(config.Window.Seconds())
	
	// 清理过期记录
	if err := r.redisClient.client.ZRemRangeByScore(
		r.redisClient.ctx,
		key,
		"0",
		fmt.Sprintf("%d", windowStart),
	).Err(); err != nil {
		return 0, 0, fmt.Errorf("failed to clean expired records: %w", err)
	}
	
	// 获取当前计数
	currentCount, err := r.redisClient.client.ZCard(r.redisClient.ctx, key).Result()
	if err != nil {
		return 0, 0, fmt.Errorf("failed to get current count: %w", err)
	}
	
	remaining := config.Limit - currentCount
	if remaining < 0 {
		remaining = 0
	}
	
	return currentCount, remaining, nil
}

// ResetRateLimit 重置限流计数器
func (r *RateLimiter) ResetRateLimit(key string) error {
	return r.redisClient.Del(key)
}

// ResetUserRateLimit 重置用户限流
func (r *RateLimiter) ResetUserRateLimit(userID int64) error {
	key := fmt.Sprintf(RateLimitKeyUser, userID)
	return r.ResetRateLimit(key)
}

// ResetAPIKeyRateLimit 重置API密钥限流
func (r *RateLimiter) ResetAPIKeyRateLimit(apiKey string) error {
	key := fmt.Sprintf(RateLimitKeyAPIKey, apiKey)
	return r.ResetRateLimit(key)
}

// ResetServiceRateLimit 重置服务限流
func (r *RateLimiter) ResetServiceRateLimit(serviceID int64) error {
	key := fmt.Sprintf(RateLimitKeyService, serviceID)
	return r.ResetRateLimit(key)
}

// ResetIPRateLimit 重置IP限流
func (r *RateLimiter) ResetIPRateLimit(ip string) error {
	key := fmt.Sprintf(RateLimitKeyIP, ip)
	return r.ResetRateLimit(key)
}

// GetUserRateLimitInfo 获取用户限流信息
func (r *RateLimiter) GetUserRateLimitInfo(userID int64, config RateLimitConfig) (int64, int64, error) {
	key := fmt.Sprintf(RateLimitKeyUser, userID)
	return r.GetRateLimitInfo(key, config)
}

// GetAPIKeyRateLimitInfo 获取API密钥限流信息
func (r *RateLimiter) GetAPIKeyRateLimitInfo(apiKey string, config RateLimitConfig) (int64, int64, error) {
	key := fmt.Sprintf(RateLimitKeyAPIKey, apiKey)
	return r.GetRateLimitInfo(key, config)
}

// GetServiceRateLimitInfo 获取服务限流信息
func (r *RateLimiter) GetServiceRateLimitInfo(serviceID int64, config RateLimitConfig) (int64, int64, error) {
	key := fmt.Sprintf(RateLimitKeyService, serviceID)
	return r.GetRateLimitInfo(key, config)
}

// GetIPRateLimitInfo 获取IP限流信息
func (r *RateLimiter) GetIPRateLimitInfo(ip string, config RateLimitConfig) (int64, int64, error) {
	key := fmt.Sprintf(RateLimitKeyIP, ip)
	return r.GetRateLimitInfo(key, config)
}

// BatchCheckRateLimit 批量检查限流
func (r *RateLimiter) BatchCheckRateLimit(checks []struct {
	Key    string
	Config RateLimitConfig
}) ([]bool, []int64, error) {
	allowed := make([]bool, len(checks))
	remaining := make([]int64, len(checks))
	
	for i, check := range checks {
		a, rem, err := r.checkRateLimit(check.Key, check.Config)
		if err != nil {
			return nil, nil, err
		}
		allowed[i] = a
		remaining[i] = rem
	}
	
	return allowed, remaining, nil
}