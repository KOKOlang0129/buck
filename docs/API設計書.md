# API設計書 - PXr LLC MVP Phase 1

## 1. 概要

本ドキュメントは、PXr LLC AIシナリオエディターのバックエンドAPI設計を定義します。すべてのAPIエンドポイントは、APIキー検証とJWT認証を実装し、セキュリティを最優先に設計されています。

## 2. 認証方式

### 2.1 APIキー認証

すべてのAPIリクエストには、`x-api-key` ヘッダーが必要です。

**ヘッダー形式:**
```
x-api-key: <client-api-key>
```

**検証プロセス:**
1. Firestoreの `api_keys` コレクションでAPIキーを検索
2. `isActive === true` を確認
3. 使用回数制限チェック (`usageCount < usageLimit`)
4. 検証成功時、リクエストオブジェクトにAPIキー情報を付与

**エラーレスポンス:**
- `401 Unauthorized`: APIキーが提供されていない
- `403 Forbidden`: 無効または非アクティブなAPIキー
- `429 Too Many Requests`: APIキーの使用回数制限超過

### 2.2 JWT認証

保護されたエンドポイントには、JWTトークンが必要です。

**ヘッダー形式:**
```
Authorization: Bearer <jwt-token>
```

**トークン取得:**
- `POST /api/login` エンドポイントでログイン成功時に発行

**トークン仕様:**
- アルゴリズム: HS256
- 有効期限: 24時間
- ペイロード:
  ```json
  {
    "userId": "user-id",
    "email": "user@example.com",
    "iat": 1234567890
  }
  ```

**エラーレスポンス:**
- `401 Unauthorized`: JWTトークンが提供されていない、または無効

## 3. エンドポイント一覧

### 3.1 認証エンドポイント

#### POST /api/login

ユーザーログイン処理を行い、JWTトークンを発行します。

**リクエスト:**
```http
POST /api/login
Headers:
  x-api-key: <client-api-key>
  Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "User Name",
    "photoURL": "https://example.com/photo.jpg",
    "isAllowed": true
  }
}
```

**エラーレスポンス:**
- `400 Bad Request`: メールアドレスまたはパスワードが提供されていない
- `401 Unauthorized`: 無効なメールアドレスまたはパスワード
- `403 Forbidden`: ユーザーがホワイトリストに登録されていない
- `500 Internal Server Error`: サーバーエラー

#### POST /api/login/refresh

JWTトークンをリフレッシュします。

**リクエスト:**
```http
POST /api/login/refresh
Headers:
  x-api-key: <client-api-key>
  Content-Type: application/json

Body:
{
  "userId": "user-id",
  "email": "user@example.com"
}
```

**レスポンス (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3.2 ユーザー管理エンドポイント

#### GET /api/user

現在のユーザー情報を取得します。

**リクエスト:**
```http
GET /api/user
Headers:
  x-api-key: <client-api-key>
  Authorization: Bearer <jwt-token>
```

**レスポンス (200 OK):**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "displayName": "User Name",
  "photoURL": "https://example.com/photo.jpg",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "isAllowed": true
}
```

**エラーレスポンス:**
- `401 Unauthorized`: JWTトークンが無効
- `404 Not Found`: ユーザーが見つからない
- `500 Internal Server Error`: サーバーエラー

#### PUT /api/user

ユーザー情報を更新します。

**リクエスト:**
```http
PUT /api/user
Headers:
  x-api-key: <client-api-key>
  Authorization: Bearer <jwt-token>
  Content-Type: application/json

Body:
{
  "displayName": "New Name",
  "photoURL": "https://example.com/new-photo.jpg"
}
```

**レスポンス (200 OK):**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "displayName": "New Name",
  "photoURL": "https://example.com/new-photo.jpg",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/user/profile

ユーザープロフィール詳細を取得します。

**リクエスト:**
```http
GET /api/user/profile
Headers:
  x-api-key: <client-api-key>
  Authorization: Bearer <jwt-token>
```

**レスポンス (200 OK):**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "displayName": "User Name",
  "photoURL": "https://example.com/photo.jpg",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "isAllowed": true
}
```

### 3.3 ホワイトリスト管理エンドポイント

#### GET /api/whitelist

ホワイトリスト一覧を取得します（管理者のみ）。

**リクエスト:**
```http
GET /api/whitelist
Headers:
  x-api-key: <client-api-key>
  Authorization: Bearer <jwt-token>
```

