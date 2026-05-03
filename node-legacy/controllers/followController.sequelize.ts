import { Request, Response } from 'express';
import { User, UserFollow } from '../models/sequelize';
import cache from '../utils/cache';
import { createNotification } from './notificationController.sequelize';

// 关注用户
export const followUser = async (req: Request, res: Response) => {
    try {
        const targetUserId = parseInt(req.params.id);
        const currentUserId = req.session.user.id;

        // 不能关注自己
        if (targetUserId === currentUserId) {
            return res.status(400).json({ error: '不能关注自己' });
        }

        const targetUser = await User.findByPk(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 检查是否已经关注
        const existingFollow = await UserFollow.findOne({
            where: { followerId: currentUserId, followingId: targetUserId }
        });

        if (existingFollow) {
            return res.status(400).json({ error: '已经关注过该用户' });
        }

        // 添加关注关系
        await UserFollow.create({
            followerId: currentUserId,
            followingId: targetUserId
        });

        // 创建关注通知
        await createNotification({
            recipientId: targetUserId,
            senderId: currentUserId,
            type: 'follow',
            content: `${req.session.user.username} 关注了你`
        });

        // 获取更新后的统计数据
        const followingCount = await UserFollow.count({ where: { followerId: currentUserId } });
        const followersCount = await UserFollow.count({ where: { followingId: targetUserId } });

        // 清除缓存
        await cache.clear();

        res.json({
            success: true,
            following: true,
            followingCount,
            followersCount
        });
    } catch (err: any) {
        console.error('关注失败:', err);
        res.status(500).json({ error: '关注失败' });
    }
};

// 取消关注
export const unfollowUser = async (req: Request, res: Response) => {
    try {
        const targetUserId = parseInt(req.params.id);
        const currentUserId = req.session.user.id;

        const targetUser = await User.findByPk(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 移除关注关系
        await UserFollow.destroy({
            where: { followerId: currentUserId, followingId: targetUserId }
        });

        // 获取更新后的统计数据
        const followingCount = await UserFollow.count({ where: { followerId: currentUserId } });
        const followersCount = await UserFollow.count({ where: { followingId: targetUserId } });

        // 清除缓存
        await cache.clear();

        res.json({
            success: true,
            following: false,
            followingCount,
            followersCount
        });
    } catch (err: any) {
        console.error('取消关注失败:', err);
        res.status(500).json({ error: '取消关注失败' });
    }
};

// 获取用户的关注列表
export const getFollowing = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);

        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'avatar', 'bio']
        });

        if (!user) {
            return res.status(404).send('用户不存在');
        }

        // 获取关注的用户
        const follows = await UserFollow.findAll({
            where: { followerId: userId },
            include: [
                {
                    model: User,
                    as: 'following',
                    attributes: ['id', 'username', 'avatar', 'bio']
                }
            ]
        });

        const following = follows.map((f: any) => f.following);

        res.render('user_following', {
            targetUser: user.get({ plain: true }),
            following
        });
    } catch (err: any) {
        console.error('获取关注列表失败:', err);
        res.status(500).send(err.message);
    }
};

// 获取用户的粉丝列表
export const getFollowers = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);

        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'avatar', 'bio']
        });

        if (!user) {
            return res.status(404).send('用户不存在');
        }

        // 获取粉丝
        const follows = await UserFollow.findAll({
            where: { followingId: userId },
            include: [
                {
                    model: User,
                    as: 'follower',
                    attributes: ['id', 'username', 'avatar', 'bio']
                }
            ]
        });

        const followers = follows.map((f: any) => f.follower);

        res.render('user_followers', {
            targetUser: user.get({ plain: true }),
            followers
        });
    } catch (err: any) {
        console.error('获取粉丝列表失败:', err);
        res.status(500).send(err.message);
    }
};
