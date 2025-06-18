package postgres

import (
	"api-trade-platform/internal/model"
	"fmt"
	"strings"
	"time"
)

// UsageLogStore 使用日志数据库操作
type UsageLogStore struct {
	*Store
}

// NewUsageLogStore 创建使用日志存储实例
func NewUsageLogStore(store *Store) *UsageLogStore {
	return &UsageLogStore{Store: store}
}

// CreateUsageLog 创建使用日志记录
func (ul *UsageLogStore) CreateUsageLog(log *model.UsageLog) error {
	query := `
		INSERT INTO usage_logs (platform_api_key_id, buyer_user_id, api_service_id, seller_user_id,
			request_timestamp, response_status_code, is_success, request_path, request_method, processing_time_ms,
			input_tokens, output_tokens, total_tokens, cost, model_name, request_size_bytes, response_size_bytes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		RETURNING log_id`

	err := ul.DB.QueryRow(query, log.PlatformAPIKeyID, log.BuyerUserID, log.APIServiceID,
		log.SellerUserID, log.RequestTimestamp, log.ResponseStatusCode, log.IsSuccess,
		log.RequestPath, log.RequestMethod, log.ProcessingTimeMs,
		log.InputTokens, log.OutputTokens, log.TotalTokens, log.Cost, log.ModelName,
		log.RequestSizeBytes, log.ResponseSizeBytes).Scan(&log.LogID)
	if err != nil {
		return fmt.Errorf("failed to create usage log: %w", err)
	}
	return nil
}

// GetUsageStatsByBuyerID 获取买家的使用统计
func (ul *UsageLogStore) GetUsageStatsByBuyerID(buyerUserID int64, period string) (*model.UsageSummaryResponse, error) {
	// 买家统计改为计算总费用，不限制时间范围
	// 获取总调用次数和token统计
	var totalCalls int64
	var totalTokens int64
	var totalCost float64
	totalQuery := `
		SELECT 
			COUNT(*) as total_calls,
			COALESCE(SUM(total_tokens), 0) as total_tokens,
			COALESCE(SUM(cost), 0) as total_cost
		FROM usage_logs 
		WHERE buyer_user_id = $1`
	err := ul.DB.QueryRow(totalQuery, buyerUserID).Scan(&totalCalls, &totalTokens, &totalCost)
	if err != nil {
		return nil, fmt.Errorf("failed to get total calls: %w", err)
	}

	// 获取详细统计信息
	detailQuery := `
		SELECT 
			ul.api_service_id,
			aps.name,
			COUNT(*) as calls,
			COALESCE(SUM(ul.total_tokens), 0) as total_tokens,
			COALESCE(SUM(ul.cost), 0) as cost
		FROM usage_logs ul
		JOIN api_services aps ON ul.api_service_id = aps.service_id
		WHERE ul.buyer_user_id = $1
		GROUP BY ul.api_service_id, aps.name
		ORDER BY calls DESC`

	rows, err := ul.DB.Query(detailQuery, buyerUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get usage details: %w", err)
	}
	defer rows.Close()

	var details []model.APICallDetail
	for rows.Next() {
		var detail model.APICallDetail
		err := rows.Scan(&detail.APIServiceID, &detail.APIServiceName, &detail.Calls, &detail.TotalTokens, &detail.Cost)
		if err != nil {
			return nil, fmt.Errorf("failed to scan usage detail: %w", err)
		}
		
		details = append(details, detail)
	}

	return &model.UsageSummaryResponse{
		CallsMade:         totalCalls,
		TotalTokens:       totalTokens,
		IndicativeCost:    totalCost,
		UsageDetailsByAPI: details,
		Period:            period,
	}, nil
}

// GetUsageLogsByBuyerID 获取买家的使用日志
func (ul *UsageLogStore) GetUsageLogsByBuyerID(buyerUserID int64, limit, offset int) ([]*model.UsageLog, error) {
	query := `
		SELECT log_id, platform_api_key_id, buyer_user_id, api_service_id, seller_user_id,
			request_timestamp, response_status_code, is_success, request_path, request_method, processing_time_ms
		FROM usage_logs 
		WHERE buyer_user_id = $1 
		ORDER BY request_timestamp DESC 
		LIMIT $2 OFFSET $3`

	rows, err := ul.DB.Query(query, buyerUserID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get usage logs: %w", err)
	}
	defer rows.Close()

	var logs []*model.UsageLog
	for rows.Next() {
		log := &model.UsageLog{}
		err := rows.Scan(&log.LogID, &log.PlatformAPIKeyID, &log.BuyerUserID,
			&log.APIServiceID, &log.SellerUserID, &log.RequestTimestamp,
			&log.ResponseStatusCode, &log.IsSuccess, &log.RequestPath,
			&log.RequestMethod, &log.ProcessingTimeMs)
		if err != nil {
			return nil, fmt.Errorf("failed to scan usage log: %w", err)
		}
		logs = append(logs, log)
	}
	return logs, nil
}

