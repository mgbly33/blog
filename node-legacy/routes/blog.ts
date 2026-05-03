import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import * as blogController from '../controllers/blogController';
import { requireLogin } from '../middleware/auth';
import { optimizeImage } from '../utils/imageOptimizer';

const router = express.Router();

// --- Multer 图片上传配置 ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads/'));
    },
    filename: function (req, file, cb) {
        cb(null, 'blog-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 限制文件大小为5MB
    fileFilter: function (req, file, cb) {
        // 只允许图片格式
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只支持图片文件 (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// 图片优化中间件
async function optimizeUploadedImage(req: Request, res: Response, next: NextFunction) {
    if (req.file) {
        try {
            await optimizeImage(req.file.path, {
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 80
            });
        } catch (error) {
            console.error('图片优化失败:', error);
        }
    }
    next();
}

// --- 博客相关路由 ---

// 首页：博客列表
router.get('/', blogController.getHome);

// 新建博客页面 (需要登录)
router.get('/blog/new', requireLogin, blogController.getNewBlog);

// 提交新建博客 (处理图片上传)
router.post('/blog', requireLogin, upload.single('image'), optimizeUploadedImage, blogController.postNewBlog);

// 编辑博客页面
router.get('/blog/edit/:id', requireLogin, blogController.getEditBlog);

// 提交编辑博客
router.post('/blog/edit/:id', requireLogin, upload.single('image'), optimizeUploadedImage, blogController.postEditBlog);

// 删除博客
router.post('/blog/delete/:id', requireLogin, blogController.deleteBlog);

// 博客详情页
router.get('/blog/:id', blogController.getBlogDetail);

// 点赞接口 (AJAX)
router.post('/blog/:id/like', requireLogin, blogController.toggleLike);

// 收藏接口 (AJAX)
router.post('/blog/:id/bookmark', requireLogin, blogController.toggleBookmark);

// 发表评论
router.post('/blog/:id/comment', requireLogin, blogController.postComment);

// 更新评论
router.post('/comment/update/:id', requireLogin, blogController.updateComment);

// 删除评论
router.post('/comment/delete/:id', requireLogin, blogController.deleteComment);

export default router;
