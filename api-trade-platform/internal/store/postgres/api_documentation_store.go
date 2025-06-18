package postgres

import (
	"database/sql"
	"encoding/json"
	"fmt"

	"api-trade-platform/internal/model"
	"github.com/lib/pq"
)

// APIDocumentationStore 处理API文档相关的数据库操作
type APIDocumentationStore struct {
	db *sql.DB
}

// NewAPIDocumentationStore 创建新的API文档存储实例
func NewAPIDocumentationStore(db *sql.DB) *APIDocumentationStore {
	return &APIDocumentationStore{db: db}
}

// CreateAPIDocumentation 创建API文档
func (s *APIDocumentationStore) CreateAPIDocumentation(serviceID int64, req *model.CreateAPIDocumentationRequest) (*model.APIDocumentation, error) {
	query := `
		INSERT INTO api_documentation (service_id, title, description, content, version, is_published)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING doc_id, created_at, updated_at
	`

	version := req.Version
	if version == "" {
		version = "1.0.0"
	}

	doc := &model.APIDocumentation{
		ServiceID:   serviceID,
		Title:       req.Title,
		Description: req.Description,
		Content:     req.Content,
		Version:     version,
		IsPublished: req.IsPublished,
	}

	err := s.db.QueryRow(query, serviceID, req.Title, req.Description, req.Content, version, req.IsPublished).Scan(
		&doc.DocID, &doc.CreatedAt, &doc.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create API documentation: %w", err)
	}

	return doc, nil
}

// GetAPIDocumentationByServiceID 根据服务ID获取API文档
func (s *APIDocumentationStore) GetAPIDocumentationByServiceID(serviceID int64) (*model.APIDocumentation, error) {
	query := `
		SELECT doc_id, service_id, title, description, content, version, is_published, created_at, updated_at
		FROM api_documentation
		WHERE service_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`

	doc := &model.APIDocumentation{}
	err := s.db.QueryRow(query, serviceID).Scan(
		&doc.DocID, &doc.ServiceID, &doc.Title, &doc.Description,
		&doc.Content, &doc.Version, &doc.IsPublished, &doc.CreatedAt, &doc.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get API documentation: %w", err)
	}

	return doc, nil
}

// GetAPIDocumentationByID 根据文档ID获取API文档
func (s *APIDocumentationStore) GetAPIDocumentationByID(docID int64) (*model.APIDocumentation, error) {
	query := `
		SELECT doc_id, service_id, title, description, content, version, is_published, created_at, updated_at
		FROM api_documentation
		WHERE doc_id = $1
	`

	doc := &model.APIDocumentation{}
	err := s.db.QueryRow(query, docID).Scan(
		&doc.DocID, &doc.ServiceID, &doc.Title, &doc.Description,
		&doc.Content, &doc.Version, &doc.IsPublished, &doc.CreatedAt, &doc.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get API documentation: %w", err)
	}

	return doc, nil
}

// UpdateAPIDocumentation 更新API文档
func (s *APIDocumentationStore) UpdateAPIDocumentation(docID int64, req *model.UpdateAPIDocumentationRequest) (*model.APIDocumentation, error) {
	query := `
		UPDATE api_documentation
		SET title = $2, description = $3, content = $4, version = $5, is_published = COALESCE($6, is_published), updated_at = CURRENT_TIMESTAMP
		WHERE doc_id = $1
		RETURNING doc_id, service_id, title, description, content, version, is_published, created_at, updated_at
	`

	version := req.Version
	if version == "" {
		version = "1.0.0"
	}

	doc := &model.APIDocumentation{}
	err := s.db.QueryRow(query, docID, req.Title, req.Description, req.Content, version, req.IsPublished).Scan(
		&doc.DocID, &doc.ServiceID, &doc.Title, &doc.Description,
		&doc.Content, &doc.Version, &doc.IsPublished, &doc.CreatedAt, &doc.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("API documentation not found")
		}
		return nil, fmt.Errorf("failed to update API documentation: %w", err)
	}

	return doc, nil
}