// GetUsageStatsBySellerID 获取卖家的API使用统计
func (ul *UsageLogStore) GetUsageStatsBySellerID(sellerUserID int64, period string) (*model.UsageSummaryResponse, error) {
	// 卖家统计改为计算总收入，不限制时间范围
	// 获取总调用次数和token统计
	var totalCalls int64
	var totalTokens int64
	var totalCost float64
	totalQuery := `
		SELECT 
			COUNT(*) as total_calls,
			COALESCE(SUM(total_tokens), 0) as total_tokens,
			COALESCE(SUM(cost), 0) as total_cost
		FROM usage_logs 
		WHERE seller_user_id = $1`
	err := ul.DB.QueryRow(totalQuery, sellerUserID).Scan(&totalCalls, &totalTokens, &totalCost)
	if err != nil {
		return nil, fmt.Errorf("failed to get total calls: %w", err)
	}

	// 获取详细统计信息
	detailQuery := `
		SELECT 
			ul.api_service_id,
			aps.name,
			COUNT(*) as calls,
			COALESCE(SUM(ul.total_tokens), 0) as total_tokens,
			COALESCE(SUM(ul.cost), 0) as cost
		FROM usage_logs ul
		JOIN api_services aps ON ul.api_service_id = aps.service_id
		WHERE ul.seller_user_id = $1
		GROUP BY ul.api_service_id, aps.name
		ORDER BY calls DESC`

	rows, err := ul.DB.Query(detailQuery, sellerUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get usage details: %w", err)
	}
	defer rows.Close()

	var details []model.APICallDetail
	for rows.Next() {
		var detail model.APICallDetail
		err := rows.Scan(&detail.APIServiceID, &detail.APIServiceName, &detail.Calls, &detail.TotalTokens, &detail.Cost)
		if err != nil {
			return nil, fmt.Errorf("failed to scan usage detail: %w", err)
		}
		
		details = append(details, detail)
	}

	return &model.UsageSummaryResponse{
		CallsMade:         totalCalls,
		TotalTokens:       totalTokens,
		IndicativeCost:    totalCost, // 对于卖家，这里表示收入
		UsageDetailsByAPI: details,
		Period:            period,
	}, nil
}

