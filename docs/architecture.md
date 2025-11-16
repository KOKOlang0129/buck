# PXr LLC MVP Phase 1 - アーキテクチャ概要

## 1. システム概要

PXr LLCのAIシナリオエディターは、執筆者が自然言語で物語を進める中で、AIが補完・提案を行う執筆補助ツールです。本ドキュメントは、MVP Phase 1の技術アーキテクチャを説明します。

## 2. システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        クライアント層                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React + Vite + TypeScript + TailwindCSS             │  │
│  │  - ホームページ                                        │  │
│  │  - ログイン/登録ページ                                 │  │
│  │  - ダッシュボード                                      │  │
│  │  - シナリオエディター                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            │
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway層                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Firebase Functions (Express.js)                     │  │
│  │  - APIキー検証ミドルウェア                             │  │
│  │  - JWT認証ミドルウェア                                 │  │
│  │  - CORS設定                                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐  ┌─────────▼─────────┐  ┌─────▼──────┐
│   認証API     │  │   ユーザーAPI     │  │ ホワイトリスト│
│  /api/login  │  │   /api/user       │  │  /api/     │
│              │  │                   │  │  whitelist  │
└──────────────┘  └───────────────────┘  └────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      データ層                                 │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │  Firebase Auth   │  │  Firestore        │              │
│  │  - ユーザー認証   │  │  - users          │              │
│  │  - セッション管理 │  │  - allowed_users  │              │
│  │                  │  │  - api_keys        │              │
│  │                  │  │  - scenarios       │              │
│  └──────────────────┘  └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
┌─────────────────────────────────────────────────────────────┐
│                   外部サービス統合層                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AI API統合 (将来実装)                                │  │
│  │  - OpenAI GPT-4 / Claude API                        │  │
│  │  - APIキー管理・使用回数制限                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 3. 技術スタック

### 3.1 フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| React | 18.x | UIフレームワーク |
| TypeScript | 5.x | 型安全性 |
| Vite | 5.x | ビルドツール・開発サーバー |
| React Router DOM | 6.x | クライアントサイドルーティング |
| Tailwind CSS | 3.x | スタイリング |
| Firebase SDK | 10.x | Firebase連携（Auth, Firestore） |

**注意**: 要件定義書ではNext.jsが指定されていますが、現在の実装はReact + Viteを使用しています。将来的な移行を考慮した設計となっています。

### 3.2 バックエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Firebase Functions | 4.x | サーバーレスAPI |
| Express.js | 4.x | HTTPサーバーフレームワーク |
| Firebase Admin SDK | 11.x | Firebase管理操作 |
| jsonwebtoken | 9.x | JWT生成・検証 |
| CORS | 2.x | クロスオリジンリクエスト処理 |

**注意**: 要件定義書ではSupabaseまたはNode.js + Express + Prisma + PostgreSQLが指定されていますが、現在の実装はFirebase Functionsを使用しています。

### 3.3 データベース

| サービス | 用途 |
|---------|------|
| Firebase Authentication | ユーザー認証・セッション管理 |
| Firestore | NoSQLデータベース |
|  | - `users`: ユーザープロフィール |
|  | - `allowed_users`: ホワイトリスト |
|  | - `api_keys`: APIキー管理 |
|  | - `scenarios`: シナリオデータ |

### 3.4 インフラストラクチャ

| サービス | 用途 |
|---------|------|
| Firebase Hosting | フロントエンドホスティング（将来） |
| Firebase Functions | バックエンドAPI実行環境 |
| Vercel | ステージング環境（要件定義書指定） |

## 4. 認証・セキュリティアーキテクチャ

### 4.1 認証フロー

```
1. クライアント → POST /api/login
   Headers: x-api-key: <client-api-key>
   Body: { email, password }

2. バックエンド:
   a. APIキー検証 (validateApiKey)
   b. Firebase Authでユーザー認証
   c. ホワイトリストチェック (checkWhitelist)
   d. JWTトークン生成 (generateJWT)

3. レスポンス:
   {
     token: "jwt-token",
     user: { id, email, displayName, ... }
   }

4. クライアント:
   - JWTトークンをlocalStorageに保存
   - 以降のリクエストで Authorization: Bearer <token> を送信
```

### 4.2 APIキー検証

- **場所**: すべての `/api/*` エンドポイント
- **ヘッダー**: `x-api-key`
- **検証内容**:
  - Firestoreの `api_keys` コレクションで検証
  - `isActive === true` を確認
  - 使用回数制限チェック (`usageCount < usageLimit`)

### 4.3 JWT認証

- **発行**: ログイン成功時
- **有効期限**: 24時間
- **ペイロード**:
  ```json
  {
    "userId": "user-id",
    "email": "user@example.com",
    "iat": 1234567890
  }
  ```
