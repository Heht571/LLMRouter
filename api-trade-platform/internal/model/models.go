package model

import (
	"time"
)

// User 代表系统中的用户 (卖家或买家)
// @Description 用户基础信息模型
type User struct {
	UserID       int64     `json:"user_id" example:"1" description:"用户唯一标识符"`
	Username     string    `json:"username" example:"john_doe" description:"用户名，3-50字符"`
	PasswordHash string    `json:"-"` // 不应在 API 响应中直接返回密码哈希
	Email        string    `json:"email" example:"john@example.com" description:"用户邮箱地址"`
	Role         string    `json:"role" example:"seller" enums:"seller,buyer" description:"用户角色：seller(卖家) 或 buyer(买家)"`
	CreatedAt    time.Time `json:"created_at" example:"2024-01-01T00:00:00Z" description:"账户创建时间"`
	UpdatedAt    time.Time `json:"updated_at" example:"2024-01-01T00:00:00Z" description:"账户最后更新时间"`
}

// APIService 代表由卖家注册的 API 服务
// @Description API服务信息模型，包含服务基础信息、定价策略和统计数据
type APIService struct {
	ServiceID                int64     `json:"service_id" example:"1" description:"API服务唯一标识符"`
	SellerUserID             int64     `json:"seller_user_id" example:"1" description:"卖家用户ID"`
	Name                     string    `json:"name" example:"Weather API" description:"API服务名称"`
	Description              string    `json:"description,omitempty" example:"提供全球天气数据查询服务" description:"API服务描述"`
	OriginalEndpointURL      string    `json:"original_endpoint_url" example:"https://api.weather.com/v1" description:"卖家原始API的基础URL"`
	EncryptedOriginalAPIKey  string    `json:"-"` // 加密存储的卖家原始 API 密钥，不通过 API 返回
	PlatformProxyPrefix      string    `json:"platform_proxy_prefix" example:"/proxy/v1/weather-api" description:"平台生成的代理URL前缀"`
	IsActive                 bool      `json:"is_active" example:"true" description:"服务是否激活"`
	// API市场扩展字段
	Category                 string    `json:"category,omitempty" example:"weather" description:"API分类"`
	Rating                   float64   `json:"rating,omitempty" example:"4.5" description:"平均评分(0-5)"`
	ReviewCount              int64     `json:"review_count,omitempty" example:"128" description:"评价数量"`
	PricePerCall             float64   `json:"price_per_call,omitempty" example:"0.01" description:"每次调用价格(USD)"`
	// 新增定价字段
	PricingModel             string    `json:"pricing_model,omitempty" example:"per_call" enums:"per_call,per_token" description:"定价模式"`
	PricePerToken            float64   `json:"price_per_token,omitempty" example:"0.001" description:"每token价格(USD)"`
	TotalCalls               int64     `json:"total_calls,omitempty" example:"10000" description:"总调用次数"`
	SubscriberCount          int64     `json:"subscriber_count,omitempty" example:"50" description:"订阅者数量"`
	Features                 string    `json:"features,omitempty" example:"[\"real-time\",\"global\"]" description:"特性标签JSON数组字符串"`
	Documentation            string    `json:"documentation,omitempty" description:"API文档内容(Markdown格式)"`
	CreatedAt                time.Time `json:"created_at" example:"2024-01-01T00:00:00Z" description:"服务创建时间"`
	UpdatedAt                time.Time `json:"updated_at" example:"2024-01-01T00:00:00Z" description:"服务最后更新时间"`
}

