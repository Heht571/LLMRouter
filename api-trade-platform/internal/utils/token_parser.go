package utils

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// TokenUsage represents token usage information
type TokenUsage struct {
	InputTokens  int     `json:"input_tokens"`
	OutputTokens int     `json:"output_tokens"`
	TotalTokens  int     `json:"total_tokens"`
	ModelName    string  `json:"model_name"`
	Cost         float64 `json:"cost"`
}

// TokenParser handles parsing token usage from different AI API responses
type TokenParser struct {
	// Token pricing per 1K tokens for different models
	ModelPricing map[string]ModelPricing
}

// ModelPricing represents pricing for input and output tokens
type ModelPricing struct {
	InputPricePer1K  float64 `json:"input_price_per_1k"`
	OutputPricePer1K float64 `json:"output_price_per_1k"`
}

// NewTokenParser creates a new token parser with default pricing
func NewTokenParser() *TokenParser {
	return &TokenParser{
		ModelPricing: map[string]ModelPricing{
			// OpenAI GPT models
			"gpt-4": {
				InputPricePer1K:  0.03,
				OutputPricePer1K: 0.06,
			},
			"gpt-4-turbo": {
				InputPricePer1K:  0.01,
				OutputPricePer1K: 0.03,
			},
			"gpt-3.5-turbo": {
				InputPricePer1K:  0.0015,
				OutputPricePer1K: 0.002,
			},
			// Anthropic Claude models
			"claude-3-opus": {
				InputPricePer1K:  0.015,
				OutputPricePer1K: 0.075,
			},
			"claude-3-sonnet": {
				InputPricePer1K:  0.003,
				OutputPricePer1K: 0.015,
			},
			"claude-3-haiku": {
				InputPricePer1K:  0.00025,
				OutputPricePer1K: 0.00125,
			},
			// Default pricing for unknown models
			"default": {
				InputPricePer1K:  0.001,
				OutputPricePer1K: 0.002,
			},
		},
	}
}

// ParseTokenUsage extracts token usage from API response body
func (tp *TokenParser) ParseTokenUsage(responseBody []byte, modelName string) (*TokenUsage, error) {
	// Try to parse as JSON first
	if usage, err := tp.parseJSONResponse(responseBody, modelName); err == nil {
		return usage, nil
	}

	// Fallback to regex parsing for non-JSON responses
	return tp.parseWithRegex(responseBody, modelName)
}

// parseJSONResponse parses token usage from JSON response
func (tp *TokenParser) parseJSONResponse(responseBody []byte, modelName string) (*TokenUsage, error) {
	var response map[string]interface{}
	if err := json.Unmarshal(responseBody, &response); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	usage := &TokenUsage{ModelName: modelName}

	// OpenAI format
	if usageData, ok := response["usage"].(map[string]interface{}); ok {
		if promptTokens, ok := usageData["prompt_tokens"].(float64); ok {
			usage.InputTokens = int(promptTokens)
		}
		if completionTokens, ok := usageData["completion_tokens"].(float64); ok {
			usage.OutputTokens = int(completionTokens)
		}
		if totalTokens, ok := usageData["total_tokens"].(float64); ok {
			usage.TotalTokens = int(totalTokens)
		}
	}

	// Anthropic Claude format
	if usageData, ok := response["usage"].(map[string]interface{}); ok {
		if inputTokens, ok := usageData["input_tokens"].(float64); ok {
			usage.InputTokens = int(inputTokens)
		}
		if outputTokens, ok := usageData["output_tokens"].(float64); ok {
			usage.OutputTokens = int(outputTokens)
		}
	}

	// Calculate total if not provided
	if usage.TotalTokens == 0 {
		usage.TotalTokens = usage.InputTokens + usage.OutputTokens
	}

	// Calculate cost
	usage.Cost = tp.calculateCost(usage.InputTokens, usage.OutputTokens, modelName)

	if usage.InputTokens == 0 && usage.OutputTokens == 0 {
		return nil, fmt.Errorf("no token usage found in response")
	}

	return usage, nil
}

// parseWithRegex parses token usage using regex patterns
func (tp *TokenParser) parseWithRegex(responseBody []byte, modelName string) (*TokenUsage, error) {
	responseStr := string(responseBody)
	usage := &TokenUsage{ModelName: modelName}

	// Common regex patterns for token usage
	patterns := []struct {
		name    string
		pattern string
		field   *int
	}{
		{"input_tokens", `"input_tokens"\s*:\s*(\d+)`, &usage.InputTokens},
		{"output_tokens", `"output_tokens"\s*:\s*(\d+)`, &usage.OutputTokens},
		{"prompt_tokens", `"prompt_tokens"\s*:\s*(\d+)`, &usage.InputTokens},
		{"completion_tokens", `"completion_tokens"\s*:\s*(\d+)`, &usage.OutputTokens},
		{"total_tokens", `"total_tokens"\s*:\s*(\d+)`, &usage.TotalTokens},
	}

	for _, p := range patterns {
		re := regexp.MustCompile(p.pattern)
		if matches := re.FindStringSubmatch(responseStr); len(matches) > 1 {
			if val, err := strconv.Atoi(matches[1]); err == nil {
				*p.field = val
			}
		}
	}

	// Calculate total if not found
	if usage.TotalTokens == 0 {
		usage.TotalTokens = usage.InputTokens + usage.OutputTokens
	}

	// Calculate cost
	usage.Cost = tp.calculateCost(usage.InputTokens, usage.OutputTokens, modelName)

	if usage.InputTokens == 0 && usage.OutputTokens == 0 {
		return nil, fmt.Errorf("no token usage found in response")
	}

	return usage, nil
}

// calculateCost calculates the cost based on token usage and model pricing
func (tp *TokenParser) calculateCost(inputTokens, outputTokens int, modelName string) float64 {
	pricing, exists := tp.ModelPricing[modelName]
	if !exists {
		// Use default pricing for unknown models
		pricing = tp.ModelPricing["default"]
	}

	inputCost := float64(inputTokens) / 1000.0 * pricing.InputPricePer1K
	outputCost := float64(outputTokens) / 1000.0 * pricing.OutputPricePer1K

	return inputCost + outputCost
}

// ExtractModelName attempts to extract model name from request or response
func (tp *TokenParser) ExtractModelName(requestBody, responseBody []byte) string {
	// Try to extract from request body first
	if model := tp.extractModelFromJSON(requestBody); model != "" {
		return model
	}

	// Try to extract from response body
	if model := tp.extractModelFromJSON(responseBody); model != "" {
		return model
	}

	// Try regex patterns
	if model := tp.extractModelWithRegex(string(requestBody)); model != "" {
		return model
	}

	if model := tp.extractModelWithRegex(string(responseBody)); model != "" {
		return model
	}

	return "unknown"
}

// extractModelFromJSON extracts model name from JSON data
func (tp *TokenParser) extractModelFromJSON(data []byte) string {
	var jsonData map[string]interface{}
	if err := json.Unmarshal(data, &jsonData); err != nil {
		return ""
	}

	if model, ok := jsonData["model"].(string); ok {
		return model
	}

	return ""
}

// extractModelWithRegex extracts model name using regex
func (tp *TokenParser) extractModelWithRegex(text string) string {
	patterns := []string{
		`"model"\s*:\s*"([^"]+)"`,
		`model=([a-zA-Z0-9\-_]+)`,
		`/v1/([a-zA-Z0-9\-_]+)/`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		if matches := re.FindStringSubmatch(text); len(matches) > 1 {
			return strings.TrimSpace(matches[1])
		}
	}

	return ""
}