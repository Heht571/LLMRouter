# LLMrouter - API Trading Platform

> **多语言版本 | Multi-language Versions**
> 
> [🇨🇳 简体中文](README.md) | [🇹🇼 繁體中文](README_zh-TW.md) | [🇺🇸 English](README_en.md) | [🇯🇵 日本語](README_ja.md)

A modern API trading platform that allows API service providers (sellers) to register and sell their API services, while buyers can subscribe to and use these API services through the platform. The platform provides secure proxy services, usage metering, session management, and rate limiting protection.

## 🚀 Core Features

### User Management
- **Registration & Login**: Support for sellers and buyers to register and login with username/password
- **JWT Authentication**: Secure authentication mechanism based on JSON Web Tokens
- **Session Management**: Redis-based user session management
- **Rate Limiting**: Multi-dimensional rate limiting (IP, user, API key)

### Seller Features
- **API Service Registration**: Register existing API services including service name, description, endpoint URL, and access keys
- **Service Management**: View and manage registered API services
- **Secure Storage**: Original API keys are encrypted and stored using AES-256

### Buyer Features
- **Service Browsing**: Browse all available API services on the platform
- **Service Subscription**: Subscribe to interested API services and get platform-generated unique keys
- **Usage Statistics**: View API call counts and cost estimates

### Platform Core
- **API Proxy**: Transparently proxy buyer requests to seller APIs
- **Key Validation**: Validate platform-generated API key validity
- **Request Routing**: Correctly route requests based on service ID and path
- **Usage Metering**: Record detailed information for each API call
- **Caching System**: High-performance Redis-based caching

## 🛠 Technology Stack

### Backend
- **Language**: Go (Golang)
- **Web Framework**: Gin
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: Swaggo (auto-generate OpenAPI specification)
- **Encryption**: AES-256 (for API key encryption)

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI + Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios + TanStack Query
- **Charts**: Chart.js + Recharts
- **Internationalization**: i18next
- **Routing**: React Router DOM

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database Migration**: SQL scripts
- **Environment Configuration**: Environment variables

## 📁 Project Structure

```
LLMrouter/
├── api-trade-platform/          # Backend project
│   ├── cmd/apiserver/           # Main program entry
│   ├── internal/                # Internal code
│   │   ├── config/             # Configuration management
│   │   ├── handler/            # HTTP handlers
│   │   ├── middleware/         # Middleware
│   │   ├── model/              # Data models
│   │   ├── redis/              # Redis service
│   │   ├── store/              # Data storage
│   │   └── utils/              # Utility functions
│   ├── db/                     # Database related
│   │   ├── ddl.sql            # Database structure
│   │   └── migrations/        # Migration scripts
│   ├── docs/                   # API documentation
│   ├── docker-compose.yml      # Docker configuration
│   ├── .env.example           # Environment variables example
│   └── README.md              # Backend documentation
└── frontend/                   # Frontend project
    ├── src/                   # Source code
    │   ├── components/        # React components
    │   ├── pages/            # Page components
    │   ├── services/         # API services
    │   ├── store/            # State management
    │   ├── types/            # TypeScript types
    │   └── utils/            # Utility functions
    ├── public/               # Static assets
    ├── package.json          # Dependencies configuration
    └── README.md             # Frontend documentation
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Go 1.19+
- Node.js 18+
- npm or yarn

### 1. Clone the Project
```bash
git clone <repository-url>
cd LLMrouter
```

### 2. Start Backend Services

#### 2.1 Start Database and Redis
```bash
cd api-trade-platform
docker-compose up -d
```

#### 2.2 Configure Environment Variables
```bash
cp .env.example .env
# Edit .env file and set necessary configurations
```

#### 2.3 Start Backend Service
```bash
go run cmd/apiserver/main.go
```

The backend service will start at `http://localhost:8081`

### 3. Start Frontend Service

#### 3.1 Install Dependencies
```bash
cd ../frontend
npm install
```

#### 3.2 Start Development Server
```bash
npm run dev
```

The frontend service will start at `http://localhost:5173`

## 📚 API Documentation

After starting the backend service, you can access the API documentation at:
- Swagger UI: `http://localhost:8081/swagger/index.html`

### Main API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

#### Seller Features
- `POST /api/v1/seller/apis` - Register API service
- `GET /api/v1/seller/apis` - Get own API service list

#### Buyer Features
- `GET /api/v1/buyer/apis` - Browse all available API services
- `POST /api/v1/buyer/apis/{service_id}/subscribe` - Subscribe to API service
- `GET /api/v1/buyer/usage` - View usage statistics

#### Proxy Service
- `/proxy/v1/{service_id}/{seller_path}` - API proxy endpoint

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=password
DB_NAME=api_trade_db
DB_SSLMODE=disable

# Server configuration
API_SERVER_PORT=8080

# JWT configuration
JWT_SECRET_KEY=your-super-secret-jwt-key
JWT_EXPIRATION_HOURS=72

# Encryption key (32 bytes)
ENCRYPTION_KEY=your-32-byte-long-encryption-key

# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_POOL_SIZE=10
```

## 🔒 Security Features

- **Key Encryption**: Seller API keys are encrypted and stored using AES-256
- **JWT Authentication**: Secure user authentication mechanism
- **Rate Limiting**: Multi-dimensional rate limiting to prevent abuse
- **Session Management**: Secure Redis-based session management
- **Input Validation**: Strict input validation to prevent injection attacks
- **HTTPS Support**: HTTPS recommended for production environments

## 🎯 Core Features

### Redis Integration
- **Session Management**: User login status and session data
- **Caching System**: High-frequency data caching for user profiles, API service information, etc.
- **Rate Limiting Service**: Precise rate limiting based on sliding window algorithm
- **Graceful Degradation**: Automatic degradation when Redis is unavailable, without affecting core functionality

### Database Design
- `users`: User information table
- `api_services`: API service registration table
- `platform_api_keys`: Platform-generated API keys table
- `usage_logs`: API usage logs table

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

For questions or suggestions, please contact us through:
- Create an Issue
- Send an email

---

**Note**: This is an MVP version suitable for learning and prototype development. Please conduct thorough security audits and performance testing before using in production environments.