// PlatformAPIKey 代表由平台为买家生成的 API 密钥，用于访问特定的 API 服务
type PlatformAPIKey struct {
	KeyID          int64      `json:"key_id"`
	BuyerUserID    int64      `json:"buyer_user_id"`
	ServiceID      int64      `json:"service_id"`
	PlatformAPIKey string     `json:"platform_api_key"` // 平台生成的 API 密钥
	IsActive       bool       `json:"is_active"`
	ExpiresAt      *time.Time `json:"expires_at,omitempty"` // 密钥过期时间 (可选)
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// UsageLog 代表一次 API 调用的使用日志
type UsageLog struct {
	LogID              int64     `json:"log_id"`
	PlatformAPIKeyID   int64     `json:"platform_api_key_id"`
	BuyerUserID        int64     `json:"buyer_user_id"`
	APIServiceID       int64     `json:"api_service_id"`
	SellerUserID       int64     `json:"seller_user_id"`
	RequestTimestamp   time.Time `json:"request_timestamp"`
	ResponseStatusCode int       `json:"response_status_code"`
	IsSuccess          bool      `json:"is_success"`
	RequestPath        string    `json:"request_path"`
	RequestMethod      string    `json:"request_method"`
	ProcessingTimeMs   int       `json:"processing_time_ms"`
	// Token usage tracking fields
	InputTokens        int       `json:"input_tokens"`
	OutputTokens       int       `json:"output_tokens"`
	TotalTokens        int       `json:"total_tokens"`
	Cost               float64   `json:"cost"`                // Cost in USD for this API call
	ModelName          string    `json:"model_name,omitempty"`
	RequestSizeBytes   int       `json:"request_size_bytes"`
	ResponseSizeBytes  int       `json:"response_size_bytes"`
}

// --- 请求和响应结构体 (用于 API handlers) ---

// UserRegistrationRequest 用户注册请求体
// @Description 用户注册请求参数
type UserRegistrationRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50" example:"john_doe" description:"用户名，3-50字符，只能包含字母、数字和下划线"`
	Password string `json:"password" binding:"required,min=8,max=100" example:"SecurePass123!" description:"密码，8-100字符，建议包含大小写字母、数字和特殊字符"`
	Email    string `json:"email" binding:"required,email" example:"john@example.com" description:"有效的邮箱地址"`
	Role     string `json:"role" binding:"required,oneof=seller buyer" example:"seller" enums:"seller,buyer" description:"用户角色：seller(卖家) 或 buyer(买家)"`
}

// UserLoginRequest 用户登录请求体
// @Description 用户登录请求参数
type UserLoginRequest struct {
	Username string `json:"username" binding:"required" example:"john_doe" description:"用户名或邮箱地址"`
	Password string `json:"password" binding:"required" example:"SecurePass123!" description:"用户密码"`
}

// UserLoginResponse 用户登录响应体
// @Description 用户登录成功响应
type UserLoginResponse struct {
	Token string `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." description:"JWT访问令牌，用于后续API调用认证"`
}

// UserResponse 用户信息响应体 (不含密码)
// @Description 用户基础信息响应
type UserResponse struct {
	UserID   int64  `json:"user_id" example:"1" description:"用户唯一标识符"`
	Username string `json:"username" example:"john_doe" description:"用户名"`
	Email    string `json:"email" example:"john@example.com" description:"用户邮箱地址"`
	Role     string `json:"role" example:"seller" enums:"seller,buyer" description:"用户角色"`
}

// RegisterAPIServiceRequest 注册 API 服务请求体
// @Description 卖家注册新API服务的请求参数
type RegisterAPIServiceRequest struct {
	Name                string `json:"name" binding:"required,max=255" example:"Weather API" description:"API服务名称，最大255字符"`
	Description         string `json:"description" example:"提供全球天气数据查询服务" description:"API服务描述"`
	OriginalEndpointURL string `json:"original_endpoint_url" binding:"required,url" example:"https://api.weather.com/v1" description:"卖家原始API的基础URL，必须是有效的URL格式"`
	OriginalAPIKey      string `json:"original_api_key" binding:"required" example:"sk-1234567890abcdef" description:"卖家原始API密钥，将被加密存储"`
}

// UpdateAPIServiceRequest 更新 API 服务请求体
// @Description 卖家更新已注册API服务的请求参数
type UpdateAPIServiceRequest struct {
	Name                string `json:"name" binding:"required,max=255" example:"Weather API Pro" description:"API服务名称，最大255字符"`
	Description         string `json:"description" example:"提供全球天气数据查询服务，包含预报功能" description:"API服务描述"`
	OriginalEndpointURL string `json:"original_endpoint_url" binding:"required,url" example:"https://api.weather.com/v2" description:"卖家原始API的基础URL"`
	OriginalAPIKey      string `json:"original_api_key,omitempty" example:"sk-new1234567890abcdef" description:"卖家原始API密钥，可选，如果提供则更新"`
	IsActive            *bool  `json:"is_active,omitempty" example:"true" description:"服务是否激活，可选"`
	Documentation       string `json:"documentation,omitempty" description:"API文档内容，Markdown格式，可选"`
}

