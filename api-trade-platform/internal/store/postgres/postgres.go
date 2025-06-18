package postgres

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq" // PostgreSQL driver
)

// Store 结构封装了数据库连接
type Store struct {
	DB *sql.DB
}

// NewStore 创建并返回一个新的 Store 实例 (数据库连接)
func NewStore(host, port, user, password, dbname, sslmode string) (*Store, error) {
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("无法打开数据库连接: %w", err)
	}

	if err = db.Ping(); err != nil {
		db.Close() // 如果 ping 失败，关闭连接
		return nil, fmt.Errorf("无法连接到数据库 (ping 失败): %w", err)
	}

	return &Store{DB: db}, nil
}

// Close 关闭数据库连接
func (s *Store) Close() error {
	if s.DB != nil {
		return s.DB.Close()
	}
	return nil
}

// TODO: 在此包或子包中为每个数据模型 (User, APIService, PlatformKey, UsageLog) 创建具体的 Store 实现。
// 例如: user_store.go, api_service_store.go 等。
// 这些具体的 Store 将嵌入或使用这个通用的 Store.DB 连接。

// Example of how a specific store might be structured (e.g., in user_store.go)
/*
type UserStore struct {
    *Store // Embed the generic Store to access DB
}

func NewUserStore(store *Store) *UserStore {
    return &UserStore{Store: store}
}

func (us *UserStore) GetUserByID(id int) (*model.User, error) {
    // Implementation using us.DB
    return nil, nil
}
*/