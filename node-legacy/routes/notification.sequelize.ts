import express, { Request, Response, NextFunction } from 'express';
import * as notificationController from '../controllers/notificationController.sequelize';

const router = express.Router();

// 中间件：确保用户已登录
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// 获取通知列表页面
router.get('/notifications', requireAuth, notificationController.getNotifications);

// 获取未读通知数量（API）
router.get('/api/notifications/unread-count', requireAuth, notificationController.getUnreadCount);

// 标记单个通知为已读（API）
router.post('/api/notifications/:notificationId/read', requireAuth, notificationController.markAsRead);

// 标记所有通知为已读（API）
router.post('/api/notifications/read-all', requireAuth, notificationController.markAllAsRead);

// 删除通知（API）
router.delete('/api/notifications/:notificationId', requireAuth, notificationController.deleteNotification);

export default router;