// UpdateAPIPricingRequest 更新 API 定价请求体
// @Description 卖家更新API服务定价策略的请求参数
type UpdateAPIPricingRequest struct {
	PricingModel  string  `json:"pricing_model" binding:"required,oneof=per_call per_token" example:"per_call" enums:"per_call,per_token" description:"定价模式：per_call(按调用次数) 或 per_token(按token数量)"`
	PricePerCall  float64 `json:"price_per_call,omitempty" example:"0.01" description:"每次调用价格(USD)，当pricing_model为per_call时必填"`
	PricePerToken float64 `json:"price_per_token,omitempty" example:"0.001" description:"每token价格(USD)，当pricing_model为per_token时必填"`
}

// APIServiceResponse API 服务信息响应体
type APIServiceResponse struct {
	ServiceID           int64     `json:"service_id"`
	Name                string    `json:"name"`
	Description         string    `json:"description,omitempty"`
	PlatformProxyPrefix string    `json:"platform_proxy_prefix"`
	IsActive            bool      `json:"is_active"`
	SellerUsername      string    `json:"seller_username,omitempty"` // 用于买家列表展示
	// API市场扩展字段
	Category            string    `json:"category,omitempty"`
	Rating              float64   `json:"rating,omitempty"`
	ReviewCount         int64     `json:"review_count,omitempty"`
	PricePerCall        float64   `json:"price_per_call,omitempty"`
	PricingModel        string    `json:"pricing_model,omitempty"`
	PricePerToken       float64   `json:"price_per_token,omitempty"`
	TotalCalls          int64     `json:"total_calls,omitempty"`
	SubscriberCount     int64     `json:"subscriber_count,omitempty"`
	Features            []string  `json:"features,omitempty"`          // 解析后的特性数组
	Documentation       string    `json:"documentation,omitempty"`
}

// APIServiceDetailResponse API 服务详情响应体（包含完整信息）
type APIServiceDetailResponse struct {
	APIServiceResponse
	IsSubscribed        bool      `json:"is_subscribed"`        // 当前买家是否已订阅
	SubscriptionDate    *time.Time `json:"subscription_date,omitempty"` // 订阅日期
	PlatformAPIKey      string    `json:"platform_api_key,omitempty"` // 如果已订阅，返回平台密钥
}

// SubscribeToAPIResponse 订阅 API 响应体
type SubscribeToAPIResponse struct {
	PlatformAPIKey string `json:"platform_api_key"`
	PlatformProxyURL string `json:"platform_proxy_url"` // 完整的代理 URL 示例
}

// UsageSummaryResponse 买家使用情况概要响应体
type UsageSummaryResponse struct {
	CallsMade           int64               `json:"calls_made"`
	TotalTokens         int64               `json:"total_tokens"`
	IndicativeCost      float64             `json:"indicative_cost"` // 基于实际token使用的费用
	UsageDetailsByAPI   []APICallDetail     `json:"usage_details_by_api,omitempty"`
	Period              string              `json:"period"` // e.g., "monthly", "daily"
}

// APICallDetail 单个 API 的调用详情
type APICallDetail struct {
	APIServiceID   int64   `json:"api_service_id"`
	APIServiceName string  `json:"api_service_name"`
	Calls          int64   `json:"calls"`
	TotalTokens    int64   `json:"total_tokens"`
	Cost           float64 `json:"cost"`
}

