import express from 'express';
import * as searchController from '../controllers/searchController.sequelize';

const router = express.Router();

// 搜索页面和结果
router.get('/search', searchController.searchBlogs);

// 搜索建议（API）
router.get('/api/search/suggestions', searchController.searchSuggestions);

// 推荐文章（API）
router.get('/api/recommended', searchController.getRecommendedBlogs);

// 热门文章（API）
router.get('/api/hot', searchController.getHotBlogs);

export default router;