// DeleteAPIDocumentation 删除API文档
func (s *APIDocumentationStore) DeleteAPIDocumentation(docID int64) error {
	query := `DELETE FROM api_documentation WHERE doc_id = $1`

	result, err := s.db.Exec(query, docID)
	if err != nil {
		return fmt.Errorf("failed to delete API documentation: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("API documentation not found")
	}

	return nil
}

// CreateAPIEndpoint 创建API端点文档
func (s *APIDocumentationStore) CreateAPIEndpoint(docID int64, req *model.CreateAPIEndpointRequest) (*model.APIEndpoint, error) {
	// 序列化JSON字段
	requestBodySchema, _ := json.Marshal(req.RequestBodySchema)
	responseSchema, _ := json.Marshal(req.ResponseSchema)
	parameters, _ := json.Marshal(req.Parameters)
	examples, _ := json.Marshal(req.Examples)

	query := `
		INSERT INTO api_endpoints (doc_id, method, path, summary, description, request_body_schema, response_schema, parameters, examples, tags, is_deprecated)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING endpoint_id, created_at, updated_at
	`

	endpoint := &model.APIEndpoint{
		DocID:             docID,
		Method:            req.Method,
		Path:              req.Path,
		Summary:           req.Summary,
		Description:       req.Description,
		RequestBodySchema: req.RequestBodySchema,
		ResponseSchema:    req.ResponseSchema,
		Parameters:        req.Parameters,
		Examples:          req.Examples,
		Tags:              req.Tags,
		IsDeprecated:      req.IsDeprecated,
	}

	err := s.db.QueryRow(query, docID, req.Method, req.Path, req.Summary, req.Description,
		requestBodySchema, responseSchema, parameters, examples, pq.Array(req.Tags), req.IsDeprecated).Scan(
		&endpoint.EndpointID, &endpoint.CreatedAt, &endpoint.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create API endpoint: %w", err)
	}

	return endpoint, nil
}

// GetAPIEndpointsByDocID 根据文档ID获取所有端点
func (s *APIDocumentationStore) GetAPIEndpointsByDocID(docID int64) ([]model.APIEndpoint, error) {
	query := `
		SELECT endpoint_id, doc_id, method, path, summary, description, request_body_schema, response_schema, parameters, examples, tags, is_deprecated, created_at, updated_at
		FROM api_endpoints
		WHERE doc_id = $1
		ORDER BY method, path
	`

	rows, err := s.db.Query(query, docID)
	if err != nil {
		return nil, fmt.Errorf("failed to get API endpoints: %w", err)
	}
	defer rows.Close()

	var endpoints []model.APIEndpoint
	for rows.Next() {
		var endpoint model.APIEndpoint
		var requestBodySchemaBytes, responseSchemaBytes, parametersBytes, examplesBytes []byte
		var tags pq.StringArray

		err := rows.Scan(
			&endpoint.EndpointID, &endpoint.DocID, &endpoint.Method, &endpoint.Path,
			&endpoint.Summary, &endpoint.Description, &requestBodySchemaBytes, &responseSchemaBytes,
			&parametersBytes, &examplesBytes, &tags, &endpoint.IsDeprecated,
			&endpoint.CreatedAt, &endpoint.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan API endpoint: %w", err)
		}

		// 反序列化JSON字段
		if len(requestBodySchemaBytes) > 0 {
			json.Unmarshal(requestBodySchemaBytes, &endpoint.RequestBodySchema)
		}
		if len(responseSchemaBytes) > 0 {
			json.Unmarshal(responseSchemaBytes, &endpoint.ResponseSchema)
		}
		if len(parametersBytes) > 0 {
			json.Unmarshal(parametersBytes, &endpoint.Parameters)
		}
		if len(examplesBytes) > 0 {
			json.Unmarshal(examplesBytes, &endpoint.Examples)
		}
		endpoint.Tags = []string(tags)

		endpoints = append(endpoints, endpoint)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate API endpoints: %w", err)
	}

	return endpoints, nil
}

// UpdateAPIEndpoint 更新API端点文档
func (s *APIDocumentationStore) UpdateAPIEndpoint(endpointID int64, req *model.UpdateAPIEndpointRequest) (*model.APIEndpoint, error) {
	// 序列化JSON字段
	requestBodySchema, _ := json.Marshal(req.RequestBodySchema)
	responseSchema, _ := json.Marshal(req.ResponseSchema)
	parameters, _ := json.Marshal(req.Parameters)
	examples, _ := json.Marshal(req.Examples)

	query := `
		UPDATE api_endpoints
		SET method = $2, path = $3, summary = $4, description = $5, request_body_schema = $6, response_schema = $7, parameters = $8, examples = $9, tags = $10, is_deprecated = COALESCE($11, is_deprecated), updated_at = CURRENT_TIMESTAMP
		WHERE endpoint_id = $1
		RETURNING endpoint_id, doc_id, method, path, summary, description, request_body_schema, response_schema, parameters, examples, tags, is_deprecated, created_at, updated_at
	`

	var endpoint model.APIEndpoint
	var requestBodySchemaBytes, responseSchemaBytes, parametersBytes, examplesBytes []byte
	var tags pq.StringArray

	err := s.db.QueryRow(query, endpointID, req.Method, req.Path, req.Summary, req.Description,
		requestBodySchema, responseSchema, parameters, examples, pq.Array(req.Tags), req.IsDeprecated).Scan(
		&endpoint.EndpointID, &endpoint.DocID, &endpoint.Method, &endpoint.Path,
		&endpoint.Summary, &endpoint.Description, &requestBodySchemaBytes, &responseSchemaBytes,
		&parametersBytes, &examplesBytes, &tags, &endpoint.IsDeprecated,
		&endpoint.CreatedAt, &endpoint.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("API endpoint not found")
		}
		return nil, fmt.Errorf("failed to update API endpoint: %w", err)
	}

	// 反序列化JSON字段
	if len(requestBodySchemaBytes) > 0 {
		json.Unmarshal(requestBodySchemaBytes, &endpoint.RequestBodySchema)
	}
	if len(responseSchemaBytes) > 0 {
		json.Unmarshal(responseSchemaBytes, &endpoint.ResponseSchema)
	}
	if len(parametersBytes) > 0 {
		json.Unmarshal(parametersBytes, &endpoint.Parameters)
	}
	if len(examplesBytes) > 0 {
		json.Unmarshal(examplesBytes, &endpoint.Examples)
	}
	endpoint.Tags = []string(tags)

	return &endpoint, nil
}

