# LLMrouter - API交易平台

> **多语言版本 | Multi-language Versions**
> 
> [🇨🇳 简体中文](README.md) | [🇹🇼 繁體中文](README_zh-TW.md) | [🇺🇸 English](README_en.md) | [🇯🇵 日本語](README_ja.md)

一个现代化的API交易平台，允许API服务提供者（卖家）注册和销售他们的API服务，买家可以通过平台订阅和使用这些API服务。平台提供安全的代理服务、使用计量、会话管理和限流保护。

## 🚀 核心功能

### 用户管理
- **注册与登录**: 支持卖家和买家通过用户名/密码注册和登录
- **JWT认证**: 基于JSON Web Tokens的安全认证机制
- **会话管理**: 基于Redis的用户会话管理
- **限流保护**: 多维度限流（IP、用户、API密钥）

### 卖家功能
- **API服务注册**: 注册现有API服务，包括服务名称、描述、端点URL和访问密钥
- **服务管理**: 查看和管理已注册的API服务
- **安全存储**: 原始API密钥采用AES-256加密存储

### 买家功能
- **服务浏览**: 浏览平台上所有可用的API服务
- **订阅服务**: 订阅感兴趣的API服务并获取平台生成的唯一密钥
- **使用统计**: 查看API调用次数和费用估算

### 平台核心
- **API代理**: 透明代理买家请求到卖家API
- **密钥验证**: 验证平台生成的API密钥有效性
- **请求路由**: 根据服务ID和路径正确路由请求
- **使用计量**: 记录每次API调用的详细信息
- **缓存系统**: 基于Redis的高性能缓存

## 🛠 技术栈

### 后端
- **语言**: Go (Golang)
- **Web框架**: Gin
- **数据库**: PostgreSQL
- **缓存**: Redis
- **认证**: JWT (JSON Web Tokens)
- **API文档**: Swaggo (自动生成OpenAPI规范)
- **加密**: AES-256 (用于API密钥加密)

### 前端
- **框架**: React 19 + TypeScript
- **构建工具**: Vite
- **UI组件**: Radix UI + Tailwind CSS
- **状态管理**: Zustand
- **HTTP客户端**: Axios + TanStack Query
- **图表**: Chart.js + Recharts
- **国际化**: i18next
- **路由**: React Router DOM

### 基础设施
- **容器化**: Docker + Docker Compose
- **数据库迁移**: SQL脚本
- **环境配置**: 环境变量

## 📁 项目结构

```
LLMrouter/
├── api-trade-platform/          # 后端项目
│   ├── cmd/apiserver/           # 主程序入口
│   ├── internal/                # 内部代码
│   │   ├── config/             # 配置管理
│   │   ├── handler/            # HTTP处理器
│   │   ├── middleware/         # 中间件
│   │   ├── model/              # 数据模型
│   │   ├── redis/              # Redis服务
│   │   ├── store/              # 数据存储
│   │   └── utils/              # 工具函数
│   ├── db/                     # 数据库相关
│   │   ├── ddl.sql            # 数据库结构
│   │   └── migrations/        # 迁移脚本
│   ├── docs/                   # API文档
│   ├── docker-compose.yml      # Docker配置
│   ├── .env.example           # 环境变量示例
│   └── README.md              # 后端文档
└── frontend/                   # 前端项目
    ├── src/                   # 源代码
    │   ├── components/        # React组件
    │   ├── pages/            # 页面组件
    │   ├── services/         # API服务
    │   ├── store/            # 状态管理
    │   ├── types/            # TypeScript类型
    │   └── utils/            # 工具函数
    ├── public/               # 静态资源
    ├── package.json          # 依赖配置
    └── README.md             # 前端文档
```

## 🚀 快速开始

### 前置要求
- Docker & Docker Compose
- Go 1.19+
- Node.js 18+
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <repository-url>
cd LLMrouter
```

### 2. 启动后端服务

#### 2.1 启动数据库和Redis
```bash
cd api-trade-platform
docker-compose up -d
```

#### 2.2 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，设置必要的配置
```

#### 2.3 启动后端服务
```bash
go run cmd/apiserver/main.go
```

后端服务将在 `http://localhost:8080` 启动

### 3. 启动前端服务

#### 3.1 安装依赖
```bash
cd ../frontend
npm install
```

#### 3.2 启动开发服务器
```bash
npm run dev
```

前端服务将在 `http://localhost:5173` 启动

## 📸 界面截图

### 卖家仪表盘
![卖家仪表盘](pic/简中2025-06-19%2011.32.02.png)

### 登录界面
![登录界面](pic/简中2025-06-19%2011.32.18.png)

### API市场
![API市场](pic/简中2025-06-19%2011.33.54.png)

### 卖家API服务管理
![卖家API服务管理](pic/简中2025-06-20%2009.15.47.png)

## 📚 API文档

启动后端服务后，可以通过以下地址访问API文档：
- Swagger UI: `http://localhost:8080/swagger/index.html`

### 主要API端点

#### 认证相关
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录

#### 卖家功能
- `POST /api/v1/seller/apis` - 注册API服务
- `GET /api/v1/seller/apis` - 获取自己的API服务列表

#### 买家功能
- `GET /api/v1/buyer/apis` - 浏览所有可用API服务
- `POST /api/v1/buyer/apis/{service_id}/subscribe` - 订阅API服务
- `GET /api/v1/buyer/usage` - 查看使用统计

#### 代理服务
- `/proxy/v1/{service_id}/{seller_path}` - API代理端点

## ⚙️ 配置说明

### 环境变量 (.env)

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=password
DB_NAME=api_trade_db
DB_SSLMODE=disable

# 服务器配置
API_SERVER_PORT=8080

# JWT配置
JWT_SECRET_KEY=your-super-secret-jwt-key
JWT_EXPIRATION_HOURS=72

# 加密密钥 (32字节)
ENCRYPTION_KEY=your-32-byte-long-encryption-key

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_POOL_SIZE=10
```

## 🔒 安全特性

- **密钥加密**: 卖家API密钥使用AES-256加密存储
- **JWT认证**: 安全的用户认证机制
- **限流保护**: 多维度限流防止滥用
- **会话管理**: 基于Redis的安全会话管理
- **输入验证**: 严格的输入验证防止注入攻击
- **HTTPS支持**: 生产环境建议使用HTTPS

## 🎯 核心特性

### Redis集成
- **会话管理**: 用户登录状态和会话数据
- **缓存系统**: 用户资料、API服务信息等高频数据缓存
- **限流服务**: 基于滑动窗口算法的精确限流
- **优雅降级**: Redis不可用时自动降级，不影响核心功能

### 数据库设计
- `users`: 用户信息表
- `api_services`: API服务注册表
- `platform_api_keys`: 平台生成的API密钥表
- `usage_logs`: API使用日志表

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 创建 Issue
- 发送邮件

---

**注意**: 这是一个MVP版本，适用于学习和原型开发。生产环境使用前请进行充分的安全审计和性能测试。