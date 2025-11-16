"use strict";
/**
 * Firebase Functions - PXr LLC MVP Phase 1
 *
 * バックエンドAPIエンドポイント実装
 * - 認証: APIキー検証 + JWT + ホワイトリスト制御
 * - エンドポイント: /api/login, /api/user, /api/whitelist
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const auth_1 = require("./middleware/auth");
const login_1 = require("./routes/login");
const user_1 = require("./routes/user");
const whitelist_1 = require("./routes/whitelist");
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
app.use('/api', auth_1.validateApiKey);
// ルーティング設定
app.use('/api/login', login_1.loginRouter);
app.use('/api/user', auth_1.verifyJWT, user_1.userRouter);
app.use('/api/whitelist', auth_1.verifyJWT, whitelist_1.whitelistRouter);
// 404ハンドラー
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});
// エラーハンドラー
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json(Object.assign({ error: err.message || 'Internal Server Error' }, (process.env.NODE_ENV === 'development' && { stack: err.stack })));
});
// Firebase Functionsとしてエクスポート
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map