import express from 'express';
import * as followController from '../controllers/followController.sequelize';
import { requireLogin } from '../middleware/auth';

const router = express.Router();

// 关注用户
router.post('/user/:id/follow', requireLogin, followController.followUser);

// 取消关注
router.post('/user/:id/unfollow', requireLogin, followController.unfollowUser);

// 查看关注列表
router.get('/user/:id/following', followController.getFollowing);

// 查看粉丝列表
router.get('/user/:id/followers', followController.getFollowers);

export default router;