// DeleteAPIEndpoint 删除API端点文档
func (s *APIDocumentationStore) DeleteAPIEndpoint(endpointID int64) error {
	query := `DELETE FROM api_endpoints WHERE endpoint_id = $1`

	result, err := s.db.Exec(query, endpointID)
	if err != nil {
		return fmt.Errorf("failed to delete API endpoint: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("API endpoint not found")
	}

	return nil
}

// GetAPIDocumentationWithEndpoints 获取包含端点的完整API文档
func (s *APIDocumentationStore) GetAPIDocumentationWithEndpoints(serviceID int64) (*model.APIDocumentationResponse, error) {
	// 获取文档基本信息
	doc, err := s.GetAPIDocumentationByServiceID(serviceID)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, nil
	}

	// 获取端点信息
	endpoints, err := s.GetAPIEndpointsByDocID(doc.DocID)
	if err != nil {
		return nil, err
	}

	response := &model.APIDocumentationResponse{
		DocID:       doc.DocID,
		ServiceID:   doc.ServiceID,
		Title:       doc.Title,
		Description: doc.Description,
		Content:     doc.Content,
		Version:     doc.Version,
		IsPublished: doc.IsPublished,
		Endpoints:   endpoints,
		CreatedAt:   doc.CreatedAt,
		UpdatedAt:   doc.UpdatedAt,
	}

	return response, nil
}