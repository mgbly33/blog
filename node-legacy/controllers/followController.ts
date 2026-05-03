import { Request, Response } from 'express';
import User from '../models/user';
import cache from '../utils/cache';
import { createNotification } from './notificationController';

// 关注用户
export const followUser = async (req: Request, res: Response) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.session.user._id;

        // 不能关注自己
        if (targetUserId === currentUserId.toString()) {
            return res.status(400).json({ error: '不能关注自己' });
        }

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 检查是否已经关注
        const alreadyFollowing = currentUser!.following.some(id => id.toString() === targetUserId);

        if (alreadyFollowing) {
            return res.status(400).json({ error: '已经关注过该用户' });
        }

        // 添加关注关系
        // @ts-ignore
        currentUser!.following.push(targetUserId);
        // @ts-ignore
        targetUser!.followers.push(currentUserId);

        await currentUser!.save();
        await targetUser!.save();

        // 创建关注通知
        await createNotification({
            recipient: targetUserId,
            sender: currentUserId,
            type: 'follow',
            content: `${req.session.user.username} 关注了你`
        });

        // 更新 session
        req.session.user = currentUser;

        // 清除缓存
        await cache.clear();

        res.json({
            success: true,
            following: true,
            followingCount: currentUser!.following.length,
            followersCount: targetUser!.followers.length
        });
    } catch (err: any) {
        console.error('关注失败:', err);
        res.status(500).json({ error: '关注失败' });
    }
};

// 取消关注
export const unfollowUser = async (req: Request, res: Response) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.session.user._id;

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 移除关注关系
        currentUser!.following = currentUser!.following.filter(
            id => id.toString() !== targetUserId
        );
        targetUser!.followers = targetUser!.followers.filter(
            id => id.toString() !== currentUserId.toString()
        );

        await currentUser!.save();
        await targetUser!.save();

        // 更新 session
        req.session.user = currentUser;

        // 清除缓存
        await cache.clear();

        res.json({
            success: true,
            following: false,
            followingCount: currentUser!.following.length,
            followersCount: targetUser!.followers.length
        });
    } catch (err: any) {
        console.error('取消关注失败:', err);
        res.status(500).json({ error: '取消关注失败' });
    }
};

// 获取用户的关注列表
export const getFollowing = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId)
            .populate('following', 'username avatar bio')
            .lean();

        if (!user) {
            return res.status(404).send('用户不存在');
        }

        res.render('user_following', {
            targetUser: user,
            following: user.following || []
        });
    } catch (err: any) {
        console.error('获取关注列表失败:', err);
        res.status(500).send(err.message);
    }
};

// 获取用户的粉丝列表
export const getFollowers = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId)
            .populate('followers', 'username avatar bio')
            .lean();

        if (!user) {
            return res.status(404).send('用户不存在');
        }

        res.render('user_followers', {
            targetUser: user,
            followers: user.followers || []
        });
    } catch (err: any) {
        console.error('获取粉丝列表失败:', err);
        res.status(500).send(err.message);
    }
};
