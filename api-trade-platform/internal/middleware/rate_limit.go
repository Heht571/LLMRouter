package middleware

import (
	"api-trade-platform/internal/redis"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// RateLimitMiddleware 限流中间件
func RateLimitMiddleware(rateLimiter *redis.RateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 如果限流器不可用，直接通过
		if rateLimiter == nil {
			c.Next()
			return
		}

		// 获取客户端IP
		clientIP := c.ClientIP()
		
		// 检查IP限流
		allowed, remaining, err := rateLimiter.CheckIPRateLimit(clientIP, redis.IPRateLimit)
		if err != nil {
			// 限流检查失败，记录错误但允许请求通过（降级处理）
			c.Header("X-RateLimit-Error", "Rate limit check failed")
			c.Next()
			return
		}

		// 设置限流相关的响应头
		c.Header("X-RateLimit-Limit", strconv.FormatInt(redis.IPRateLimit.Limit, 10))
		c.Header("X-RateLimit-Remaining", strconv.FormatInt(remaining, 10))
		c.Header("X-RateLimit-Window", redis.IPRateLimit.Window.String())

		if !allowed {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "Rate limit exceeded",
				"message": "Too many requests from this IP address",
				"retry_after": redis.IPRateLimit.Window.Seconds(),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// UserRateLimitMiddleware 用户限流中间件
func UserRateLimitMiddleware(rateLimiter *redis.RateLimiter, config redis.RateLimitConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 如果限流器不可用，直接通过
		if rateLimiter == nil {
			c.Next()
			return
		}

		// 获取用户ID（从JWT中间件设置的用户信息）
		userIDInterface, exists := c.Get("user_id")
		if !exists {
			// 没有用户信息，跳过用户限流
			c.Next()
			return
		}

		userID, ok := userIDInterface.(int64)
		if !ok {
			// 用户ID格式错误，跳过限流
			c.Next()
			return
		}

		// 检查用户限流
		allowed, remaining, err := rateLimiter.CheckUserRateLimit(userID, config)
		if err != nil {
			// 限流检查失败，记录错误但允许请求通过（降级处理）
			c.Header("X-User-RateLimit-Error", "User rate limit check failed")
			c.Next()
			return
		}

		// 设置用户限流相关的响应头
		c.Header("X-User-RateLimit-Limit", strconv.FormatInt(config.Limit, 10))
		c.Header("X-User-RateLimit-Remaining", strconv.FormatInt(remaining, 10))
		c.Header("X-User-RateLimit-Window", config.Window.String())

		if !allowed {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "User rate limit exceeded",
				"message": "Too many requests from this user",
				"retry_after": config.Window.Seconds(),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// APIKeyRateLimitMiddleware API密钥限流中间件
func APIKeyRateLimitMiddleware(rateLimiter *redis.RateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 如果限流器不可用，直接通过
		if rateLimiter == nil {
			c.Next()
			return
		}

		// 获取API密钥（从平台认证中间件设置）
		apiKeyInterface, exists := c.Get("api_key")
		if !exists {
			// 没有API密钥信息，跳过API密钥限流
			c.Next()
			return
		}

		apiKey, ok := apiKeyInterface.(string)
		if !ok {
			// API密钥格式错误，跳过限流
			c.Next()
			return
		}

		// 检查API密钥限流
		allowed, remaining, err := rateLimiter.CheckAPIKeyRateLimit(apiKey, redis.APICallRateLimit)
		if err != nil {
			// 限流检查失败，记录错误但允许请求通过（降级处理）
			c.Header("X-APIKey-RateLimit-Error", "API key rate limit check failed")
			c.Next()
			return
		}

		// 设置API密钥限流相关的响应头
		c.Header("X-APIKey-RateLimit-Limit", strconv.FormatInt(redis.APICallRateLimit.Limit, 10))
		c.Header("X-APIKey-RateLimit-Remaining", strconv.FormatInt(remaining, 10))
		c.Header("X-APIKey-RateLimit-Window", redis.APICallRateLimit.Window.String())

		if !allowed {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "API key rate limit exceeded",
				"message": "Too many requests with this API key",
				"retry_after": redis.APICallRateLimit.Window.Seconds(),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}