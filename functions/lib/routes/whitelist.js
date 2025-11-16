"use strict";
/**
 * ホワイトリスト管理エンドポイント
 * GET /api/whitelist - ホワイトリスト一覧取得
 * POST /api/whitelist - ユーザーをホワイトリストに追加
 * DELETE /api/whitelist/:userId - ユーザーをホワイトリストから削除
 * GET /api/whitelist/check/:userId - ユーザーのホワイトリスト状態確認
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.whitelistRouter = void 0;
const express_1 = require("express");
const admin = require("firebase-admin");
exports.whitelistRouter = (0, express_1.Router)();
/**
 * GET /api/whitelist
 * ホワイトリスト一覧取得（管理者のみ）
 */
exports.whitelistRouter.get('/', async (req, res) => {
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
            var _a;
            const data = doc.data();
            return {
                userId: doc.id,
                email: data.email,
                displayName: data.displayName,
                addedAt: (_a = data.addedAt) === null || _a === void 0 ? void 0 : _a.toDate(),
                addedBy: data.addedBy
            };
        });
        res.status(200).json({
            count: whitelist.length,
            users: whitelist
        });
    }
    catch (error) {
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
exports.whitelistRouter.post('/', async (req, res) => {
    try {
        const userId = req.userId;
        const { targetUserId, email, displayName } = req.body;
        // TODO: 管理者権限チェックを実装
        if (!targetUserId && !email) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'targetUserId or email is required.'
            });
            return;
        }
        let targetUser;
        if (targetUserId) {
            try {
                targetUser = await admin.auth().getUser(targetUserId);
            }
            catch (error) {
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
        else if (email) {
            try {
                targetUser = await admin.auth().getUserByEmail(email);
            }
            catch (error) {
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
            displayName: displayName || targetUser.displayName || (email === null || email === void 0 ? void 0 : email.split('@')[0]),
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
    }
    catch (error) {
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
exports.whitelistRouter.delete('/:userId', async (req, res) => {
    try {
        const adminUserId = req.userId;
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
    }
    catch (error) {
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
exports.whitelistRouter.get('/check/:userId', async (req, res) => {
    var _a, _b, _c, _d, _e;
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
        const isAllowed = whitelistDoc.exists && ((_a = whitelistDoc.data()) === null || _a === void 0 ? void 0 : _a.isAllowed) === true;
        res.status(200).json({
            userId,
            isAllowed,
            details: whitelistDoc.exists ? {
                email: (_b = whitelistDoc.data()) === null || _b === void 0 ? void 0 : _b.email,
                displayName: (_c = whitelistDoc.data()) === null || _c === void 0 ? void 0 : _c.displayName,
                addedAt: (_e = (_d = whitelistDoc.data()) === null || _d === void 0 ? void 0 : _d.addedAt) === null || _e === void 0 ? void 0 : _e.toDate()
            } : null
        });
    }
    catch (error) {
        console.error('Check whitelist error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to check whitelist status.'
        });
    }
});
//# sourceMappingURL=whitelist.js.map