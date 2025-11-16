/**
 * ホワイトリスト管理エンドポイント
 * GET /api/whitelist - ホワイトリスト一覧取得
 * POST /api/whitelist - ユーザーをホワイトリストに追加
 * DELETE /api/whitelist/:userId - ユーザーをホワイトリストから削除
 * GET /api/whitelist/check/:userId - ユーザーのホワイトリスト状態確認
 */

import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';

export const whitelistRouter = Router();

/**
 * GET /api/whitelist
 * ホワイトリスト一覧取得（管理者のみ）
 */
whitelistRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // const userId = (req as any).userId; // TODO: 管理者権限チェックで使用

    // TODO: 管理者権限チェックを実装
    // const isAdmin = await checkAdminRole(userId);
    // if (!isAdmin) {
    //   return res.status(403).json({ error: 'Forbidden', message: 'Admin access required.' });
    // }

    const whitelistSnapshot = await admin.firestore()
      .collection('allowed_users')
      .where('isAllowed', '==', true)
      .get();

    const whitelist = whitelistSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: doc.id,
        email: data.email,
        displayName: data.displayName,
        addedAt: data.addedAt?.toDate(),
        addedBy: data.addedBy
      };
    });

    res.status(200).json({
      count: whitelist.length,
      users: whitelist
    });
  } catch (error: any) {
    console.error('Get whitelist error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get whitelist.'
    });
  }
});

/**
 * POST /api/whitelist
 * ユーザーをホワイトリストに追加
 */
whitelistRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { targetUserId, email, displayName } = req.body;

    // TODO: 管理者権限チェックを実装

    if (!targetUserId && !email) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'targetUserId or email is required.'
      });
      return;
    }

    let targetUser: admin.auth.UserRecord | undefined;
    if (targetUserId) {
      try {
        targetUser = await admin.auth().getUser(targetUserId);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          res.status(404).json({
            error: 'Not Found',
            message: 'User not found.'
          });
          return;
        }
        throw error;
      }
    } else if (email) {
      try {
        targetUser = await admin.auth().getUserByEmail(email);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          res.status(404).json({
            error: 'Not Found',
            message: 'User not found.'
          });
          return;
        }
        throw error;
      }
    }

    if (!targetUser) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Unable to find user. Please provide valid targetUserId or email.'
      });
      return;
    }

    const targetUserIdFinal = targetUser.uid;

    // ホワイトリストに追加
    await admin.firestore()
      .collection('allowed_users')
      .doc(targetUserIdFinal)
      .set({
        userId: targetUserIdFinal,
        email: targetUser.email,
        displayName: displayName || targetUser.displayName || email?.split('@')[0],
        isAllowed: true,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
        addedBy: userId
      }, { merge: true });

    // ユーザープロフィールも更新
    await admin.firestore()
      .collection('users')
      .doc(targetUserIdFinal)
      .set({
        isAllowed: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

    res.status(200).json({
      message: 'User added to whitelist successfully.',
      user: {
        userId: targetUserIdFinal,
        email: targetUser.email,
        displayName: displayName || targetUser.displayName
      }
    });
  } catch (error: any) {
    console.error('Add to whitelist error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add user to whitelist.'
    });
  }
});

/**
 * DELETE /api/whitelist/:userId
 * ユーザーをホワイトリストから削除
 */
whitelistRouter.delete('/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = (req as any).userId;
    const { userId } = req.params;

    // TODO: 管理者権限チェックを実装

    if (!userId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'User ID is required.'
      });
      return;
    }

    // ホワイトリストから削除
    await admin.firestore()
      .collection('allowed_users')
      .doc(userId)
      .update({
        isAllowed: false,
        removedAt: admin.firestore.FieldValue.serverTimestamp(),
        removedBy: adminUserId
      });

    // ユーザープロフィールも更新
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        isAllowed: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.status(200).json({
      message: 'User removed from whitelist successfully.',
      userId
    });
  } catch (error: any) {
    console.error('Remove from whitelist error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove user from whitelist.'
    });
  }
});

/**
 * GET /api/whitelist/check/:userId
 * ユーザーのホワイトリスト状態確認
 */
whitelistRouter.get('/check/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'User ID is required.'
      });
      return;
    }

    const whitelistDoc = await admin.firestore()
      .collection('allowed_users')
      .doc(userId)
      .get();

    const isAllowed = whitelistDoc.exists && whitelistDoc.data()?.isAllowed === true;

    res.status(200).json({
      userId,
      isAllowed,
      details: whitelistDoc.exists ? {
        email: whitelistDoc.data()?.email,
        displayName: whitelistDoc.data()?.displayName,
        addedAt: whitelistDoc.data()?.addedAt?.toDate()
      } : null
    });
  } catch (error: any) {
    console.error('Check whitelist error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check whitelist status.'
    });
  }
});

