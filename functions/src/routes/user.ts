/**
 * ユーザー管理エンドポイント
 * GET /api/user - ユーザー情報取得
 * PUT /api/user - ユーザー情報更新
 * GET /api/user/profile - プロフィール取得
 */

import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';

export const userRouter = Router();

/**
 * GET /api/user
 * 現在のユーザー情報取得
 */
userRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found in token.'
      });
      return;
    }

    // Firebase Authからユーザー情報取得
    const userRecord = await admin.auth().getUser(userId);

    // Firestoreからプロフィール情報取得
    const userProfileDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    const userProfile = userProfileDoc.exists ? userProfileDoc.data() : null;

    res.status(200).json({
      id: userRecord.uid,
      email: userRecord.email,
      displayName: userProfile?.displayName || userRecord.displayName,
      photoURL: userProfile?.photoURL || userRecord.photoURL,
      createdAt: userProfile?.createdAt?.toDate() || userRecord.metadata.creationTime,
      isAllowed: userProfile?.isAllowed || false
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    
    if (error.code === 'auth/user-not-found') {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found.'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user information.'
    });
  }
});

/**
 * PUT /api/user
 * ユーザー情報更新
 */
userRouter.put('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { displayName, photoURL } = req.body;

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found in token.'
      });
      return;
    }

    // Firebase Authのユーザー情報更新
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;

    if (Object.keys(updateData).length > 0) {
      await admin.auth().updateUser(userId, updateData);
    }

    // Firestoreのプロフィール情報更新
    const userProfileRef = admin.firestore().collection('users').doc(userId);
    const profileUpdateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (displayName !== undefined) profileUpdateData.displayName = displayName;
    if (photoURL !== undefined) profileUpdateData.photoURL = photoURL;

    await userProfileRef.set(profileUpdateData, { merge: true });

    // 更新後のユーザー情報取得
    const userRecord = await admin.auth().getUser(userId);
    const userProfileDoc = await userProfileRef.get();
    const userProfile = userProfileDoc.data();

    res.status(200).json({
      id: userRecord.uid,
      email: userRecord.email,
      displayName: userProfile?.displayName || userRecord.displayName,
      photoURL: userProfile?.photoURL || userRecord.photoURL,
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    
    if (error.code === 'auth/user-not-found') {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found.'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user information.'
    });
  }
});

/**
 * GET /api/user/profile
 * ユーザープロフィール詳細取得
 */
userRouter.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found in token.'
      });
      return;
    }

    // Firestoreからプロフィール情報取得
    const userProfileDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userProfileDoc.exists) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User profile not found.'
      });
      return;
    }

    const userProfile = userProfileDoc.data();

    res.status(200).json({
      id: userProfile?.id || userId,
      email: userProfile?.email,
      displayName: userProfile?.displayName,
      photoURL: userProfile?.photoURL,
      createdAt: userProfile?.createdAt?.toDate(),
      updatedAt: userProfile?.updatedAt?.toDate(),
      isAllowed: userProfile?.isAllowed || false
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user profile.'
    });
  }
});

