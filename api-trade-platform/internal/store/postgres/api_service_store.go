package postgres

import (
	"api-trade-platform/internal/model"
	"database/sql"
	"fmt"
)

// APIServiceStore API服务数据库操作
type APIServiceStore struct {
	*Store
}

// NewAPIServiceStore 创建API服务存储实例
func NewAPIServiceStore(store *Store) *APIServiceStore {
	return &APIServiceStore{Store: store}
}

// CreateAPIService 创建新的API服务
func (as *APIServiceStore) CreateAPIService(service *model.APIService) error {
	query := `
		INSERT INTO api_services (seller_user_id, name, description, original_endpoint_url, 
			encrypted_original_api_key, platform_proxy_prefix, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		RETURNING service_id, created_at, updated_at`

	err := as.DB.QueryRow(query, service.SellerUserID, service.Name, service.Description,
		service.OriginalEndpointURL, service.EncryptedOriginalAPIKey, service.PlatformProxyPrefix,
		service.IsActive).Scan(&service.ServiceID, &service.CreatedAt, &service.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create API service: %w", err)
	}
	return nil
}

// GetAPIServicesBySellerID 获取卖家的所有API服务
func (as *APIServiceStore) GetAPIServicesBySellerID(sellerUserID int64) ([]*model.APIService, error) {
	query := `
		SELECT service_id, seller_user_id, name, description, original_endpoint_url,
			encrypted_original_api_key, platform_proxy_prefix, is_active, 
			COALESCE(pricing_model, 'per_call') as pricing_model,
			COALESCE(price_per_call, 0.0) as price_per_call,
			COALESCE(price_per_token, 0.0) as price_per_token,
			created_at, updated_at
		FROM api_services WHERE seller_user_id = $1 ORDER BY created_at DESC`

	rows, err := as.DB.Query(query, sellerUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get API services: %w", err)
	}
	defer rows.Close()

	var services []*model.APIService
	for rows.Next() {
		service := &model.APIService{}
		err := rows.Scan(&service.ServiceID, &service.SellerUserID, &service.Name,
			&service.Description, &service.OriginalEndpointURL, &service.EncryptedOriginalAPIKey,
			&service.PlatformProxyPrefix, &service.IsActive, &service.PricingModel,
			&service.PricePerCall, &service.PricePerToken, &service.CreatedAt, &service.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan API service: %w", err)
		}
		services = append(services, service)
	}
	return services, nil
}

// GetAllActiveAPIServices 获取所有活跃的API服务（供买家浏览）
func (as *APIServiceStore) GetAllActiveAPIServices() ([]*model.APIService, error) {
	query := `
		SELECT s.service_id, s.seller_user_id, s.name, 
			COALESCE(s.description, '') as description, 
			s.original_endpoint_url, s.encrypted_original_api_key, s.platform_proxy_prefix, s.is_active, 
			COALESCE(s.category, '') as category, 
			COALESCE(s.rating, 0.0) as rating, 
			COALESCE(s.review_count, 0) as review_count, 
			COALESCE(s.price_per_call, 0.01) as price_per_call, 
			COALESCE(s.pricing_model, 'per_call') as pricing_model, 
			COALESCE(s.price_per_token, 0.01) as price_per_token, 
			COALESCE(s.total_calls, 0) as total_calls, 
			COUNT(DISTINCT pak.buyer_user_id) as subscriber_count, 
			COALESCE(s.features, '') as features, 
			COALESCE(s.documentation, '') as documentation,
			s.created_at, s.updated_at
		FROM api_services s
		LEFT JOIN platform_api_keys pak ON s.service_id = pak.service_id AND pak.is_active = true
		WHERE s.is_active = true
		GROUP BY s.service_id, s.seller_user_id, s.name, s.description, s.original_endpoint_url, 
			s.encrypted_original_api_key, s.platform_proxy_prefix, s.is_active, s.category, 
			s.rating, s.review_count, s.price_per_call, s.pricing_model, s.price_per_token, 
			s.total_calls, s.features, s.documentation, s.created_at, s.updated_at
		ORDER BY s.created_at DESC`

	rows, err := as.DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get active API services: %w", err)
	}
	defer rows.Close()

	var services []*model.APIService
	for rows.Next() {
		service := &model.APIService{}
		err := rows.Scan(&service.ServiceID, &service.SellerUserID, &service.Name,
			&service.Description, &service.OriginalEndpointURL, &service.EncryptedOriginalAPIKey,
			&service.PlatformProxyPrefix, &service.IsActive, 
			&service.Category, &service.Rating, &service.ReviewCount, &service.PricePerCall, 
			&service.PricingModel, &service.PricePerToken, &service.TotalCalls, 
			&service.SubscriberCount, &service.Features, &service.Documentation,
			&service.CreatedAt, &service.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan API service: %w", err)
		}
		services = append(services, service)
	}
	return services, nil
}

