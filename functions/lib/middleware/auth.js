"use strict";
/**
 * 認証ミドルウェア
 * - APIキー検証
 * - JWT生成・検証
 * - ホワイトリストチェック
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWhitelist = exports.verifyJWT = exports.generateJWT = exports.validateApiKey = void 0;
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
/**
 * APIキー検証ミドルウェア
 * リクエストヘッダーの x-api-key を検証
 */
const validateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'API key is required. Please provide x-api-key header.'
            });
            return;
        }
        // FirestoreからAPIキーを検証
        const apiKeyDoc = await admin.firestore()
            .collection('api_keys')
            .where('key', '==', apiKey)
            .where('isActive', '==', true)
            .limit(1)
            .get();
        if (apiKeyDoc.empty) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Invalid or inactive API key.'
            });
            return;
        }
        const apiKeyData = apiKeyDoc.docs[0].data();
        // 使用回数制限チェック
        if (apiKeyData.usageLimit && apiKeyData.usageCount >= apiKeyData.usageLimit) {
            res.status(429).json({
                error: 'Too Many Requests',
                message: 'API key usage limit exceeded.'
            });
            return;
        }
        // リクエストにAPIキー情報を付与
        req.apiKey = apiKeyData;
        req.apiKeyId = apiKeyDoc.docs[0].id;
        next();
    }
    catch (error) {
        console.error('API key validation error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to validate API key.'
        });
        return;
    }
};
exports.validateApiKey = validateApiKey;
/**
 * JWTトークン生成
 */
const generateJWT = (userId, email) => {
    const payload = {
        userId,
        email,
        iat: Math.floor(Date.now() / 1000),
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
exports.generateJWT = generateJWT;
/**
 * JWT検証ミドルウェア
 */
const verifyJWT = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'JWT token is required. Please provide Authorization: Bearer <token> header.'
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        // リクエストにユーザー情報を付与
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
    }
    catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid JWT token.'
            });
            return;
        }
        console.error('JWT verification error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to verify JWT token.'
        });
        return;
    }
};
exports.verifyJWT = verifyJWT;
/**
 * ホワイトリストチェック
 */
const checkWhitelist = async (userId) => {
    var _a;
    try {
        const whitelistDoc = await admin.firestore()
            .collection('allowed_users')
            .doc(userId)
            .get();
        return whitelistDoc.exists && ((_a = whitelistDoc.data()) === null || _a === void 0 ? void 0 : _a.isAllowed) === true;
    }
    catch (error) {
        console.error('Whitelist check error:', error);
        return false;
    }
};
exports.checkWhitelist = checkWhitelist;
//# sourceMappingURL=auth.js.map