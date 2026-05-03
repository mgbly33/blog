import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/user';
import Blog from '../models/blog';
import Comment from '../models/comment';
import Category from '../models/category';
import Link from '../models/link';
import { deleteFile } from '../utils/fileHelper';

// --- Dashboard & User Management ---

// Dashboard - List Users
export const getDashboard = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const users = await User.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        const totalUsers = await User.countDocuments();
        const totalBlogs = await Blog.countDocuments();
        const totalComments = await Comment.countDocuments();

        res.render('admin/dashboard', {
            users,
            totalUsers,
            totalBlogs,
            totalComments,
            current: page,
            pages: Math.ceil(totalUsers / limit),
            path: '/admin'
        });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Delete User
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        const userBlogs = await Blog.find({ author: req.params.id });

        // Delete user avatar using helper
        if (user && user.avatar) {
            await deleteFile(user.avatar);
        }

        // Delete all blog images using helper
        for (const blog of userBlogs) {
            if (blog.image) {
                await deleteFile(blog.image);
            }
        }

        // Delete user and related data
        await User.findByIdAndDelete(req.params.id);
        await Blog.deleteMany({ author: req.params.id });
        await Comment.deleteMany({ author: req.params.id });
        res.redirect('/admin');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Toggle Ban
export const toggleBan = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (user && !user.isAdmin) {
            user.isBanned = !user.isBanned;
            await user.save();
        }
        res.redirect('/admin');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            // 生成 12 位随机密码代替固定弱口令
            const tempPassword = crypto.randomBytes(6).toString('hex');
            user.password = tempPassword;
            await user.save();
            // 记录审计日志
            console.log(`Admin reset password for user ${user.username} (ID: ${user._id})`);
            // 返回临时密码给管理员
            return res.json({
                success: true,
                tempPassword,
                message: `用户 ${user.username} 的密码已重置为: ${tempPassword}`
            });
        }
        res.status(404).json({ success: false, message: '用户不存在' });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- Blog Management ---

// List Blogs
export const getBlogs = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const blogs = await Blog.find().sort({ status: -1, createdAt: -1 }).populate('author', 'username').skip(skip).limit(limit);
        const count = await Blog.countDocuments();

        res.render('admin/blogs', {
            blogs,
            path: '/admin/blogs',
            current: page,
            pages: Math.ceil(count / limit)
        });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Delete Blog
export const deleteBlog = async (req: Request, res: Response) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (blog) {
            // Delete image using helper
            if (blog.image) {
                await deleteFile(blog.image);
            }
            await Blog.findByIdAndDelete(req.params.id);
            await Comment.deleteMany({ blogId: req.params.id });
        }
        res.redirect('/admin/blogs');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Approve Blog
