# API 交易平台 MVP 后端

本项目是一个 API 交易平台的最小可行产品 (MVP) 的后端实现。
它允许卖家注册他们现有的 API 服务，并让买家通过平台生成的密钥和代理 URL 来访问这些 API。
平台负责代理请求、验证密钥以及计量 API 使用情况。

## 核心功能

-   **用户管理**:
    -   卖家和买家可以通过用户名/密码进行注册和登录。
    -   认证机制采用 JWT (JSON Web Tokens)。
-   **卖家 API 管理 (需认证)**:
    -   卖家可以注册其 API 服务，需要提供服务名称、描述、原始 API 端点 URL 以及用于访问该原始 API 的密钥。
    -   卖家可以查看和管理自己注册的所有 API 服务。
    -   卖家提供的原始 API 密钥将被安全存储。
-   **买家 API 访问 (需认证)**:
    -   买家可以浏览平台上所有可用的 API 服务列表。
    -   买家可以为选定的卖家 API “订阅”并获取一个由平台生成的唯一 API 密钥。
    -   买家将通过平台提供的代理 URL (例如 `[平台域名]/proxy/v1/{服务ID}/{卖家路径}`) 来访问 API，并使用平台生成的密钥进行认证。
-   **平台 API 代理核心**:
    -   验证买家请求中携带的平台 API 密钥的有效性。
    -   根据请求中的服务 ID 和路径，将请求正确路由到卖家注册的原始 API 端点。
    -   在转发请求给卖家 API 时，使用卖家预先存储的原始 API 密钥进行认证。
    -   透明地转发请求和响应内容。
-   **使用计量**:
    -   记录每一次通过平台代理的 API 调用，包括调用者 (买家)、被调用的 API (卖家 API)、调用时间戳、请求是否成功等信息。
-   **基本账单信息 (买家侧)**:
    -   买家可以查看其在特定时间段内的 API 调用次数以及基于调用次数的指示性费用估算。

## 技术栈

-   **语言**: Go (Golang)
-   **Web 框架**: Gin (推荐，或标准库 `net/http` 配合路由库如 `gorilla/mux` 或 `chi`)
-   **数据库**: PostgreSQL
-   **API 文档**: Swaggo (通过代码注释自动生成 OpenAPI 规范)
-   **认证**: JWT (JSON Web Tokens)

## 项目结构 (预期)

```
/api-trade-platform
├── cmd/                    # 主程序入口
│   └── apiserver/          # API 服务器主程序
│       └── main.go
├── internal/               # 项目内部代码
│   ├── auth/               # 认证与授权 (JWT)
│   ├── config/             # 配置加载与管理
│   ├── handler/            # HTTP 请求处理器 (包含 Swaggo 注释)
│   ├── middleware/         # 中间件 (如认证、日志)
│   ├── model/              # 数据模型
│   ├── proxy/              # API 代理核心逻辑
│   ├── store/              # 数据存储与访问 (PostgreSQL)
│   ├── metering/           # API 使用计量与计费逻辑
│   └── util/               # 通用工具函数
├── api/                    # API 文档 (Swaggo 生成)
├── db/
│   ├── migrations/         # 数据库迁移脚本
│   └── ddl.sql             # 数据库表结构 DDL
├── scripts/                # 辅助脚本
├── .env.example            # 环境变量示例
├── go.mod
├── go.sum
└── README.md
```

## API 端点概要

详细的 API 端点定义请参考 Swaggo 生成的 API 文档。
核心端点包括：

-   `POST /api/v1/auth/register` - 用户注册
-   `POST /api/v1/auth/login` - 用户登录
-   `POST /api/v1/seller/apis` - 卖家注册 API (需认证)
-   `GET /api/v1/seller/apis` - 卖家列出自己的 API (需认证)
-   `GET /api/v1/buyer/apis` - 买家列出所有可用 API (需认证)
-   `POST /api/v1/buyer/apis/{service_id}/subscribe` - 买家订阅 API 获取平台密钥 (需认证)
-   `/proxy/v1/{service_id}/{seller_path...}` - API 代理端点 (需平台密钥认证)
-   `GET /api/v1/buyer/usage` - 买家查看 API 使用情况 (需认证)

## 数据库表结构概要

-   `users`: 存储用户信息 (ID, username, password_hash, email, role)。
-   `api_services`: 存储卖家注册的 API 服务信息 (ID, seller_id, name, original_url, encrypted_original_key, proxy_prefix)。
-   `platform_api_keys`: 存储买家获取的平台 API 密钥 (ID, buyer_id, service_id, platform_key)。
-   `usage_logs`: 存储 API 调用日志 (ID, platform_key_id, buyer_id, service_id, timestamp, status)。

详细的 DDL 请参考 `db/ddl.sql` 文件。

## 启动与运行 (预期)

1.  **配置环境变量**: 复制 `.env.example` 为 `.env` 并填入必要的配置 (如数据库连接信息, JWT 密钥等)。
2.  **数据库迁移**: (如果使用迁移工具) 运行迁移脚本创建数据库表结构。
    或者手动执行 `db/ddl.sql` 中的 SQL。
3.  **构建**: `go build -o apiserver ./cmd/apiserver/main.go`
4.  **运行**: `./apiserver`

API 服务将在配置的端口上启动 (例如 `http://localhost:8080`)。
API 文档 (Swaggo) 通常可以通过访问 `/swagger/index.html` 路径查看。

## 核心参数与配置 (环境变量 `.env`)

-   `DB_HOST`: PostgreSQL 主机名
-   `DB_PORT`: PostgreSQL 端口
-   `DB_USER`: PostgreSQL 用户名
-   `DB_PASSWORD`: PostgreSQL 密码
-   `DB_NAME`: PostgreSQL 数据库名称
-   `DB_SSLMODE`: PostgreSQL SSL 模式 (例如 `disable`, `require`)
-   `API_SERVER_PORT`: API 服务器监听端口 (例如 `8080`)
-   `JWT_SECRET_KEY`: 用于签发和验证 JWT 的密钥
-   `JWT_EXPIRATION_HOURS`: JWT 的有效时间 (小时)
-   `ENCRYPTION_KEY`: 用于加密存储卖家原始 API 密钥的对称加密密钥 (32字节)

## 安全注意事项

-   **密钥管理**: 卖家原始 API 密钥和 JWT 密钥必须安全存储和管理。
-   **输入验证**: 所有用户输入都应进行严格验证，防止注入等攻击。
-   **HTTPS**: 生产环境应始终使用 HTTPS。
-   **依赖安全**: 定期更新依赖库，关注安全漏洞。