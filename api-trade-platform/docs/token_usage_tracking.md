# Token使用统计功能

## 概述

本功能为API交易平台添加了详细的token使用统计和成本计算能力，支持对AI API调用的token消耗进行精确跟踪和费用计算。

## 功能特性

### 1. Token使用跟踪
- **输入Token统计**: 记录每次API调用的输入token数量
- **输出Token统计**: 记录每次API调用的输出token数量
- **总Token统计**: 自动计算总token使用量
- **模型识别**: 自动识别使用的AI模型名称

### 2. 成本计算
- **实时费用计算**: 基于不同模型的定价自动计算token使用费用
- **多模型支持**: 内置主流AI模型定价（GPT-3.5, GPT-4, Claude等）
- **灵活定价**: 支持自定义模型定价配置

### 3. 数据统计
- **用户级统计**: 按买家用户统计token使用情况
- **API级统计**: 按API服务统计token消耗
- **时间段统计**: 支持日/月等不同时间段的统计
- **请求大小跟踪**: 记录请求和响应的字节大小

## 数据库结构

### usage_logs表新增字段

```sql
-- Token相关字段
input_tokens INTEGER DEFAULT 0,           -- 输入token数量
output_tokens INTEGER DEFAULT 0,          -- 输出token数量
total_tokens INTEGER DEFAULT 0,           -- 总token数量
token_cost DECIMAL(10,6) DEFAULT 0.0,     -- token使用费用（美元）
model_name VARCHAR(100),                   -- 使用的AI模型名称
request_size_bytes INTEGER DEFAULT 0,     -- 请求体大小（字节）
response_size_bytes INTEGER DEFAULT 0;    -- 响应体大小（字节）
```

## API响应格式

### 使用统计响应

```json
{
  "calls_made": 150,
  "total_tokens": 45000,
  "indicative_cost": 0.675,
  "usage_details_by_api": [
    {
      "api_service_id": 1,
      "api_service_name": "GPT-4 Chat API",
      "calls": 50,
      "total_tokens": 25000,
      "token_cost": 0.5
    },
    {
      "api_service_id": 2,
      "api_service_name": "GPT-3.5 Turbo API",
      "calls": 100,
      "total_tokens": 20000,
      "token_cost": 0.175
    }
  ],
  "period": "monthly"
}
```

## 支持的AI模型定价

### OpenAI模型
- **GPT-4**: $0.03/1K输入tokens, $0.06/1K输出tokens
- **GPT-4-32k**: $0.06/1K输入tokens, $0.12/1K输出tokens
- **GPT-3.5-turbo**: $0.0015/1K输入tokens, $0.002/1K输出tokens
- **GPT-3.5-turbo-16k**: $0.003/1K输入tokens, $0.004/1K输出tokens

### Anthropic模型
- **Claude-3-opus**: $0.015/1K输入tokens, $0.075/1K输出tokens
- **Claude-3-sonnet**: $0.003/1K输入tokens, $0.015/1K输出tokens
- **Claude-3-haiku**: $0.00025/1K输入tokens, $0.00125/1K输出tokens

### Google模型
- **Gemini-pro**: $0.0005/1K输入tokens, $0.0015/1K输出tokens

## 使用方法

### 1. 数据库迁移

```bash
# 执行迁移脚本
psql -d your_database -f db/migrations/add_token_fields_to_usage_logs.sql
```

### 2. 获取用户使用统计

```bash
# 获取月度统计
GET /api/v1/usage/summary?period=monthly

# 获取日统计
GET /api/v1/usage/summary?period=daily
```

### 3. 查看详细使用记录

使用统计API会自动包含token使用信息，无需额外配置。

## 技术实现

### 1. Token解析器

位置: `internal/utils/token_parser.go`

- 支持JSON和正则表达式两种解析方式
- 自动识别响应中的token使用信息
- 内置多种AI模型的定价配置

### 2. 代理中间件集成

在`ProxyToSellerService`函数中集成:
- 请求体读取和缓存
- 响应体解析
- Token使用信息提取
- 成本计算和记录

### 3. 数据存储

- 扩展`UsageLog`模型支持token字段
- 更新数据库存储逻辑
- 优化查询性能（添加索引）

## 性能优化

### 1. 数据库索引

```sql
-- Token成本分析索引
CREATE INDEX idx_usage_logs_token_cost ON usage_logs(token_cost);

-- 模型使用分析索引
CREATE INDEX idx_usage_logs_model_name ON usage_logs(model_name);

-- 买家Token使用查询索引
CREATE INDEX idx_usage_logs_buyer_tokens ON usage_logs(buyer_user_id, request_timestamp, total_tokens);
```

### 2. 异步处理

- Token解析和成本计算在后台异步执行
- 不影响API代理的响应时间
- 使用goroutine处理日志记录

## 扩展性

### 1. 自定义模型定价

可以通过修改`token_parser.go`中的`modelPricing`映射来添加新的模型定价:

```go
modelPricing := map[string]ModelPricing{
    "your-custom-model": {
        InputCostPer1K:  0.001,
        OutputCostPer1K: 0.002,
    },
}
```

### 2. 新的解析规则

可以添加新的正则表达式规则来支持不同格式的API响应:

```go
regexPatterns := []TokenRegexPattern{
    {
        InputTokens:  regexp.MustCompile(`"input_tokens":\s*(\d+)`),
        OutputTokens: regexp.MustCompile(`"output_tokens":\s*(\d+)`),
        TotalTokens:  regexp.MustCompile(`"total_tokens":\s*(\d+)`),
        ModelName:    regexp.MustCompile(`"model":\s*"([^"]+)"`),
    },
}
```

## 监控和告警

建议设置以下监控指标:

1. **Token使用量异常**: 监控单次调用token使用量是否超过阈值
2. **成本异常**: 监控用户费用是否异常增长
3. **解析失败率**: 监控token信息解析的成功率
4. **模型使用分布**: 监控不同模型的使用情况

## 故障排除

### 1. Token解析失败

- 检查API响应格式是否符合预期
- 验证正则表达式是否正确
- 查看日志中的解析错误信息

### 2. 成本计算错误

- 确认模型名称是否正确识别
- 检查定价配置是否最新
- 验证token数量是否正确解析

### 3. 性能问题

- 检查数据库索引是否正确创建
- 监控异步处理的队列长度
- 优化查询语句的执行计划