# LLMrouter - API取引プラットフォーム

> **多语言版本 | Multi-language Versions**
> 
> [🇨🇳 简体中文](README.md) | [🇹🇼 繁體中文](README_zh-TW.md) | [🇺🇸 English](README_en.md) | [🇯🇵 日本語](README_ja.md)

APIサービスプロバイダー（売り手）がAPIサービスを登録・販売し、買い手がプラットフォームを通じてこれらのAPIサービスを購読・利用できる現代的なAPI取引プラットフォームです。プラットフォームは安全なプロキシサービス、使用量計測、セッション管理、レート制限保護を提供します。

## 🚀 コア機能

### ユーザー管理
- **登録とログイン**: 売り手と買い手がユーザー名/パスワードで登録・ログイン可能
- **JWT認証**: JSON Web Tokensベースの安全な認証メカニズム
- **セッション管理**: Redisベースのユーザーセッション管理
- **レート制限**: 多次元レート制限（IP、ユーザー、APIキー）

### 売り手機能
- **APIサービス登録**: サービス名、説明、エンドポイントURL、アクセスキーを含む既存APIサービスの登録
- **サービス管理**: 登録済みAPIサービスの表示と管理
- **安全な保存**: 元のAPIキーはAES-256で暗号化して保存

### 買い手機能
- **サービス閲覧**: プラットフォーム上の利用可能なAPIサービスの閲覧
- **サービス購読**: 興味のあるAPIサービスを購読し、プラットフォーム生成の一意キーを取得
- **使用統計**: API呼び出し回数とコスト見積もりの表示

### プラットフォームコア
- **APIプロキシ**: 買い手のリクエストを売り手APIに透過的にプロキシ
- **キー検証**: プラットフォーム生成APIキーの有効性検証
- **リクエストルーティング**: サービスIDとパスに基づく正確なリクエストルーティング
- **使用量計測**: 各API呼び出しの詳細情報記録
- **キャッシュシステム**: Redisベースの高性能キャッシュ

## 🛠 技術スタック

### バックエンド
- **言語**: Go (Golang)
- **Webフレームワーク**: Gin
- **データベース**: PostgreSQL
- **キャッシュ**: Redis
- **認証**: JWT (JSON Web Tokens)
- **APIドキュメント**: Swaggo (OpenAPI仕様の自動生成)
- **暗号化**: AES-256 (APIキー暗号化用)

### フロントエンド
- **フレームワーク**: React 19 + TypeScript
- **ビルドツール**: Vite
- **UIコンポーネント**: Radix UI + Tailwind CSS
- **状態管理**: Zustand
- **HTTPクライアント**: Axios + TanStack Query
- **チャート**: Chart.js + Recharts
- **国際化**: i18next
- **ルーティング**: React Router DOM

### インフラストラクチャ
- **コンテナ化**: Docker + Docker Compose
- **データベースマイグレーション**: SQLスクリプト
- **環境設定**: 環境変数

## 📁 プロジェクト構造

```
LLMrouter/
├── api-trade-platform/          # バックエンドプロジェクト
│   ├── cmd/apiserver/           # メインプログラムエントリ
│   ├── internal/                # 内部コード
│   │   ├── config/             # 設定管理
│   │   ├── handler/            # HTTPハンドラー
│   │   ├── middleware/         # ミドルウェア
│   │   ├── model/              # データモデル
│   │   ├── redis/              # Redisサービス
│   │   ├── store/              # データストレージ
│   │   └── utils/              # ユーティリティ関数
│   ├── db/                     # データベース関連
│   │   ├── ddl.sql            # データベース構造
│   │   └── migrations/        # マイグレーションスクリプト
│   ├── docs/                   # APIドキュメント
│   ├── docker-compose.yml      # Docker設定
│   ├── .env.example           # 環境変数例
│   └── README.md              # バックエンドドキュメント
└── frontend/                   # フロントエンドプロジェクト
    ├── src/                   # ソースコード
    │   ├── components/        # Reactコンポーネント
    │   ├── pages/            # ページコンポーネント
    │   ├── services/         # APIサービス
    │   ├── store/            # 状態管理
    │   ├── types/            # TypeScript型
    │   └── utils/            # ユーティリティ関数
    ├── public/               # 静的アセット
    ├── package.json          # 依存関係設定
    └── README.md             # フロントエンドドキュメント
```

