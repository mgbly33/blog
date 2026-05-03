import express from 'express';
import * as tagController from '../controllers/tagController';

const router = express.Router();

// 获取所有标签（API）
router.get('/api/tags', tagController.getAllTags);

// 获取热门标签（API）
router.get('/api/tags/hot', tagController.getHotTags);

// 根据标签查询文章
router.get('/tag/:tagId', tagController.getBlogsByTag);

export default router;
