import { Request, Response } from 'express';
import { Notification, User, Blog, Comment } from '../models/sequelize';

interface ICreateNotificationOptions {
    recipientId: number;
    senderId: number;
    type: 'like' | 'comment' | 'follow' | 'mention' | 'reply' | 'system';
    content?: string;
    relatedBlogId?: number;
    relatedCommentId?: number;
}

// 创建通知
export const createNotification = async (options: ICreateNotificationOptions) => {
    try {
        const { recipientId, senderId, type, content, relatedBlogId, relatedCommentId } = options;

        // 不给自己发送通知
        if (recipientId === senderId) {
            return null;
        }

        // 生成默认内容
        let finalContent = content;
        if (!finalContent) {
            switch (type) {
                case 'like':
                    finalContent = '点赞了你的文章';
                    break;
                case 'comment':
                    finalContent = '评论了你的文章';
                    break;
                case 'follow':
                    finalContent = '关注了你';
                    break;
                default:
                    finalContent = '向你发送了一条通知';
            }
        }

        const notification = await Notification.create({
            recipientId,
            senderId,
            type,
            content: finalContent,
            relatedBlogId: relatedBlogId || null,
            relatedCommentId: relatedCommentId || null
        });

        return notification;
    } catch (error) {
        console.error('创建通知失败:', error);
        throw error;
    }
};

// 获取用户的通知列表
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        const { count: totalNotifications, rows: notifications } = await Notification.findAndCountAll({
            where: { recipientId: userId },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'username', 'avatar'] },
                { model: Blog, as: 'relatedBlog', attributes: ['id', 'title'] },
                { model: Comment, as: 'relatedComment', attributes: ['id', 'content'] }
            ],
            order: [['createdAt', 'DESC']],
            offset,
            limit
        });

        const unreadCount = await Notification.count({
            where: { recipientId: userId, isRead: false }
        });

        const totalPages = Math.ceil(totalNotifications / limit);

        res.render('notifications', {
            notifications: notifications.map(n => n.get({ plain: true })),
            unreadCount,
            currentPage: page,
            totalPages
        });
    } catch (error: any) {
        console.error('获取通知失败:', error);
        res.status(500).render('error', {
            message: '获取通知失败',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// 标记通知为已读
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const notificationId = parseInt(req.params.notificationId);
        const userId = req.session.user.id;

        const [affectedRows] = await Notification.update(
            { isRead: true },
            { where: { id: notificationId, recipientId: userId } }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ success: false, message: '通知不存在' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('标记通知失败:', error);
        res.status(500).json({ success: false, message: '操作失败' });
    }
};

// 标记所有通知为已读
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user.id;

        await Notification.update(
            { isRead: true },
            { where: { recipientId: userId, isRead: false } }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('标记所有通知失败:', error);
        res.status(500).json({ success: false, message: '操作失败' });
    }
};

// 获取未读通知数量
export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user.id;

        const unreadCount = await Notification.count({
            where: { recipientId: userId, isRead: false }
        });

        res.json({ success: true, count: unreadCount });
    } catch (error) {
        console.error('获取未读数量失败:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
};

// 删除通知
export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const notificationId = parseInt(req.params.notificationId);
        const userId = req.session.user.id;

        const deletedCount = await Notification.destroy({
            where: { id: notificationId, recipientId: userId }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ success: false, message: '通知不存在' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('删除通知失败:', error);
        res.status(500).json({ success: false, message: '删除失败' });
    }
};
