package postgres

import (
	"api-trade-platform/internal/model"
	"database/sql"
	"fmt"
)

// UserStore 用户数据库操作
type UserStore struct {
	*Store
}

// NewUserStore 创建用户存储实例
func NewUserStore(store *Store) *UserStore {
	return &UserStore{Store: store}
}

// CreateUser 创建新用户
func (us *UserStore) CreateUser(user *model.User) error {
	query := `
		INSERT INTO users (username, password_hash, email, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING user_id, created_at, updated_at`

	err := us.DB.QueryRow(query, user.Username, user.PasswordHash, user.Email, user.Role).Scan(
		&user.UserID, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

// GetUserByUsername 根据用户名获取用户
func (us *UserStore) GetUserByUsername(username string) (*model.User, error) {
	user := &model.User{}
	query := `
		SELECT user_id, username, password_hash, email, role, created_at, updated_at
		FROM users WHERE username = $1`

	err := us.DB.QueryRow(query, username).Scan(
		&user.UserID, &user.Username, &user.PasswordHash, &user.Email,
		&user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return user, nil
}

// GetUserByID 根据用户ID获取用户
func (us *UserStore) GetUserByID(userID int64) (*model.User, error) {
	user := &model.User{}
	query := `
		SELECT user_id, username, password_hash, email, role, created_at, updated_at
		FROM users WHERE user_id = $1`

	err := us.DB.QueryRow(query, userID).Scan(
		&user.UserID, &user.Username, &user.PasswordHash, &user.Email,
		&user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return user, nil
}

// CheckUsernameExists 检查用户名是否已存在
func (us *UserStore) CheckUsernameExists(username string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM users WHERE username = $1`
	err := us.DB.QueryRow(query, username).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check username: %w", err)
	}
	return count > 0, nil
}

// CheckEmailExists 检查邮箱是否已存在
func (us *UserStore) CheckEmailExists(email string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM users WHERE email = $1`
	err := us.DB.QueryRow(query, email).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check email: %w", err)
	}
	return count > 0, nil
}