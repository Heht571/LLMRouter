# LLMrouter - API交易平台

> **多語言版本 | Multi-language Versions**
> 
> [🇨🇳 简体中文](README.md) | [🇹🇼 繁體中文](README_zh-TW.md) | [🇺🇸 English](README_en.md) | [🇯🇵 日本語](README_ja.md)

一個現代化的API交易平台，允許API服務提供者（賣家）註冊和銷售他們的API服務，買家可以通過平台訂閱和使用這些API服務。平台提供安全的代理服務、使用計量、會話管理和限流保護。

## 🚀 核心功能

### 用戶管理
- **註冊與登入**: 支援賣家和買家通過用戶名/密碼註冊和登入
- **JWT認證**: 基於JSON Web Tokens的安全認證機制
- **會話管理**: 基於Redis的用戶會話管理
- **限流保護**: 多維度限流（IP、用戶、API密鑰）

### 賣家功能
- **API服務註冊**: 註冊現有API服務，包括服務名稱、描述、端點URL和存取密鑰
- **服務管理**: 查看和管理已註冊的API服務
- **安全儲存**: 原始API密鑰採用AES-256加密儲存

### 買家功能
- **服務瀏覽**: 瀏覽平台上所有可用的API服務
- **訂閱服務**: 訂閱感興趣的API服務並獲取平台生成的唯一密鑰
- **使用統計**: 查看API調用次數和費用估算

### 平台核心
- **API代理**: 透明代理買家請求到賣家API
- **密鑰驗證**: 驗證平台生成的API密鑰有效性
- **請求路由**: 根據服務ID和路徑正確路由請求
- **使用計量**: 記錄每次API調用的詳細資訊
- **快取系統**: 基於Redis的高效能快取

## 🛠 技術棧

### 後端
- **語言**: Go (Golang)
- **Web框架**: Gin
- **資料庫**: PostgreSQL
- **快取**: Redis
- **認證**: JWT (JSON Web Tokens)
- **API文件**: Swaggo (自動生成OpenAPI規範)
- **加密**: AES-256 (用於API密鑰加密)

### 前端
- **框架**: React 19 + TypeScript
- **建置工具**: Vite
- **UI元件**: Radix UI + Tailwind CSS
- **狀態管理**: Zustand
- **HTTP客戶端**: Axios + TanStack Query
- **圖表**: Chart.js + Recharts
- **國際化**: i18next
- **路由**: React Router DOM

### 基礎設施
- **容器化**: Docker + Docker Compose
- **資料庫遷移**: SQL腳本
- **環境配置**: 環境變數

## 📁 專案結構

```
LLMrouter/
├── api-trade-platform/          # 後端專案
│   ├── cmd/apiserver/           # 主程式入口
│   ├── internal/                # 內部程式碼
│   │   ├── config/             # 配置管理
│   │   ├── handler/            # HTTP處理器
│   │   ├── middleware/         # 中介軟體
│   │   ├── model/              # 資料模型
│   │   ├── redis/              # Redis服務
│   │   ├── store/              # 資料儲存
│   │   └── utils/              # 工具函數
│   ├── db/                     # 資料庫相關
│   │   ├── ddl.sql            # 資料庫結構
│   │   └── migrations/        # 遷移腳本
│   ├── docs/                   # API文件
│   ├── docker-compose.yml      # Docker配置
│   ├── .env.example           # 環境變數範例
│   └── README.md              # 後端文件
└── frontend/                   # 前端專案
    ├── src/                   # 原始碼
    │   ├── components/        # React元件
    │   ├── pages/            # 頁面元件
    │   ├── services/         # API服務
    │   ├── store/            # 狀態管理
    │   ├── types/            # TypeScript類型
    │   └── utils/            # 工具函數
    ├── public/               # 靜態資源
    ├── package.json          # 相依性配置
    └── README.md             # 前端文件
```

## 🚀 快速開始

### 前置需求
- Docker & Docker Compose
- Go 1.19+
- Node.js 18+
- npm 或 yarn

