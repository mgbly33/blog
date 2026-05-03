import { Request, Response } from 'express';
import Notification from '../models/notification';

interface ICreateNotificationOptions {
    recipient: any;
    sender: any;
    type: 'like' | 'comment' | 'follow' | 'mention' | 'reply' | 'system';
    content?: string;
    blog?: any;
    relatedBlog?: any;
    comment?: any;
    relatedComment?: any;
}

// 创建通知
export const createNotification = async (options: ICreateNotificationOptions) => {
    try {
        const { recipient, sender, type, content, blog, relatedBlog, comment, relatedComment } = options;

        const recipientId = recipient;
        const senderId = sender;
        const finalRelatedBlog = relatedBlog || blog;
        const finalRelatedComment = relatedComment || comment;

        // 不给自己发送通知
        if (recipientId.toString() === senderId.toString()) {
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

        const notification = new Notification({
            recipient: recipientId,
            sender: senderId,
            type,
            content: finalContent,
            relatedBlog: finalRelatedBlog,
            relatedComment: finalRelatedComment
        });

        await notification.save();
        return notification;
    } catch (error) {
        console.error('创建通知失败:', error);
        throw error;
    }
};

// 获取用户的通知列表
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ recipient: userId })
            .populate('sender', 'username avatar')
            .populate('relatedBlog', 'title')
            .populate('relatedComment', 'content')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalNotifications = await Notification.countDocuments({ recipient: userId });
        const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });
        const totalPages = Math.ceil(totalNotifications / limit);

        res.render('notifications', {
            notifications,
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
        const { notificationId } = req.params;
        const userId = req.session.user._id;

        const notification = await Notification.findOne({
            _id: notificationId,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: '通知不存在' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ success: true });
    } catch (error) {
        console.error('标记通知失败:', error);
        res.status(500).json({ success: false, message: '操作失败' });
    }
};

// 标记所有通知为已读
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user._id;

        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
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
        const userId = req.session.user._id;

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
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
        const { notificationId } = req.params;
        const userId = req.session.user._id;

        const result = await Notification.deleteOne({
            _id: notificationId,
            recipient: userId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: '通知不存在' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('删除通知失败:', error);
        res.status(500).json({ success: false, message: '删除失败' });
    }
};
