import { Request, Response } from 'express';
import crypto from 'crypto';
import { Op } from 'sequelize';
import {
    User,
    Blog,
    Comment,
    Category,
    Link,
    BlogTag,
    UserBookmark,
    Tag
} from '../models/sequelize';
import { deleteFile } from '../utils/fileHelper';

// --- Dashboard & User Management ---

// Dashboard - List Users
export const getDashboard = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const { count: totalUsers, rows: users } = await User.findAndCountAll({
            order: [['createdAt', 'DESC']],
            offset,
            limit
        });
        const totalBlogs = await Blog.count();
        const totalComments = await Comment.count();

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
        const userId = parseInt(req.params.id);
        const user = await User.findByPk(userId);
        const userBlogs = await Blog.findAll({ where: { authorId: userId } });

        // Delete user avatar using helper
        if (user && user.avatar && !user.avatar.startsWith('http')) {
            await deleteFile(user.avatar);
        }

        // Delete all blog images using helper
        for (const blog of userBlogs) {
            if (blog.image) {
                await deleteFile(blog.image);
            }
        }

        // Delete user and related data (cascades handle most of it)
        await User.destroy({ where: { id: userId } });
        res.redirect('/admin');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Toggle Ban
export const toggleBan = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await User.findByPk(userId);
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
        const userId = parseInt(req.params.id);
        const user = await User.findByPk(userId);
        if (user) {
            // 生成 12 位随机密码代替固定弱口令
            const tempPassword = crypto.randomBytes(6).toString('hex');
            user.password = tempPassword;
            await user.save();
            // 记录审计日志
            console.log(`Admin reset password for user ${user.username} (ID: ${user.id})`);
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
        const offset = (page - 1) * limit;

        const { count, rows: blogs } = await Blog.findAndCountAll({
            include: [
                { model: User, as: 'author', attributes: ['id', 'username'] }
            ],
            order: [
                ['status', 'DESC'],
                ['createdAt', 'DESC']
            ],
            offset,
            limit
        });

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
        const blogId = parseInt(req.params.id);
        const blog = await Blog.findByPk(blogId);
        if (blog) {
            // Delete image using helper
            if (blog.image) {
                await deleteFile(blog.image);
            }
            // Delete blog (cascade handles comments)
            await Blog.destroy({ where: { id: blogId } });
        }
        res.redirect('/admin/blogs');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Approve Blog
export const approveBlog = async (req: Request, res: Response) => {
    try {
        const blogId = parseInt(req.params.id);
        await Blog.update({ status: 'approved' }, { where: { id: blogId } });
        res.redirect('/admin/blogs');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Reject Blog
export const rejectBlog = async (req: Request, res: Response) => {
    try {
        const blogId = parseInt(req.params.id);
        await Blog.update({ status: 'rejected' }, { where: { id: blogId } });
        res.redirect('/admin/blogs');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Toggle Sticky
export const toggleSticky = async (req: Request, res: Response) => {
    try {
        const blogId = parseInt(req.params.id);
        const blog = await Blog.findByPk(blogId);
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
        const offset = (page - 1) * limit;

        const { count, rows: blogs } = await Blog.findAndCountAll({
            include: [
                { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }
            ],
            order: [['createdAt', 'DESC']],
            offset,
            limit,
            raw: true,
            nest: true
        });

        // Get comment counts for each blog
        const blogsWithCounts = await Promise.all(
            blogs.map(async (blog: any) => {
                const commentCount = await Comment.count({ where: { blogId: blog.id } });
                return { ...blog, commentCount };
            })
        );

        res.render('admin/comments', {
            blogs: blogsWithCounts,
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
        const blogId = parseInt(req.params.id);
        const blog = await Blog.findByPk(blogId);
        const comments = await Comment.findAll({
            where: { blogId },
            include: [
                { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }
            ],
            order: [['createdAt', 'DESC']]
        });

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
        const commentId = parseInt(req.params.id);
        const comment = await Comment.findByPk(commentId);
        if (comment) {
            const blogId = comment.blogId;
            await Comment.destroy({ where: { id: commentId } });
            // 同步更新博客评论计数
            await Blog.decrement('commentCount', { where: { id: blogId } });
            res.redirect('/admin/comments/blog/' + blogId);
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
        const categories = await Category.findAll({
            order: [
                ['order', 'ASC'],
                ['createdAt', 'DESC']
            ]
        });
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
            const lastCat = await Category.findOne({ order: [['order', 'DESC']] });
            order = lastCat ? lastCat.order + 1 : 1;
        }
        await Category.create({ name, order: parseInt(order) });
        res.redirect('/admin/categories');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Update Category
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const categoryId = parseInt(req.params.id);
        const { name, order } = req.body;
        await Category.update(
            { name, order: parseInt(order) },
            { where: { id: categoryId } }
        );
        res.redirect('/admin/categories');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Reorder Category Up
export const categoryUp = async (req: Request, res: Response) => {
    try {
        const categoryId = parseInt(req.params.id);
        const current = await Category.findByPk(categoryId);
        const prev = await Category.findOne({
            where: { order: { [Op.lt]: current!.order } },
            order: [['order', 'DESC']]
        });

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
        const categoryId = parseInt(req.params.id);
        const current = await Category.findByPk(categoryId);
        const next = await Category.findOne({
            where: { order: { [Op.gt]: current!.order } },
            order: [['order', 'ASC']]
        });

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
        const categoryId = parseInt(req.params.id);
        await Category.destroy({ where: { id: categoryId } });
        // Set categoryId to null for affected blogs (handled by onDelete: SET NULL)
        res.redirect('/admin/categories');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// --- Link Management ---

// List Links
export const getLinks = async (req: Request, res: Response) => {
    try {
        const links = await Link.findAll({
            order: [
                ['order', 'ASC'],
                ['createdAt', 'DESC']
            ]
        });
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
            const lastLink = await Link.findOne({ order: [['order', 'DESC']] });
            order = lastLink ? lastLink.order + 1 : 1;
        }
        await Link.create({ name, url, description, order: parseInt(order) });
        res.redirect('/admin/links');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Update Link
export const updateLink = async (req: Request, res: Response) => {
    try {
        const linkId = parseInt(req.params.id);
        const { name, url, description, order } = req.body;
        await Link.update(
            { name, url, description, order: parseInt(order) },
            { where: { id: linkId } }
        );
        res.redirect('/admin/links');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Reorder Link Up
export const linkUp = async (req: Request, res: Response) => {
    try {
        const linkId = parseInt(req.params.id);
        const current = await Link.findByPk(linkId);
        const prev = await Link.findOne({
            where: { order: { [Op.lt]: current!.order } },
            order: [['order', 'DESC']]
        });

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
        const linkId = parseInt(req.params.id);
        const current = await Link.findByPk(linkId);
        const next = await Link.findOne({
            where: { order: { [Op.gt]: current!.order } },
            order: [['order', 'ASC']]
        });

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
        const linkId = parseInt(req.params.id);
        await Link.destroy({ where: { id: linkId } });
        res.redirect('/admin/links');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};
