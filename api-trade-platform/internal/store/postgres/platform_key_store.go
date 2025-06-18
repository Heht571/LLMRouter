package postgres

import (
	"api-trade-platform/internal/model"
	"database/sql"
	"fmt"
)

// PlatformKeyStore 平台API密钥数据库操作
type PlatformKeyStore struct {
	*Store
}

// NewPlatformKeyStore 创建平台密钥存储实例
func NewPlatformKeyStore(store *Store) *PlatformKeyStore {
	return &PlatformKeyStore{Store: store}
}

// CreatePlatformAPIKey 创建新的平台API密钥
func (pk *PlatformKeyStore) CreatePlatformAPIKey(key *model.PlatformAPIKey) error {
	query := `
		INSERT INTO platform_api_keys (buyer_user_id, service_id, platform_api_key, 
			is_active, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING key_id, created_at, updated_at`

	err := pk.DB.QueryRow(query, key.BuyerUserID, key.ServiceID, key.PlatformAPIKey,
		key.IsActive, key.ExpiresAt).Scan(&key.KeyID, &key.CreatedAt, &key.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create platform API key: %w", err)
	}
	return nil
}

// GetPlatformAPIKeyByKey 根据密钥字符串获取平台API密钥信息
func (pk *PlatformKeyStore) GetPlatformAPIKeyByKey(apiKey string) (*model.PlatformAPIKey, error) {
	key := &model.PlatformAPIKey{}
	query := `
		SELECT key_id, buyer_user_id, service_id, platform_api_key, is_active, 
			expires_at, created_at, updated_at
		FROM platform_api_keys WHERE platform_api_key = $1 AND is_active = true`

	err := pk.DB.QueryRow(query, apiKey).Scan(&key.KeyID, &key.BuyerUserID,
		&key.ServiceID, &key.PlatformAPIKey, &key.IsActive, &key.ExpiresAt,
		&key.CreatedAt, &key.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("platform API key not found or inactive")
		}
		return nil, fmt.Errorf("failed to get platform API key: %w", err)
	}
	return key, nil
}

// GetPlatformAPIKeysByBuyerID 获取买家的所有平台API密钥
func (pk *PlatformKeyStore) GetPlatformAPIKeysByBuyerID(buyerUserID int64) ([]*model.PlatformAPIKey, error) {
	query := `
		SELECT key_id, buyer_user_id, service_id, platform_api_key, is_active, 
			expires_at, created_at, updated_at
		FROM platform_api_keys WHERE buyer_user_id = $1 ORDER BY created_at DESC`

	rows, err := pk.DB.Query(query, buyerUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get platform API keys: %w", err)
	}
	defer rows.Close()

	var keys []*model.PlatformAPIKey
	for rows.Next() {
		key := &model.PlatformAPIKey{}
		err := rows.Scan(&key.KeyID, &key.BuyerUserID, &key.ServiceID,
			&key.PlatformAPIKey, &key.IsActive, &key.ExpiresAt,
			&key.CreatedAt, &key.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan platform API key: %w", err)
		}
		keys = append(keys, key)
	}
	return keys, nil
}

// CheckSubscriptionExists 检查买家是否已订阅某个服务
func (pk *PlatformKeyStore) CheckSubscriptionExists(buyerUserID, serviceID int64) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM platform_api_keys WHERE buyer_user_id = $1 AND service_id = $2 AND is_active = true`
	err := pk.DB.QueryRow(query, buyerUserID, serviceID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check subscription: %w", err)
	}
	return count > 0, nil
}

// DeactivatePlatformAPIKey 停用平台API密钥
func (pk *PlatformKeyStore) DeactivatePlatformAPIKey(keyID int64) error {
	query := `UPDATE platform_api_keys SET is_active = false, updated_at = NOW() WHERE key_id = $1`
	_, err := pk.DB.Exec(query, keyID)
	if err != nil {
		return fmt.Errorf("failed to deactivate platform API key: %w", err)
	}
	return nil
}

// DeletePlatformAPIKey 删除平台API密钥（取消订阅）
func (pk *PlatformKeyStore) DeletePlatformAPIKey(buyerUserID, serviceID int64) error {
	query := `DELETE FROM platform_api_keys WHERE buyer_user_id = $1 AND service_id = $2`
	result, err := pk.DB.Exec(query, buyerUserID, serviceID)
	if err != nil {
		return fmt.Errorf("failed to delete platform API key: %w", err)
	}
	
	// 检查是否有记录被删除
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("no subscription found to delete")
	}
	
	return nil
}

// GetPlatformAPIKeyWithServiceInfo 获取包含服务信息的平台API密钥
func (pk *PlatformKeyStore) GetPlatformAPIKeyWithServiceInfo(apiKey string) (*model.PlatformAPIKey, *model.APIService, error) {
	key := &model.PlatformAPIKey{}
	service := &model.APIService{}
	query := `
		SELECT 
			pk.key_id, pk.buyer_user_id, pk.service_id, pk.platform_api_key, pk.is_active, 
			pk.expires_at, pk.created_at, pk.updated_at,
			s.service_id, s.seller_user_id, s.name, s.description, s.original_endpoint_url,
			s.encrypted_original_api_key, s.platform_proxy_prefix, s.pricing_model, s.price_per_call, s.price_per_token,
			s.is_active, s.created_at, s.updated_at
		FROM platform_api_keys pk
		JOIN api_services s ON pk.service_id = s.service_id
		WHERE pk.platform_api_key = $1 AND pk.is_active = true AND s.is_active = true`

	err := pk.DB.QueryRow(query, apiKey).Scan(
		&key.KeyID, &key.BuyerUserID, &key.ServiceID, &key.PlatformAPIKey, &key.IsActive,
		&key.ExpiresAt, &key.CreatedAt, &key.UpdatedAt,
		&service.ServiceID, &service.SellerUserID, &service.Name, &service.Description,
		&service.OriginalEndpointURL, &service.EncryptedOriginalAPIKey, &service.PlatformProxyPrefix,
		&service.PricingModel, &service.PricePerCall, &service.PricePerToken,
		&service.IsActive, &service.CreatedAt, &service.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil, fmt.Errorf("platform API key or service not found or inactive")
		}
		return nil, nil, fmt.Errorf("failed to get platform API key with service info: %w", err)
	}
	return key, service, nil
}