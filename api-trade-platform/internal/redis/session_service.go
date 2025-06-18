package redis

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

// SessionService 会话管理服务
type SessionService struct {
	redisClient *RedisClient
}

// SessionData 会话数据结构
type SessionData struct {
	UserID    int64     `json:"user_id"`
	Username  string    `json:"username"`
	UserType  string    `json:"user_type"`
	LoginTime time.Time `json:"login_time"`
	LastSeen  time.Time `json:"last_seen"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
}

// NewSessionService 创建会话服务实例
func NewSessionService(redisClient *RedisClient) *SessionService {
	return &SessionService{
		redisClient: redisClient,
	}
}

// CreateSession 创建用户会话
func (s *SessionService) CreateSession(userID int64, username, userType, ipAddress, userAgent string, expiration time.Duration) (string, error) {
	sessionID := fmt.Sprintf("session:%d:%d", userID, time.Now().Unix())
	
	sessionData := SessionData{
		UserID:    userID,
		Username:  username,
		UserType:  userType,
		LoginTime: time.Now(),
		LastSeen:  time.Now(),
		IPAddress: ipAddress,
		UserAgent: userAgent,
	}

	data, err := json.Marshal(sessionData)
	if err != nil {
		return "", fmt.Errorf("failed to marshal session data: %w", err)
	}

	if err := s.redisClient.Set(sessionID, data, expiration); err != nil {
		return "", fmt.Errorf("failed to create session: %w", err)
	}

	// 添加到用户活跃会话列表
	userSessionsKey := fmt.Sprintf("user_sessions:%d", userID)
	if err := s.redisClient.client.SAdd(s.redisClient.ctx, userSessionsKey, sessionID).Err(); err != nil {
		return "", fmt.Errorf("failed to add session to user list: %w", err)
	}

	// 设置用户会话列表过期时间
	if err := s.redisClient.Expire(userSessionsKey, expiration+time.Hour); err != nil {
		return "", fmt.Errorf("failed to set user sessions expiration: %w", err)
	}

	return sessionID, nil
}

// GetSession 获取会话信息
func (s *SessionService) GetSession(sessionID string) (*SessionData, error) {
	data, err := s.redisClient.Get(sessionID)
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("session not found")
		}
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	var sessionData SessionData
	if err := json.Unmarshal([]byte(data), &sessionData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal session data: %w", err)
	}

	return &sessionData, nil
}

// UpdateLastSeen 更新会话最后活跃时间
func (s *SessionService) UpdateLastSeen(sessionID string) error {
	sessionData, err := s.GetSession(sessionID)
	if err != nil {
		return err
	}

	sessionData.LastSeen = time.Now()

	data, err := json.Marshal(sessionData)
	if err != nil {
		return fmt.Errorf("failed to marshal session data: %w", err)
	}

	// 获取当前TTL并保持
	ttl, err := s.redisClient.TTL(sessionID)
	if err != nil {
		return fmt.Errorf("failed to get session TTL: %w", err)
	}

	if err := s.redisClient.Set(sessionID, data, ttl); err != nil {
		return fmt.Errorf("failed to update session: %w", err)
	}

	return nil
}

// DeleteSession 删除会话
func (s *SessionService) DeleteSession(sessionID string) error {
	// 获取会话信息以便从用户会话列表中移除
	sessionData, err := s.GetSession(sessionID)
	if err != nil {
		// 如果会话不存在，直接返回成功
		if err.Error() == "session not found" {
			return nil
		}
		return err
	}

	// 从Redis中删除会话
	if err := s.redisClient.Del(sessionID); err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}

	// 从用户会话列表中移除
	userSessionsKey := fmt.Sprintf("user_sessions:%d", sessionData.UserID)
	if err := s.redisClient.client.SRem(s.redisClient.ctx, userSessionsKey, sessionID).Err(); err != nil {
		return fmt.Errorf("failed to remove session from user list: %w", err)
	}

	return nil
}

// DeleteAllUserSessions 删除用户所有会话
func (s *SessionService) DeleteAllUserSessions(userID int64) error {
	userSessionsKey := fmt.Sprintf("user_sessions:%d", userID)
	
	// 获取用户所有会话ID
	sessionIDs, err := s.redisClient.client.SMembers(s.redisClient.ctx, userSessionsKey).Result()
	if err != nil {
		return fmt.Errorf("failed to get user sessions: %w", err)
	}

	// 删除所有会话
	if len(sessionIDs) > 0 {
		if err := s.redisClient.Del(sessionIDs...); err != nil {
			return fmt.Errorf("failed to delete user sessions: %w", err)
		}
	}

	// 删除用户会话列表
	if err := s.redisClient.Del(userSessionsKey); err != nil {
		return fmt.Errorf("failed to delete user sessions list: %w", err)
	}

	return nil
}

// GetUserActiveSessions 获取用户活跃会话列表
func (s *SessionService) GetUserActiveSessions(userID int64) ([]SessionData, error) {
	userSessionsKey := fmt.Sprintf("user_sessions:%d", userID)
	
	sessionIDs, err := s.redisClient.client.SMembers(s.redisClient.ctx, userSessionsKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get user sessions: %w", err)
	}

	var sessions []SessionData
	for _, sessionID := range sessionIDs {
		sessionData, err := s.GetSession(sessionID)
		if err != nil {
			// 如果会话已过期，从列表中移除
			if err.Error() == "session not found" {
				s.redisClient.client.SRem(s.redisClient.ctx, userSessionsKey, sessionID)
				continue
			}
			return nil, err
		}
		sessions = append(sessions, *sessionData)
	}

	return sessions, nil
}

// IsSessionValid 检查会话是否有效
func (s *SessionService) IsSessionValid(sessionID string) bool {
	_, err := s.GetSession(sessionID)
	return err == nil
}

// ExtendSession 延长会话有效期
func (s *SessionService) ExtendSession(sessionID string, expiration time.Duration) error {
	if err := s.redisClient.Expire(sessionID, expiration); err != nil {
		return fmt.Errorf("failed to extend session: %w", err)
	}
	return nil
}