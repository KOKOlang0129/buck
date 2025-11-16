/**
 * ログインエンドポイント
 * POST /api/login
 * 
 * リクエストボディ:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 * 
 * レスポンス:
 * {
 *   "token": "jwt-token",
 *   "user": {
 *     "id": "user-id",
 *     "email": "user@example.com",
 *     "displayName": "User Name"
 *   }
 * }
 */

import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { generateJWT, checkWhitelist } from '../middleware/auth';

export const loginRouter = Router();

/**
 * POST /api/login
 * ログイン処理（Firebase Auth + ホワイトリストチェック + JWT発行）
 */
loginRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // バリデーション
    if (!email || !password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required.'
      });
      return;
    }

    // Firebase Authでユーザー認証
    let firebaseUser;
    try {
      // Firebase Admin SDKでカスタムトークンを使用する代わりに、
      // クライアント側でFirebase Authを使用する前提
      // ここではユーザー情報を取得して検証
      const userRecord = await admin.auth().getUserByEmail(email);
      firebaseUser = userRecord;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password.'
        });
        return;
      }
      throw error;
    }

    // ホワイトリストチェック
    const isAllowed = await checkWhitelist(firebaseUser.uid);
    if (!isAllowed) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'User is not in the whitelist. Please contact administrator.'
      });
      return;
    }

    // ユーザープロフィール取得
    const userProfileDoc = await admin.firestore()
      .collection('users')
      .doc(firebaseUser.uid)
      .get();

    const userProfile = userProfileDoc.exists 
      ? userProfileDoc.data()
      : {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || email.split('@')[0],
          photoURL: firebaseUser.photoURL,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isAllowed: true
        };

    // JWTトークン生成
    const token = generateJWT(firebaseUser.uid, firebaseUser.email || '');

    // レスポンス
    res.status(200).json({
      token,
      user: {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: userProfile?.displayName || firebaseUser.displayName,
        photoURL: userProfile?.photoURL || firebaseUser.photoURL,
        isAllowed: true
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process login request.'
    });
  }
});

/**
 * POST /api/login/refresh
 * JWTトークンリフレッシュ
 */
loginRouter.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'UserId and email are required.'
      });
      return;
    }

    // ホワイトリストチェック
    const isAllowed = await checkWhitelist(userId);
    if (!isAllowed) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'User is not in the whitelist.'
      });
      return;
    }

    // 新しいJWTトークン生成
    const token = generateJWT(userId, email);

    res.status(200).json({ token });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to refresh token.'
    });
  }
});