export const approveBlog = async (req: Request, res: Response) => {
    try {
        await Blog.findByIdAndUpdate(req.params.id, { status: 'approved' });
        res.redirect('/admin/blogs');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Reject Blog
export const rejectBlog = async (req: Request, res: Response) => {
    try {
        await Blog.findByIdAndUpdate(req.params.id, { status: 'rejected' });
        res.redirect('/admin/blogs');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Toggle Sticky
export const toggleSticky = async (req: Request, res: Response) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (blog) {
            blog.isSticky = !blog.isSticky;
            await blog.save();
        }
        res.redirect('/admin/blogs');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// --- Comment Management ---

// List Articles for Comment Management
export const getComments = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // Fetch blogs instead of comments directly
        const blogs = await Blog.find()
            .sort({ createdAt: -1 })
            .populate('author', 'username avatar')
            .skip(skip)
            .limit(limit)
            .lean();

        const count = await Blog.countDocuments();

        // Get comment counts for each blog
        for (const blog of blogs) {
            // @ts-ignore
            blog.commentCount = await Comment.countDocuments({ blogId: blog._id });
        }

        res.render('admin/comments', {
            blogs,
            path: '/admin/comments',
            current: page,
            pages: Math.ceil(count / limit)
        });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// List Comments for a specific Article
export const getBlogComments = async (req: Request, res: Response) => {
    try {
        const blog = await Blog.findById(req.params.id);
        const comments = await Comment.find({ blogId: req.params.id })
            .sort({ createdAt: -1 })
            .populate('author', 'username avatar');

        res.render('admin/blog_comments', {
            blog,
            comments,
            path: '/admin/comments'
        });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Delete Comment
export const deleteComment = async (req: Request, res: Response) => {
    try {
        const comment = await Comment.findByIdAndDelete(req.params.id);
        if (comment) {
            // 同步更新博客评论计数
            await Blog.findByIdAndUpdate(comment.blogId, { $inc: { commentCount: -1 } });
            res.redirect('/admin/comments/blog/' + comment.blogId);
        } else {
            res.redirect('/admin/comments');
        }
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// --- Category Management ---

// List Categories
export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await Category.find().sort({ order: 1, createdAt: -1 });
        res.render('admin/categories', {
            categories,
            path: '/admin/categories'
        });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Create Category
export const postCategory = async (req: Request, res: Response) => {
    try {
        let { name, order } = req.body;
        if (!order || parseInt(order) === 0) {
            const lastCat = await Category.findOne().sort({ order: -1 });
            order = lastCat ? lastCat.order + 1 : 1;
        }
        await Category.create({ name, order });
        res.redirect('/admin/categories');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Update Category
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { name, order } = req.body;
        await Category.findByIdAndUpdate(req.params.id, { name, order });
        res.redirect('/admin/categories');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Reorder Category Up
export const categoryUp = async (req: Request, res: Response) => {
    try {
        const current = await Category.findById(req.params.id);
        const prev = await Category.findOne({ order: { $lt: current!.order } }).sort({ order: -1 });

        if (prev) {
            const temp = current!.order;
            current!.order = prev.order;
            prev.order = temp;
            await current!.save();
            await prev.save();
        }
        res.redirect('/admin/categories');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Reorder Category Down
export const categoryDown = async (req: Request, res: Response) => {
    try {
        const current = await Category.findById(req.params.id);
        const next = await Category.findOne({ order: { $gt: current!.order } }).sort({ order: 1 });

        if (next) {
            const temp = current!.order;
            current!.order = next.order;
            next.order = temp;
            await current!.save();
            await next.save();
        }
        res.redirect('/admin/categories');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Delete Category
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        await Blog.updateMany({ category: req.params.id }, { $unset: { category: "" } });
        res.redirect('/admin/categories');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// --- Link Management ---

// List Links
export const getLinks = async (req: Request, res: Response) => {
    try {
        const links = await Link.find().sort({ order: 1, createdAt: -1 });
        res.render('admin/links', {
            links,
            path: '/admin/links'
        });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Create Link
export const postLink = async (req: Request, res: Response) => {
    try {
        let { name, url, description, order } = req.body;
        if (!order || parseInt(order) === 0) {
            const lastLink = await Link.findOne().sort({ order: -1 });
            order = lastLink ? lastLink.order + 1 : 1;
        }
        await Link.create({ name, url, description, order });
        res.redirect('/admin/links');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Update Link
export const updateLink = async (req: Request, res: Response) => {
    try {
        const { name, url, description, order } = req.body;
        await Link.findByIdAndUpdate(req.params.id, { name, url, description, order });
        res.redirect('/admin/links');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Reorder Link Up
export const linkUp = async (req: Request, res: Response) => {
    try {
        const current = await Link.findById(req.params.id);
        const prev = await Link.findOne({ order: { $lt: current!.order } }).sort({ order: -1 });

        if (prev) {
            const temp = current!.order;
            current!.order = prev.order;
            prev.order = temp;
            await current!.save();
            await prev.save();
        }
        res.redirect('/admin/links');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Reorder Link Down
export const linkDown = async (req: Request, res: Response) => {
    try {
        const current = await Link.findById(req.params.id);
        const next = await Link.findOne({ order: { $gt: current!.order } }).sort({ order: 1 });

        if (next) {
            const temp = current!.order;
            current!.order = next.order;
            next.order = temp;
            await current!.save();
            await next.save();
        }
        res.redirect('/admin/links');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Delete Link
export const deleteLink = async (req: Request, res: Response) => {
    try {
        await Link.findByIdAndDelete(req.params.id);
        res.redirect('/admin/links');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};
