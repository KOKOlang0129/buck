/**
 * Firebase Functions - PXr LLC MVP Phase 1
 * 
 * バックエンドAPIエンドポイント実装
 * - 認証: APIキー検証 + JWT + ホワイトリスト制御
 * - エンドポイント: /api/login, /api/user, /api/whitelist
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import { validateApiKey, verifyJWT } from './middleware/auth';
import { loginRouter } from './routes/login';
import { userRouter } from './routes/user';
import { whitelistRouter } from './routes/whitelist';

// Firebase Admin初期化
if (!admin.apps.length) {
  admin.initializeApp();
}

const app = express();

// CORS設定
app.use(cors({ origin: true }));

// リクエストボディパーサー
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// APIキー検証ミドルウェア（/api/* エンドポイントに適用）
app.use('/api', validateApiKey);

// ルーティング設定
app.use('/api/login', loginRouter);
app.use('/api/user', verifyJWT, userRouter);
app.use('/api/whitelist', verifyJWT, whitelistRouter);

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// エラーハンドラー
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Firebase Functionsとしてエクスポート
export const api = functions.https.onRequest(app);