**レスポンス (200 OK):**
```json
{
  "count": 2,
  "users": [
    {
      "userId": "user-id-1",
      "email": "user1@example.com",
      "displayName": "User 1",
      "addedAt": "2024-01-01T00:00:00.000Z",
      "addedBy": "admin-id"
    },
    {
      "userId": "user-id-2",
      "email": "user2@example.com",
      "displayName": "User 2",
      "addedAt": "2024-01-02T00:00:00.000Z",
      "addedBy": "admin-id"
    }
  ]
}
```

#### POST /api/whitelist

ユーザーをホワイトリストに追加します。

**リクエスト:**
```http
POST /api/whitelist
Headers:
  x-api-key: <client-api-key>
  Authorization: Bearer <jwt-token>
  Content-Type: application/json

Body:
{
  "targetUserId": "user-id",
  "email": "user@example.com",
  "displayName": "User Name"
}
```

**レスポンス (200 OK):**
```json
{
  "message": "User added to whitelist successfully.",
  "user": {
    "userId": "user-id",
    "email": "user@example.com",
    "displayName": "User Name"
  }
}
```

**注意**: `targetUserId` または `email` のいずれかが必要です。

#### DELETE /api/whitelist/:userId

ユーザーをホワイトリストから削除します。

**リクエスト:**
```http
DELETE /api/whitelist/user-id
Headers:
  x-api-key: <client-api-key>
  Authorization: Bearer <jwt-token>
```

**レスポンス (200 OK):**
```json
{
  "message": "User removed from whitelist successfully.",
  "userId": "user-id"
}
```

#### GET /api/whitelist/check/:userId

ユーザーのホワイトリスト状態を確認します。

**リクエスト:**
```http
GET /api/whitelist/check/user-id
Headers:
  x-api-key: <client-api-key>
  Authorization: Bearer <jwt-token>
```

**レスポンス (200 OK):**
```json
{
  "userId": "user-id",
  "isAllowed": true,
  "details": {
    "email": "user@example.com",
    "displayName": "User Name",
    "addedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3.4 ヘルスチェック

#### GET /health

APIサーバーのヘルスチェックを行います。

**リクエスト:**
```http
GET /health
```

**レスポンス (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 4. エラーレスポンス形式

すべてのエラーレスポンスは、以下の形式に従います：

```json
{
  "error": "Error Code",
  "message": "Human-readable error message"
}
```

**HTTPステータスコード:**
- `400 Bad Request`: リクエストパラメータが不正
- `401 Unauthorized`: 認証が必要、または認証に失敗
- `403 Forbidden`: アクセス権限がない
- `404 Not Found`: リソースが見つからない
- `429 Too Many Requests`: レート制限超過
- `500 Internal Server Error`: サーバー内部エラー

## 5. レート制限

現在、APIキーレベルでの使用回数制限を実装しています。将来的には、エンドポイントごとのレート制限を追加予定です。

## 6. バージョニング

現在のAPIバージョン: `v1`

将来的には、`/api/v1/`, `/api/v2/` のようなパスベースのバージョニングを実装予定です。

## 7. セキュリティ考慮事項

1. **HTTPS必須**: すべてのAPI通信はHTTPS経由で行う必要があります
2. **APIキー管理**: APIキーは安全に保管し、定期的にローテーションすることを推奨
3. **JWTトークン**: トークンは安全に保管し、有効期限切れ前にリフレッシュすることを推奨
4. **CORS**: 本番環境では、許可されたオリジンのみアクセス可能に設定

## 8. 実装例

### 8.1 JavaScript/TypeScript (Fetch API)

```typescript
// ログイン
const login = async (email: string, password: string) => {
  const response = await fetch('https://your-api.com/api/login', {
    method: 'POST',
    headers: {
      'x-api-key': 'your-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  const data = await response.json();
  localStorage.setItem('jwt-token', data.token);
  return data;
};

// ユーザー情報取得
const getUser = async () => {
  const token = localStorage.getItem('jwt-token');
  const response = await fetch('https://your-api.com/api/user', {
    headers: {
      'x-api-key': 'your-api-key',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user');
  }
  
  return await response.json();
};
```

### 8.2 cURL

```bash
# ログイン
curl -X POST https://your-api.com/api/login \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# ユーザー情報取得
curl -X GET https://your-api.com/api/user \
  -H "x-api-key: your-api-key" \
  -H "Authorization: Bearer your-jwt-token"
```

---

**最終更新日**: 2024年
**バージョン**: 1.0.0
**作成者**: PXr LLC開発チーム

