package redis

import (
	"encoding/json"
	"fmt"
	"time"

	"api-trade-platform/internal/model"
)

// CacheService 缓存服务
type CacheService struct {
	redisClient *RedisClient
}

// NewCacheService 创建缓存服务实例
func NewCacheService(redisClient *RedisClient) *CacheService {
	return &CacheService{
		redisClient: redisClient,
	}
}

// 缓存键前缀常量
const (
	CacheKeyUserProfile    = "user_profile:%d"
	CacheKeyUserSettings   = "user_settings:%d"
	CacheKeyUserSecurity   = "user_security:%d"
	CacheKeyAPIService     = "api_service:%d"
	CacheKeyAPIServices    = "api_services:seller:%d"
	CacheKeyAllAPIServices = "api_services:all"
	CacheKeySubscriptions  = "subscriptions:%d"
	CacheKeyUsageStats     = "usage_stats:%d:%s"
	CacheKeyAPIDoc         = "api_doc:%d"
)

// 缓存过期时间常量
const (
	CacheExpirationShort  = 5 * time.Minute   // 短期缓存：5分钟
	CacheExpirationMedium = 30 * time.Minute  // 中期缓存：30分钟
	CacheExpirationLong   = 2 * time.Hour     // 长期缓存：2小时
)

// SetUserProfile 缓存用户资料
func (c *CacheService) SetUserProfile(userID int64, profile *model.UserProfile) error {
	key := fmt.Sprintf(CacheKeyUserProfile, userID)
	return c.setJSONCache(key, profile, CacheExpirationMedium)
}