// GetUsageTimeSeriesByBuyerID 获取买家的时间序列使用统计
func (ul *UsageLogStore) GetUsageTimeSeriesByBuyerID(buyerUserID int64, period string) (*UsageTimeSeries, error) {
		var startTime time.Time
		now := time.Now()
		var dateFormat string
		var groupByClause string

		// 根据周期确定开始时间和分组方式
		switch period {
		case "hourly":
			startTime = now.Add(-24 * time.Hour) // 过去24小时
			dateFormat = "YYYY-MM-DD HH24:00"
			groupByClause = "DATE_TRUNC('hour', request_timestamp)"
		case "daily":
			startTime = now.AddDate(0, 0, -30) // 过去30天
			dateFormat = "YYYY-MM-DD"
			groupByClause = "DATE(request_timestamp)"
		case "weekly":
			startTime = now.AddDate(0, 0, -84) // 过去12周
			dateFormat = "YYYY-\"W\"WW"
			groupByClause = "DATE_TRUNC('week', request_timestamp)"
		case "monthly":
			startTime = now.AddDate(-1, 0, 0) // 过去12个月
			dateFormat = "YYYY-MM"
			groupByClause = "DATE_TRUNC('month', request_timestamp)"
		default:
			startTime = now.AddDate(0, 0, -30)
			dateFormat = "YYYY-MM-DD"
			groupByClause = "DATE(request_timestamp)"
			period = "daily"
		}

		query := fmt.Sprintf(`
			SELECT 
				TO_CHAR(%s, '%s') as date,
			COUNT(*) as calls,
			COALESCE(SUM(total_tokens), 0) as total_tokens,
			COALESCE(SUM(cost), 0) as cost
		FROM usage_logs 
		WHERE buyer_user_id = $1 AND request_timestamp >= $2
		GROUP BY %s
		ORDER BY %s`, groupByClause, dateFormat, groupByClause, groupByClause)

		rows, err := ul.DB.Query(query, buyerUserID, startTime)
		if err != nil {
			return nil, fmt.Errorf("failed to get buyer usage time series: %w", err)
		}
		defer rows.Close()

		var dataPoints []TimeSeriesPoint
		for rows.Next() {
			var point TimeSeriesPoint
			err := rows.Scan(&point.Date, &point.Calls, &point.TotalTokens, &point.Cost)
			if err != nil {
				return nil, fmt.Errorf("failed to scan time series point: %w", err)
			}
			dataPoints = append(dataPoints, point)
		}

		return &UsageTimeSeries{
			Period:     period,
			DataPoints: dataPoints,
		}, nil
	}

	// GetUsageTimeSeriesBySellerID 获取卖家的时间序列使用统计
	func (ul *UsageLogStore) GetUsageTimeSeriesBySellerID(sellerUserID int64, period string) (*UsageTimeSeries, error) {
		var startTime time.Time
		now := time.Now()
		var dateFormat string
		var groupByClause string

		// 根据周期确定开始时间和分组方式
		switch period {
		case "hourly":
			startTime = now.Add(-24 * time.Hour) // 过去24小时
			dateFormat = "YYYY-MM-DD HH24:00"
			groupByClause = "DATE_TRUNC('hour', request_timestamp)"
		case "daily":
			startTime = now.AddDate(0, 0, -30) // 过去30天
			dateFormat = "YYYY-MM-DD"
			groupByClause = "DATE(request_timestamp)"
		case "weekly":
			startTime = now.AddDate(0, 0, -84) // 过去12周
			dateFormat = "YYYY-\"W\"WW"
			groupByClause = "DATE_TRUNC('week', request_timestamp)"
		case "monthly":
			startTime = now.AddDate(-1, 0, 0) // 过去12个月
			dateFormat = "YYYY-MM"
			groupByClause = "DATE_TRUNC('month', request_timestamp)"
		default:
			startTime = now.AddDate(0, 0, -30)
			dateFormat = "YYYY-MM-DD"
			groupByClause = "DATE(request_timestamp)"
			period = "daily"
		}

		// 查询卖家的API服务ID列表
		serviceQuery := `SELECT service_id FROM api_services WHERE seller_user_id = $1`
		serviceRows, err := ul.DB.Query(serviceQuery, sellerUserID)
		if err != nil {
			return nil, fmt.Errorf("failed to get seller services: %w", err)
		}
		defer serviceRows.Close()

		var serviceIDs []int64
		for serviceRows.Next() {
			var serviceID int64
			err := serviceRows.Scan(&serviceID)
			if err != nil {
				return nil, fmt.Errorf("failed to scan service ID: %w", err)
			}
			serviceIDs = append(serviceIDs, serviceID)
		}

		if len(serviceIDs) == 0 {
			return &UsageTimeSeries{
				Period:     period,
				DataPoints: []TimeSeriesPoint{},
			}, nil
		}

		// 构建IN子句
		placeholders := make([]string, len(serviceIDs))
		args := []interface{}{startTime}
		for i, serviceID := range serviceIDs {
			placeholders[i] = fmt.Sprintf("$%d", i+2)
			args = append(args, serviceID)
		}

		query := fmt.Sprintf(`
			SELECT 
				TO_CHAR(%s, '%s') as date,
				COUNT(*) as calls,
				COALESCE(SUM(total_tokens), 0) as total_tokens,
				COALESCE(SUM(cost), 0) as cost
			FROM usage_logs 
			WHERE request_timestamp >= $1 AND api_service_id IN (%s)
			GROUP BY %s
			ORDER BY %s`, groupByClause, dateFormat, strings.Join(placeholders, ","), groupByClause, groupByClause)

		rows, err := ul.DB.Query(query, args...)
		if err != nil {
			return nil, fmt.Errorf("failed to get seller usage time series: %w", err)
		}
		defer rows.Close()

		var dataPoints []TimeSeriesPoint
		for rows.Next() {
			var point TimeSeriesPoint
			err := rows.Scan(&point.Date, &point.Calls, &point.TotalTokens, &point.Cost)
			if err != nil {
				return nil, fmt.Errorf("failed to scan time series point: %w", err)
			}
			dataPoints = append(dataPoints, point)
		}

		return &UsageTimeSeries{
			Period:     period,
			DataPoints: dataPoints,
		}, nil
}

// ServiceUsageStats 服务使用统计结构
type ServiceUsageStats struct {
	Calls       int64
	TotalTokens int64
	Cost        float64
}

// TimeSeriesPoint 时间序列数据点
type TimeSeriesPoint struct {
	Date        string  `json:"date"`
	Calls       int64   `json:"calls"`
	TotalTokens int64   `json:"total_tokens"`
	Cost        float64 `json:"cost"`
}

// UsageTimeSeries 时间序列使用统计
type UsageTimeSeries struct {
	Period     string             `json:"period"`
	DataPoints []TimeSeriesPoint `json:"data_points"`
}

// GetUsageStatsByService 获取特定服务的使用统计
func (ul *UsageLogStore) GetUsageStatsByService(serviceID int64, period string) (*ServiceUsageStats, error) {
	var startTime time.Time
	now := time.Now()

	// 根据周期确定开始时间
	switch period {
	case "daily":
		startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	case "weekly":
		// 获取本周开始时间（周一）
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7 // 将周日从0改为7
		}
		startTime = now.AddDate(0, 0, -(weekday-1)).Truncate(24 * time.Hour)
	case "monthly":
		startTime = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	default:
		startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	}

	query := `
		SELECT 
			COUNT(*) as calls,
			COALESCE(SUM(total_tokens), 0) as total_tokens,
			COALESCE(SUM(cost), 0) as cost
		FROM usage_logs 
		WHERE api_service_id = $1 AND request_timestamp >= $2`

	var stats ServiceUsageStats
	err := ul.DB.QueryRow(query, serviceID, startTime).Scan(&stats.Calls, &stats.TotalTokens, &stats.Cost)
	if err != nil {
		return nil, fmt.Errorf("failed to get service usage stats: %w", err)
	}

	return &stats, nil
}