- **検証**: 保護されたエンドポイント（`/api/user/*`, `/api/whitelist/*`）で検証

### 4.4 ホワイトリスト制御

- **コレクション**: `allowed_users`
- **構造**:
  ```typescript
  {
    userId: string;
    email: string;
    displayName: string;
    isAllowed: boolean;
    addedAt: Timestamp;
    addedBy: string;
  }
  ```
- **チェックタイミング**: ログイン時、JWT検証時

## 5. APIエンドポイント一覧

### 5.1 認証エンドポイント

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| POST | `/api/login` | ログイン（JWT発行） | APIキー |
| POST | `/api/login/refresh` | JWTトークンリフレッシュ | APIキー |

### 5.2 ユーザー管理エンドポイント

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| GET | `/api/user` | 現在のユーザー情報取得 | JWT |
| PUT | `/api/user` | ユーザー情報更新 | JWT |
| GET | `/api/user/profile` | ユーザープロフィール詳細取得 | JWT |

### 5.3 ホワイトリスト管理エンドポイント

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| GET | `/api/whitelist` | ホワイトリスト一覧取得 | JWT |
| POST | `/api/whitelist` | ユーザーをホワイトリストに追加 | JWT |
| DELETE | `/api/whitelist/:userId` | ユーザーをホワイトリストから削除 | JWT |
| GET | `/api/whitelist/check/:userId` | ホワイトリスト状態確認 | JWT |

### 5.4 ヘルスチェック

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| GET | `/health` | ヘルスチェック | なし |

## 6. データモデル

### 6.1 users コレクション

```typescript
interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isAllowed: boolean;
}
```

### 6.2 allowed_users コレクション

```typescript
interface AllowedUser {
  userId: string;
  email: string;
  displayName: string;
  isAllowed: boolean;
  addedAt: Timestamp;
  addedBy: string;
  removedAt?: Timestamp;
  removedBy?: string;
}
```

### 6.3 api_keys コレクション

```typescript
interface ApiKey {
  key: string;
  name: string;
  isActive: boolean;
  usageCount: number;
  usageLimit?: number;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}
```

### 6.4 scenarios コレクション

```typescript
interface Scenario {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags: string[];
  isPublic: boolean;
  aiSuggestions?: string[];
}
```

## 7. セキュリティ対策

### 7.1 APIキー管理

- APIキーはFirestoreで管理
- 環境変数やAWS Secrets Managerへの移行を推奨（本番環境）
- 使用回数制限機能を実装

### 7.2 JWTセキュリティ

- シークレットキーは環境変数で管理（`JWT_SECRET`）
- トークン有効期限を設定（24時間）
- HTTPS通信を必須とする

### 7.3 CORS設定

- 許可されたオリジンのみアクセス可能
- 本番環境では具体的なドメインを指定

### 7.4 エラーハンドリング

- 機密情報を含むエラーメッセージを返さない
- 本番環境ではスタックトレースを非表示

## 8. デプロイメント

### 8.1 フロントエンド

```bash
# ビルド
npm run build

# Vercelデプロイ（ステージング）
vercel deploy

# Firebase Hostingデプロイ（本番）
firebase deploy --only hosting
```

### 8.2 バックエンド

```bash
# Firebase Functionsビルド
cd functions
npm run build

# デプロイ
firebase deploy --only functions
```

## 9. 環境変数

### 9.1 フロントエンド (.env)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### 9.2 バックエンド (Firebase Functions)

```env
JWT_SECRET=
OPENAI_API_KEY=  # 将来実装
CLAUDE_API_KEY=  # 将来実装
```

## 10. 今後の拡張予定

### 10.1 Phase 2 (MVP)

- AI補完付きエディター機能
- ユーザー単位のAPI使用回数制限
- 物語作成・保存・再編集機能
- プロンプト履歴管理・AI応答制御

### 10.2 技術的改善

- Next.jsへの移行（要件定義書準拠）
- SupabaseまたはNode.js + Express + Prisma + PostgreSQLへの移行検討
- AWS Secrets Manager統合
- 包括的なテストスイート（Jest）
- CI/CDパイプライン構築

## 11. パフォーマンス目標

- API応答時間: < 300ms
- フロントエンド初期ロード: < 2秒
- 認証処理: < 500ms

## 12. 監視・ログ

- Firebase Functions ログ
- エラートラッキング（将来実装: Sentry等）
- パフォーマンス監視（将来実装: Firebase Performance Monitoring）

---

**最終更新日**: 2024年
**バージョン**: 1.0.0
**作成者**: PXr LLC開発チーム

