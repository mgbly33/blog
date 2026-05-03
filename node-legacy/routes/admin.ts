import express from 'express';
import * as adminController from '../controllers/adminController';
import { requireAdmin } from '../middleware/auth';

const router = express.Router();

// All admin routes require admin privileges
router.use(requireAdmin);

// --- User Management ---
router.get('/', adminController.getDashboard);
router.post('/user/delete/:id', adminController.deleteUser);
router.post('/user/toggle-ban/:id', adminController.toggleBan);
router.post('/user/reset-password/:id', adminController.resetPassword);

// --- Blog Management ---
router.get('/blogs', adminController.getBlogs);
router.post('/blog/delete/:id', adminController.deleteBlog);
router.post('/blog/toggle-sticky/:id', adminController.toggleSticky);
router.post('/blog/approve/:id', adminController.approveBlog);
router.post('/blog/reject/:id', adminController.rejectBlog);

// --- Comment Management ---
router.get('/comments', adminController.getComments);
router.get('/comments/blog/:id', adminController.getBlogComments);
router.post('/comment/delete/:id', adminController.deleteComment);

// --- Category Management ---
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.postCategory);
router.post('/categories/update/:id', adminController.updateCategory);
router.post('/categories/up/:id', adminController.categoryUp);
router.post('/categories/down/:id', adminController.categoryDown);
router.post('/categories/delete/:id', adminController.deleteCategory);

// --- Link Management ---
router.get('/links', adminController.getLinks);
router.post('/links', adminController.postLink);
router.post('/links/update/:id', adminController.updateLink);
router.post('/links/up/:id', adminController.linkUp);
router.post('/links/down/:id', adminController.linkDown);
router.post('/links/delete/:id', adminController.deleteLink);

export default router;