// GetAPIServiceByID 根据ID获取API服务
func (as *APIServiceStore) GetAPIServiceByID(serviceID int64) (*model.APIService, error) {
	service := &model.APIService{}
	query := `
		SELECT service_id, seller_user_id, name, description, original_endpoint_url,
			encrypted_original_api_key, platform_proxy_prefix, is_active,
			COALESCE(pricing_model, 'per_call') as pricing_model,
			COALESCE(price_per_call, 0.0) as price_per_call,
			COALESCE(price_per_token, 0.0) as price_per_token,
			created_at, updated_at
		FROM api_services WHERE service_id = $1`

	err := as.DB.QueryRow(query, serviceID).Scan(&service.ServiceID, &service.SellerUserID,
		&service.Name, &service.Description, &service.OriginalEndpointURL,
		&service.EncryptedOriginalAPIKey, &service.PlatformProxyPrefix, &service.IsActive,
		&service.PricingModel, &service.PricePerCall, &service.PricePerToken,
		&service.CreatedAt, &service.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // 返回 nil, nil 而不是错误
		}
		return nil, fmt.Errorf("failed to get API service: %w", err)
	}
	return service, nil
}

// UpdateAPIServiceStatus 更新API服务状态
func (as *APIServiceStore) UpdateAPIServiceStatus(serviceID int64, isActive bool) error {
	query := `UPDATE api_services SET is_active = $1, updated_at = NOW() WHERE service_id = $2`
	_, err := as.DB.Exec(query, isActive, serviceID)
	if err != nil {
		return fmt.Errorf("failed to update API service status: %w", err)
	}
	return nil
}

// UpdateAPIService 更新API服务信息
func (as *APIServiceStore) UpdateAPIService(serviceID int64, service *model.APIService) error {
	query := `
		UPDATE api_services 
		SET name = $1, description = $2, original_endpoint_url = $3, 
			encrypted_original_api_key = $4, is_active = $5, pricing_model = $6,
			price_per_call = $7, price_per_token = $8, updated_at = NOW()
		WHERE service_id = $9 AND seller_user_id = $10`

	_, err := as.DB.Exec(query, service.Name, service.Description, service.OriginalEndpointURL,
		service.EncryptedOriginalAPIKey, service.IsActive, service.PricingModel,
		service.PricePerCall, service.PricePerToken, serviceID, service.SellerUserID)
	if err != nil {
		return fmt.Errorf("failed to update API service: %w", err)
	}
	return nil
}

// DeleteAPIService 删除API服务
func (as *APIServiceStore) DeleteAPIService(serviceID int64, sellerUserID int64) error {
	// 首先检查是否存在相关的平台API密钥
	checkQuery := `SELECT COUNT(*) FROM platform_api_keys WHERE service_id = $1`
	var count int
	err := as.DB.QueryRow(checkQuery, serviceID).Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check platform API keys: %w", err)
	}

	if count > 0 {
		return fmt.Errorf("cannot delete API service: there are active subscriptions")
	}

	// 删除API服务
	query := `DELETE FROM api_services WHERE service_id = $1 AND seller_user_id = $2`
	result, err := as.DB.Exec(query, serviceID, sellerUserID)
	if err != nil {
		return fmt.Errorf("failed to delete API service: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("API service not found or not owned by user")
	}

	return nil
}

// UpdateAPIPricing updates the pricing settings for an API service
func (as *APIServiceStore) UpdateAPIPricing(serviceID int64, sellerUserID int64, pricingModel string, pricePerCall, pricePerToken float64) error {
	query := `
		UPDATE api_services 
		SET pricing_model = $1, price_per_call = $2, price_per_token = $3, updated_at = NOW()
		WHERE service_id = $4 AND seller_user_id = $5`

	result, err := as.DB.Exec(query, pricingModel, pricePerCall, pricePerToken, serviceID, sellerUserID)
	if err != nil {
		return fmt.Errorf("failed to update API pricing: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("API service not found or not owned by user")
	}

	return nil
}