### 1. 複製專案
```bash
git clone <repository-url>
cd LLMrouter
```

### 2. 啟動後端服務

#### 2.1 啟動資料庫和Redis
```bash
cd api-trade-platform
docker-compose up -d
```

#### 2.2 配置環境變數
```bash
cp .env.example .env
# 編輯 .env 檔案，設定必要的配置
```

#### 2.3 啟動後端服務
```bash
go run cmd/apiserver/main.go
```

後端服務將在 `http://localhost:8080` 啟動

### 3. 啟動前端服務

#### 3.1 安裝相依性
```bash
cd ../frontend
npm install
```

#### 3.2 啟動開發伺服器
```bash
npm run dev
```

前端服務將在 `http://localhost:5173` 啟動

## 📸 介面截圖

### API市場
![API市場](pic/繁中2025-06-20%2010.16.10.png)

### 買家端儀表板
![買家端儀表板](pic/繁中2025-06-20%2010.16.26.png)

### 登入介面
![登入介面](pic/繁中2025-06-20%2010.17.18.png)

### 賣家端儀表板
![賣家端儀表板](pic/繁中2025-06-20%2010.17.58.png)

### 賣家API管理介面
![賣家API管理介面](pic/繁中2025-06-20%2010.18.07.png)

## 📚 API文件

啟動後端服務後，可以通過以下地址存取API文件：
- Swagger UI: `http://localhost:8080/swagger/index.html`

### 主要API端點

#### 認證相關
- `POST /api/v1/auth/register` - 用戶註冊
- `POST /api/v1/auth/login` - 用戶登入

#### 賣家功能
- `POST /api/v1/seller/apis` - 註冊API服務
- `GET /api/v1/seller/apis` - 獲取自己的API服務清單

#### 買家功能
- `GET /api/v1/buyer/apis` - 瀏覽所有可用API服務
- `POST /api/v1/buyer/apis/{service_id}/subscribe` - 訂閱API服務
- `GET /api/v1/buyer/usage` - 查看使用統計

#### 代理服務
- `/proxy/v1/{service_id}/{seller_path}` - API代理端點

## ⚙️ 配置說明

### 環境變數 (.env)

```env
# 資料庫配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=password
DB_NAME=api_trade_db
DB_SSLMODE=disable

# 伺服器配置
API_SERVER_PORT=8080

# JWT配置
JWT_SECRET_KEY=your-super-secret-jwt-key
JWT_EXPIRATION_HOURS=72

# 加密密鑰 (32位元組)
ENCRYPTION_KEY=your-32-byte-long-encryption-key

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_POOL_SIZE=10
```

## 🔒 安全特性

- **密鑰加密**: 賣家API密鑰使用AES-256加密儲存
- **JWT認證**: 安全的用戶認證機制
- **限流保護**: 多維度限流防止濫用
- **會話管理**: 基於Redis的安全會話管理
- **輸入驗證**: 嚴格的輸入驗證防止注入攻擊
- **HTTPS支援**: 生產環境建議使用HTTPS

## 🎯 核心特性

### Redis整合
- **會話管理**: 用戶登入狀態和會話資料
- **快取系統**: 用戶資料、API服務資訊等高頻資料快取
- **限流服務**: 基於滑動視窗演算法的精確限流
- **優雅降級**: Redis不可用時自動降級，不影響核心功能

### 資料庫設計
- `users`: 用戶資訊表
- `api_services`: API服務註冊表
- `platform_api_keys`: 平台生成的API密鑰表
- `usage_logs`: API使用日誌表

## 🤝 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權條款

本專案採用 MIT 授權條款 - 查看 [LICENSE](LICENSE) 檔案了解詳情。

## 📞 聯絡方式

如有問題或建議，請通過以下方式聯絡：
- 建立 Issue
- 發送郵件

---

**注意**: 這是一個MVP版本，適用於學習和原型開發。生產環境使用前請進行充分的安全稽核和效能測試。