// APIDocumentation 代表API服务的文档
type APIDocumentation struct {
	DocID       int64     `json:"doc_id"`
	ServiceID   int64     `json:"service_id"`
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	Content     string    `json:"content"`     // Markdown内容
	Version     string    `json:"version"`
	IsPublished bool      `json:"is_published"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// APIEndpoint 代表API端点的详细文档
type APIEndpoint struct {
	EndpointID        int64                  `json:"endpoint_id"`
	DocID             int64                  `json:"doc_id"`
	Method            string                 `json:"method"`
	Path              string                 `json:"path"`
	Summary           string                 `json:"summary,omitempty"`
	Description       string                 `json:"description,omitempty"`
	RequestBodySchema map[string]interface{} `json:"request_body_schema,omitempty"`
	ResponseSchema    map[string]interface{} `json:"response_schema,omitempty"`
	Parameters        []APIParameter         `json:"parameters,omitempty"`
	Examples          map[string]interface{} `json:"examples,omitempty"`
	Tags              []string               `json:"tags,omitempty"`
	IsDeprecated      bool                   `json:"is_deprecated"`
	CreatedAt         time.Time              `json:"created_at"`
	UpdatedAt         time.Time              `json:"updated_at"`
}

// APIParameter 代表API参数
type APIParameter struct {
	Name        string      `json:"name"`
	In          string      `json:"in"` // query, header, path, body
	Type        string      `json:"type"`
	Description string      `json:"description,omitempty"`
	Required    bool        `json:"required"`
	Default     interface{} `json:"default,omitempty"`
	Example     interface{} `json:"example,omitempty"`
}

// --- API文档相关的请求和响应结构体 ---

// CreateAPIDocumentationRequest 创建API文档请求体
type CreateAPIDocumentationRequest struct {
	Title       string `json:"title" binding:"required,max=255"`
	Description string `json:"description"`
	Content     string `json:"content" binding:"required"`
	Version     string `json:"version"`
	IsPublished bool   `json:"is_published"`
}

// UpdateAPIDocumentationRequest 更新API文档请求体
type UpdateAPIDocumentationRequest struct {
	Title       string `json:"title" binding:"required,max=255"`
	Description string `json:"description"`
	Content     string `json:"content" binding:"required"`
	Version     string `json:"version"`
	IsPublished *bool  `json:"is_published,omitempty"`
}

// CreateAPIEndpointRequest 创建API端点文档请求体
type CreateAPIEndpointRequest struct {
	Method            string                 `json:"method" binding:"required,oneof=GET POST PUT DELETE PATCH HEAD OPTIONS"`
	Path              string                 `json:"path" binding:"required,max=500"`
	Summary           string                 `json:"summary"`
	Description       string                 `json:"description"`
	RequestBodySchema map[string]interface{} `json:"request_body_schema"`
	ResponseSchema    map[string]interface{} `json:"response_schema"`
	Parameters        []APIParameter         `json:"parameters"`
	Examples          map[string]interface{} `json:"examples"`
	Tags              []string               `json:"tags"`
	IsDeprecated      bool                   `json:"is_deprecated"`
}

// UpdateAPIEndpointRequest 更新API端点文档请求体
type UpdateAPIEndpointRequest struct {
	Method            string                 `json:"method" binding:"required,oneof=GET POST PUT DELETE PATCH HEAD OPTIONS"`
	Path              string                 `json:"path" binding:"required,max=500"`
	Summary           string                 `json:"summary"`
	Description       string                 `json:"description"`
	RequestBodySchema map[string]interface{} `json:"request_body_schema"`
	ResponseSchema    map[string]interface{} `json:"response_schema"`
	Parameters        []APIParameter         `json:"parameters"`
	Examples          map[string]interface{} `json:"examples"`
	Tags              []string               `json:"tags"`
	IsDeprecated      *bool                  `json:"is_deprecated,omitempty"`
}

// APIDocumentationResponse API文档响应体
type APIDocumentationResponse struct {
	DocID       int64          `json:"doc_id"`
	ServiceID   int64          `json:"service_id"`
	Title       string         `json:"title"`
	Description string         `json:"description,omitempty"`
	Content     string         `json:"content"`
	Version     string         `json:"version"`
	IsPublished bool           `json:"is_published"`
	Endpoints   []APIEndpoint  `json:"endpoints,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

// UserProfile 代表用户的扩展个人资料信息
type UserProfile struct {
	ProfileID    int64     `json:"profile_id"`
	UserID       int64     `json:"user_id"`
	DisplayName  string    `json:"display_name,omitempty"`  // 显示名称
	AvatarURL    string    `json:"avatar_url,omitempty"`    // 头像URL
	Bio          string    `json:"bio,omitempty"`           // 个人简介
	PhoneNumber  string    `json:"phone_number,omitempty"`  // 电话号码
	Company      string    `json:"company,omitempty"`       // 公司名称
	Website      string    `json:"website,omitempty"`       // 个人网站
	Location     string    `json:"location,omitempty"`      // 所在地区
	Timezone     string    `json:"timezone,omitempty"`      // 时区
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// UserSettings 代表用户的偏好设置
type UserSettings struct {
	SettingsID           int64     `json:"settings_id"`
	UserID               int64     `json:"user_id"`
	Language             string    `json:"language"`                        // 语言偏好，默认"zh-CN"
	EmailNotifications   bool      `json:"email_notifications"`             // 邮件通知开关
	SMSNotifications     bool      `json:"sms_notifications"`               // 短信通知开关
	MarketingEmails      bool      `json:"marketing_emails"`                // 营销邮件开关
	APIUsageAlerts       bool      `json:"api_usage_alerts"`                // API使用量警告
	SecurityAlerts       bool      `json:"security_alerts"`                 // 安全警告
	Theme                string    `json:"theme"`                           // 主题偏好："light", "dark", "auto"
	DateFormat           string    `json:"date_format"`                     // 日期格式偏好
	Currency             string    `json:"currency"`                        // 货币偏好，默认"USD"
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// UserSecurity 代表用户的安全设置
type UserSecurity struct {
	SecurityID           int64      `json:"security_id"`
	UserID               int64      `json:"user_id"`
	TwoFactorEnabled     bool       `json:"two_factor_enabled"`              // 两步验证开关
	TwoFactorSecret      string     `json:"-"`                               // 两步验证密钥，不返回给前端
	BackupCodes          string     `json:"-"`                               // 备用验证码，JSON数组字符串
	LastPasswordChange   *time.Time `json:"last_password_change,omitempty"`  // 最后修改密码时间
	PasswordExpiryDays   int        `json:"password_expiry_days"`            // 密码过期天数，0表示不过期
	LoginNotifications   bool       `json:"login_notifications"`             // 登录通知开关
	SessionTimeout       int        `json:"session_timeout"`                 // 会话超时时间(分钟)
	AllowedIPRanges      string     `json:"allowed_ip_ranges,omitempty"`     // 允许的IP范围，JSON数组字符串
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

// --- 账户设置相关的请求和响应结构体 ---

// UpdateUserProfileRequest 更新用户个人资料请求体
type UpdateUserProfileRequest struct {
	DisplayName string `json:"display_name" binding:"max=100"`
	AvatarURL   string `json:"avatar_url" binding:"omitempty,url"`
	Bio         string `json:"bio" binding:"max=500"`
	PhoneNumber string `json:"phone_number" binding:"max=20"`
	Company     string `json:"company" binding:"max=100"`
	Website     string `json:"website" binding:"omitempty,url"`
	Location    string `json:"location" binding:"max=100"`
	Timezone    string `json:"timezone" binding:"max=50"`
}

// UpdateUserSettingsRequest 更新用户设置请求体
type UpdateUserSettingsRequest struct {
	Language           string `json:"language" binding:"max=10"`
	EmailNotifications *bool  `json:"email_notifications,omitempty"`
	SMSNotifications   *bool  `json:"sms_notifications,omitempty"`
	MarketingEmails    *bool  `json:"marketing_emails,omitempty"`
	APIUsageAlerts     *bool  `json:"api_usage_alerts,omitempty"`
	SecurityAlerts     *bool  `json:"security_alerts,omitempty"`
	Theme              string `json:"theme" binding:"omitempty,oneof=light dark auto"`
	DateFormat         string `json:"date_format" binding:"max=20"`
	Currency           string `json:"currency" binding:"max=10"`
}

// UpdateUserSecurityRequest 更新用户安全设置请求体
type UpdateUserSecurityRequest struct {
	TwoFactorEnabled   *bool  `json:"two_factor_enabled,omitempty"`
	PasswordExpiryDays *int   `json:"password_expiry_days,omitempty"`
	LoginNotifications *bool  `json:"login_notifications,omitempty"`
	SessionTimeout     *int   `json:"session_timeout,omitempty"`
	AllowedIPRanges    string `json:"allowed_ip_ranges,omitempty"`
}

// ChangePasswordRequest 修改密码请求体
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8,max=100"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
}

// UserAccountResponse 用户账户信息完整响应体
type UserAccountResponse struct {
	User     UserResponse  `json:"user"`
	Profile  *UserProfile  `json:"profile,omitempty"`
	Settings *UserSettings `json:"settings,omitempty"`
	Security *UserSecurity `json:"security,omitempty"`
}

// ErrorResponse represents a generic error response body
// @Description 标准错误响应格式
type ErrorResponse struct {
	Code    int    `json:"code" example:"400" description:"HTTP状态码"`
	Message string `json:"message" example:"Invalid request parameters" description:"错误详细信息"`
	Details string `json:"details,omitempty" example:"Field 'username' is required" description:"错误详细描述，可选"`
}