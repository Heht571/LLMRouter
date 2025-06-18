package middleware

import (
	"api-trade-platform/internal/model"
	"api-trade-platform/internal/store/postgres"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// PlatformAPIKeyAuthMiddleware 平台API密钥认证中间件
func PlatformAPIKeyAuthMiddleware(platformKeyStore *postgres.PlatformKeyStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从X-API-Key头获取平台API密钥
		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "X-API-Key header is required",
			})
			c.Abort()
			return
		}

		// 验证平台API密钥并获取相关信息
		platformKey, apiService, err := platformKeyStore.GetPlatformAPIKeyWithServiceInfo(apiKey)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or inactive API key",
			})
			c.Abort()
			return
		}

		// 检查密钥是否过期
		if platformKey.ExpiresAt != nil && platformKey.ExpiresAt.Before(time.Now()) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "API key has expired",
			})
			c.Abort()
			return
		}

		// 将平台密钥和API服务信息存储到上下文中
		c.Set("platform_key", platformKey)
		c.Set("api_service", apiService)
		c.Set("buyer_user_id", platformKey.BuyerUserID)
		c.Set("service_id", platformKey.ServiceID)

		c.Next()
	}
}

// GetPlatformKeyFromContext 从上下文获取平台API密钥
func GetPlatformKeyFromContext(c *gin.Context) (*model.PlatformAPIKey, bool) {
	key, exists := c.Get("platform_key")
	if !exists {
		return nil, false
	}
	if platformKey, ok := key.(*model.PlatformAPIKey); ok {
		return platformKey, true
	}
	return nil, false
}

// GetAPIServiceFromContext 从上下文获取API服务信息
func GetAPIServiceFromContext(c *gin.Context) (*model.APIService, bool) {
	service, exists := c.Get("api_service")
	if !exists {
		return nil, false
	}
	if apiService, ok := service.(*model.APIService); ok {
		return apiService, true
	}
	return nil, false
}

// GetBuyerUserIDFromContext 从上下文获取买家用户ID
func GetBuyerUserIDFromContext(c *gin.Context) (int64, bool) {
	buyerID, exists := c.Get("buyer_user_id")
	if !exists {
		return 0, false
	}
	if id, ok := buyerID.(int64); ok {
		return id, true
	}
	return 0, false
}

// GetServiceIDFromContext 从上下文获取服务ID
func GetServiceIDFromContext(c *gin.Context) (int64, bool) {
	serviceID, exists := c.Get("service_id")
	if !exists {
		return 0, false
	}
	if id, ok := serviceID.(int64); ok {
		return id, true
	}
	return 0, false
}