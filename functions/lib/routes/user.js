"use strict";
/**
 * ユーザー管理エンドポイント
 * GET /api/user - ユーザー情報取得
 * PUT /api/user - ユーザー情報更新
 * GET /api/user/profile - プロフィール取得
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const admin = require("firebase-admin");
exports.userRouter = (0, express_1.Router)();
/**
 * GET /api/user
 * 現在のユーザー情報取得
 */
exports.userRouter.get('/', async (req, res) => {
    var _a;
    try {
        const userId = req.userId;
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
            displayName: (userProfile === null || userProfile === void 0 ? void 0 : userProfile.displayName) || userRecord.displayName,
            photoURL: (userProfile === null || userProfile === void 0 ? void 0 : userProfile.photoURL) || userRecord.photoURL,
            createdAt: ((_a = userProfile === null || userProfile === void 0 ? void 0 : userProfile.createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) || userRecord.metadata.creationTime,
            isAllowed: (userProfile === null || userProfile === void 0 ? void 0 : userProfile.isAllowed) || false
        });
    }
    catch (error) {
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
exports.userRouter.put('/', async (req, res) => {
    try {
        const userId = req.userId;
        const { displayName, photoURL } = req.body;
        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in token.'
            });
            return;
        }
        // Firebase Authのユーザー情報更新
        const updateData = {};
        if (displayName !== undefined)
            updateData.displayName = displayName;
        if (photoURL !== undefined)
            updateData.photoURL = photoURL;
        if (Object.keys(updateData).length > 0) {
            await admin.auth().updateUser(userId, updateData);
        }
        // Firestoreのプロフィール情報更新
        const userProfileRef = admin.firestore().collection('users').doc(userId);
        const profileUpdateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (displayName !== undefined)
            profileUpdateData.displayName = displayName;
        if (photoURL !== undefined)
            profileUpdateData.photoURL = photoURL;
        await userProfileRef.set(profileUpdateData, { merge: true });
        // 更新後のユーザー情報取得
        const userRecord = await admin.auth().getUser(userId);
        const userProfileDoc = await userProfileRef.get();
        const userProfile = userProfileDoc.data();
        res.status(200).json({
            id: userRecord.uid,
            email: userRecord.email,
            displayName: (userProfile === null || userProfile === void 0 ? void 0 : userProfile.displayName) || userRecord.displayName,
            photoURL: (userProfile === null || userProfile === void 0 ? void 0 : userProfile.photoURL) || userRecord.photoURL,
            updatedAt: new Date().toISOString()
        });
    }
    catch (error) {
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
exports.userRouter.get('/profile', async (req, res) => {
    var _a, _b;
    try {
        const userId = req.userId;
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
            id: (userProfile === null || userProfile === void 0 ? void 0 : userProfile.id) || userId,
            email: userProfile === null || userProfile === void 0 ? void 0 : userProfile.email,
            displayName: userProfile === null || userProfile === void 0 ? void 0 : userProfile.displayName,
            photoURL: userProfile === null || userProfile === void 0 ? void 0 : userProfile.photoURL,
            createdAt: (_a = userProfile === null || userProfile === void 0 ? void 0 : userProfile.createdAt) === null || _a === void 0 ? void 0 : _a.toDate(),
            updatedAt: (_b = userProfile === null || userProfile === void 0 ? void 0 : userProfile.updatedAt) === null || _b === void 0 ? void 0 : _b.toDate(),
            isAllowed: (userProfile === null || userProfile === void 0 ? void 0 : userProfile.isAllowed) || false
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get user profile.'
        });
    }
});
//# sourceMappingURL=user.js.map