// GetUserProfile 获取缓存的用户资料
func (c *CacheService) GetUserProfile(userID int64) (*model.UserProfile, error) {
	key := fmt.Sprintf(CacheKeyUserProfile, userID)
	var profile model.UserProfile
	err := c.getJSONCache(key, &profile)
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

// DeleteUserProfile 删除用户资料缓存
func (c *CacheService) DeleteUserProfile(userID int64) error {
	key := fmt.Sprintf(CacheKeyUserProfile, userID)
	return c.redisClient.Del(key)
}

// SetUserSettings 缓存用户设置
func (c *CacheService) SetUserSettings(userID int64, settings *model.UserSettings) error {
	key := fmt.Sprintf(CacheKeyUserSettings, userID)
	return c.setJSONCache(key, settings, CacheExpirationMedium)
}

// GetUserSettings 获取缓存的用户设置
func (c *CacheService) GetUserSettings(userID int64) (*model.UserSettings, error) {
	key := fmt.Sprintf(CacheKeyUserSettings, userID)
	var settings model.UserSettings
	err := c.getJSONCache(key, &settings)
	if err != nil {
		return nil, err
	}
	return &settings, nil
}

// DeleteUserSettings 删除用户设置缓存
func (c *CacheService) DeleteUserSettings(userID int64) error {
	key := fmt.Sprintf(CacheKeyUserSettings, userID)
	return c.redisClient.Del(key)
}

// SetUserSecurity 缓存用户安全设置
func (c *CacheService) SetUserSecurity(userID int64, security *model.UserSecurity) error {
	key := fmt.Sprintf(CacheKeyUserSecurity, userID)
	return c.setJSONCache(key, security, CacheExpirationMedium)
}

// GetUserSecurity 获取缓存的用户安全设置
func (c *CacheService) GetUserSecurity(userID int64) (*model.UserSecurity, error) {
	key := fmt.Sprintf(CacheKeyUserSecurity, userID)
	var security model.UserSecurity
	err := c.getJSONCache(key, &security)
	if err != nil {
		return nil, err
	}
	return &security, nil
}

// DeleteUserSecurity 删除用户安全设置缓存
func (c *CacheService) DeleteUserSecurity(userID int64) error {
	key := fmt.Sprintf(CacheKeyUserSecurity, userID)
	return c.redisClient.Del(key)
}

// SetAPIService 缓存API服务信息
func (c *CacheService) SetAPIService(serviceID int64, service *model.APIService) error {
	key := fmt.Sprintf(CacheKeyAPIService, serviceID)
	return c.setJSONCache(key, service, CacheExpirationLong)
}

// GetAPIService 获取缓存的API服务信息
func (c *CacheService) GetAPIService(serviceID int64) (*model.APIService, error) {
	key := fmt.Sprintf(CacheKeyAPIService, serviceID)
	var service model.APIService
	err := c.getJSONCache(key, &service)
	if err != nil {
		return nil, err
	}
	return &service, nil
}

// DeleteAPIService 删除API服务缓存
func (c *CacheService) DeleteAPIService(serviceID int64) error {
	key := fmt.Sprintf(CacheKeyAPIService, serviceID)
	return c.redisClient.Del(key)
}

// SetAPIServices 缓存卖家的API服务列表
func (c *CacheService) SetAPIServices(sellerID int64, services []*model.APIService) error {
	key := fmt.Sprintf(CacheKeyAPIServices, sellerID)
	return c.setJSONCache(key, services, CacheExpirationMedium)
}

// GetAPIServices 获取缓存的卖家API服务列表
func (c *CacheService) GetAPIServices(sellerID int64) ([]*model.APIService, error) {
	key := fmt.Sprintf(CacheKeyAPIServices, sellerID)
	var services []*model.APIService
	err := c.getJSONCache(key, &services)
	if err != nil {
		return nil, err
	}
	return services, nil
}

// DeleteAPIServices 删除卖家API服务列表缓存
func (c *CacheService) DeleteAPIServices(sellerID int64) error {
	key := fmt.Sprintf(CacheKeyAPIServices, sellerID)
	return c.redisClient.Del(key)
}

// SetAllAPIServices 缓存所有活跃的API服务列表
func (c *CacheService) SetAllAPIServices(services []*model.APIService) error {
	return c.setJSONCache(CacheKeyAllAPIServices, services, CacheExpirationShort)
}

// GetAllAPIServices 获取缓存的所有活跃API服务列表
func (c *CacheService) GetAllAPIServices() ([]*model.APIService, error) {
	var services []*model.APIService
	err := c.getJSONCache(CacheKeyAllAPIServices, &services)
	if err != nil {
		return nil, err
	}
	return services, nil
}

// DeleteAllAPIServices 删除所有API服务列表缓存
func (c *CacheService) DeleteAllAPIServices() error {
	return c.redisClient.Del(CacheKeyAllAPIServices)
}

// SetSubscriptions 缓存用户订阅列表
func (c *CacheService) SetSubscriptions(userID int64, subscriptions []*model.PlatformAPIKey) error {
	key := fmt.Sprintf(CacheKeySubscriptions, userID)
	return c.setJSONCache(key, subscriptions, CacheExpirationMedium)
}

// GetSubscriptions 获取缓存的用户订阅列表
func (c *CacheService) GetSubscriptions(userID int64) ([]*model.PlatformAPIKey, error) {
	key := fmt.Sprintf(CacheKeySubscriptions, userID)
	var subscriptions []*model.PlatformAPIKey
	err := c.getJSONCache(key, &subscriptions)
	if err != nil {
		return nil, err
	}
	return subscriptions, nil
}

// DeleteSubscriptions 删除用户订阅列表缓存
func (c *CacheService) DeleteSubscriptions(userID int64) error {
	key := fmt.Sprintf(CacheKeySubscriptions, userID)
	return c.redisClient.Del(key)
}

// SetUsageStats 缓存使用统计数据
func (c *CacheService) SetUsageStats(userID int64, period string, stats *model.UsageSummaryResponse) error {
	key := fmt.Sprintf(CacheKeyUsageStats, userID, period)
	return c.setJSONCache(key, stats, CacheExpirationShort)
}

// GetUsageStats 获取缓存的使用统计数据
func (c *CacheService) GetUsageStats(userID int64, period string) (*model.UsageSummaryResponse, error) {
	key := fmt.Sprintf(CacheKeyUsageStats, userID, period)
	var stats model.UsageSummaryResponse
	err := c.getJSONCache(key, &stats)
	if err != nil {
		return nil, err
	}
	return &stats, nil
}

// DeleteUsageStats 删除使用统计缓存
func (c *CacheService) DeleteUsageStats(userID int64, period string) error {
	key := fmt.Sprintf(CacheKeyUsageStats, userID, period)
	return c.redisClient.Del(key)
}

// SetAPIDocumentation 缓存API文档
func (c *CacheService) SetAPIDocumentation(serviceID int64, doc *model.APIDocumentationResponse) error {
	key := fmt.Sprintf(CacheKeyAPIDoc, serviceID)
	return c.setJSONCache(key, doc, CacheExpirationLong)
}

// GetAPIDocumentation 获取缓存的API文档
func (c *CacheService) GetAPIDocumentation(serviceID int64) (*model.APIDocumentationResponse, error) {
	key := fmt.Sprintf(CacheKeyAPIDoc, serviceID)
	var doc model.APIDocumentationResponse
	err := c.getJSONCache(key, &doc)
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

// DeleteAPIDocumentation 删除API文档缓存
func (c *CacheService) DeleteAPIDocumentation(serviceID int64) error {
	key := fmt.Sprintf(CacheKeyAPIDoc, serviceID)
	return c.redisClient.Del(key)
}

// InvalidateUserCache 清除用户相关的所有缓存
func (c *CacheService) InvalidateUserCache(userID int64) error {
	keys := []string{
		fmt.Sprintf(CacheKeyUserProfile, userID),
		fmt.Sprintf(CacheKeyUserSettings, userID),
		fmt.Sprintf(CacheKeyUserSecurity, userID),
		fmt.Sprintf(CacheKeySubscriptions, userID),
	}
	
	// 删除使用统计缓存（所有时间段）
	periods := []string{"daily", "weekly", "monthly"}
	for _, period := range periods {
		keys = append(keys, fmt.Sprintf(CacheKeyUsageStats, userID, period))
	}
	
	return c.redisClient.Del(keys...)
}

// InvalidateAPIServiceCache 清除API服务相关的所有缓存
func (c *CacheService) InvalidateAPIServiceCache(serviceID, sellerID int64) error {
	keys := []string{
		fmt.Sprintf(CacheKeyAPIService, serviceID),
		fmt.Sprintf(CacheKeyAPIServices, sellerID),
		fmt.Sprintf(CacheKeyAPIDoc, serviceID),
		CacheKeyAllAPIServices,
	}
	
	return c.redisClient.Del(keys...)
}

// setJSONCache 设置JSON格式的缓存
func (c *CacheService) setJSONCache(key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal cache data: %w", err)
	}
	
	return c.redisClient.Set(key, data, expiration)
}

// getJSONCache 获取JSON格式的缓存
func (c *CacheService) getJSONCache(key string, dest interface{}) error {
	data, err := c.redisClient.Get(key)
	if err != nil {
		return fmt.Errorf("cache miss: %w", err)
	}
	
	if err := json.Unmarshal([]byte(data), dest); err != nil {
		return fmt.Errorf("failed to unmarshal cache data: %w", err)
	}
	
	return nil
}

// ClearAllCache 清除所有缓存（谨慎使用）
func (c *CacheService) ClearAllCache() error {
	return c.redisClient.client.FlushDB(c.redisClient.ctx).Err()
}