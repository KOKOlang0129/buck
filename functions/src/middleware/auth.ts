/**
 * 認証ミドルウェア
 * - APIキー検証
 * - JWT生成・検証
 * - ホワイトリストチェック
 */

import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * APIキー検証ミドルウェア
 * リクエストヘッダーの x-api-key を検証
 */
export const validateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

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
    (req as any).apiKey = apiKeyData;
    (req as any).apiKeyId = apiKeyDoc.docs[0].id;

    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to validate API key.' 
    });
    return;
  }
};

/**
 * JWTトークン生成
 */
export const generateJWT = (userId: string, email: string): string => {
  const payload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * JWT検証ミドルウェア
 */
export const verifyJWT = (req: Request, res: Response, next: NextFunction): void => {
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
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // リクエストにユーザー情報を付与
    (req as any).userId = decoded.userId;
    (req as any).userEmail = decoded.email;

    next();
  } catch (error) {
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

/**
 * ホワイトリストチェック
 */
export const checkWhitelist = async (userId: string): Promise<boolean> => {
  try {
    const whitelistDoc = await admin.firestore()
      .collection('allowed_users')
      .doc(userId)
      .get();

    return whitelistDoc.exists && whitelistDoc.data()?.isAllowed === true;
  } catch (error) {
    console.error('Whitelist check error:', error);
    return false;
  }
};