## 🚀 クイックスタート

### 前提条件
- Docker & Docker Compose
- Go 1.19+
- Node.js 18+
- npm または yarn

### 1. プロジェクトのクローン
```bash
git clone <repository-url>
cd LLMrouter
```

### 2. バックエンドサービスの起動

#### 2.1 データベースとRedisの起動
```bash
cd api-trade-platform
docker-compose up -d
```

#### 2.2 環境変数の設定
```bash
cp .env.example .env
# .envファイルを編集し、必要な設定を行う
```

#### 2.3 バックエンドサービスの起動
```bash
go run cmd/apiserver/main.go
```

バックエンドサービスは `http://localhost:8081` で起動します

### 3. フロントエンドサービスの起動

#### 3.1 依存関係のインストール
```bash
cd ../frontend
npm install
```

#### 3.2 開発サーバーの起動
```bash
npm run dev
```

フロントエンドサービスは `http://localhost:5173` で起動します

## 📚 APIドキュメント

バックエンドサービス起動後、以下のアドレスでAPIドキュメントにアクセスできます：
- Swagger UI: `http://localhost:8081/swagger/index.html`

### 主要APIエンドポイント

#### 認証関連
- `POST /api/v1/auth/register` - ユーザー登録
- `POST /api/v1/auth/login` - ユーザーログイン

#### 売り手機能
- `POST /api/v1/seller/apis` - APIサービス登録
- `GET /api/v1/seller/apis` - 自分のAPIサービスリスト取得

#### 買い手機能
- `GET /api/v1/buyer/apis` - 利用可能なAPIサービス閲覧
- `POST /api/v1/buyer/apis/{service_id}/subscribe` - APIサービス購読
- `GET /api/v1/buyer/usage` - 使用統計表示

#### プロキシサービス
- `/proxy/v1/{service_id}/{seller_path}` - APIプロキシエンドポイント

## ⚙️ 設定説明

### 環境変数 (.env)

```env
# データベース設定
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=password
DB_NAME=api_trade_db
DB_SSLMODE=disable

# サーバー設定
API_SERVER_PORT=8080

# JWT設定
JWT_SECRET_KEY=your-super-secret-jwt-key
JWT_EXPIRATION_HOURS=72

# 暗号化キー (32バイト)
ENCRYPTION_KEY=your-32-byte-long-encryption-key

# Redis設定
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_POOL_SIZE=10
```

## 🔒 セキュリティ機能

- **キー暗号化**: 売り手APIキーはAES-256で暗号化して保存
- **JWT認証**: 安全なユーザー認証メカニズム
- **レート制限**: 悪用防止のための多次元レート制限
- **セッション管理**: Redisベースの安全なセッション管理
- **入力検証**: インジェクション攻撃防止のための厳格な入力検証
- **HTTPS対応**: 本番環境ではHTTPS使用を推奨

## 🎯 コア機能

### Redis統合
- **セッション管理**: ユーザーログイン状態とセッションデータ
- **キャッシュシステム**: ユーザープロファイル、APIサービス情報等の高頻度データキャッシュ
- **レート制限サービス**: スライディングウィンドウアルゴリズムベースの精密なレート制限
- **グレースフル劣化**: Redis利用不可時の自動劣化、コア機能への影響なし

### データベース設計
- `users`: ユーザー情報テーブル
- `api_services`: APIサービス登録テーブル
- `platform_api_keys`: プラットフォーム生成APIキーテーブル
- `usage_logs`: API使用ログテーブル

## 🤝 貢献ガイド

1. プロジェクトをFork
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. Pull Requestを開く

## 📄 ライセンス

このプロジェクトはMITライセンスの下でライセンスされています - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 📞 連絡先

質問や提案がある場合は、以下の方法でお問い合わせください：
- Issueを作成
- メールを送信

---

**注意**: これはMVPバージョンで、学習とプロトタイプ開発に適しています。本番環境で使用する前に、十分なセキュリティ監査とパフォーマンステストを実施してください。