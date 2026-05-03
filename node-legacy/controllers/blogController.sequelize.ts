import { Request, Response } from 'express';
import { Op, literal } from 'sequelize';
import {
    User,
    Blog,
    Comment,
    Category,
    Link,
    Tag,
    BlogTag,
    BlogLike,
    UserBookmark
} from '../models/sequelize';
import { deleteFile } from '../utils/fileHelper';
import cache from '../utils/cache';
import viewCounter from '../utils/viewCounter';
import { findOrCreateTags } from './tagController.sequelize';
import { createNotification } from './notificationController.sequelize';

// 首页 - 博客列表
export const getHome = async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = 6;
        const offset = (page - 1) * limit;
        const query = req.query.q as string;
        const sortParam = req.query.sort || 'recommend';
        const categoryId = req.query.category;

        // 生成缓存键
        const cacheKey = `home_v2_${page}_${limit}_${query || 'all'}_${sortParam}_${categoryId || 'all'}_${req.session.user ? req.session.user.id : 'guest'}`;

        // 检查缓存
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            return res.render('index', cachedData);
        }

        // Build where clause
        const where: any = { status: 'approved' };

        if (query) {
            where.title = { [Op.like]: `%${query}%` };
        }
        if (categoryId) {
            where.categoryId = parseInt(categoryId as string);
        }

        // 可见性过滤
        if (req.session.user) {
            where[Op.or] = [
                { visibility: 'public' },
                { visibility: null },
                { authorId: req.session.user.id, visibility: 'private' }
            ];
        } else {
            where[Op.or] = [
                { visibility: 'public' },
                { visibility: null }
            ];
        }

        // Sort options
        let order: any[] = [['isSticky', 'DESC'], ['createdAt', 'DESC']];
        if (sortParam === 'latest') {
            order = [['createdAt', 'DESC']];
        } else if (sortParam === 'hot') {
            order = [['views', 'DESC']];
        }

        const { count, rows: blogs } = await Blog.findAndCountAll({
            where,
            include: [
                { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }
            ],
            order,
            offset,
            limit,
            raw: true,
            nest: true
        });

        // 侧边栏数据缓存键
        const sidebarCacheKey = `sidebar_${req.session.user ? req.session.user.id : 'guest'}`;
        let sidebarData: any = await cache.get(sidebarCacheKey);

        if (!sidebarData) {
            // 侧边栏数据：热门博客
            const hotBlogsWhere: any = { status: 'approved' };
            if (req.session.user) {
                hotBlogsWhere[Op.or] = [
                    { visibility: 'public' },
                    { visibility: null },
                    { authorId: req.session.user.id, visibility: 'private' }
                ];
            } else {
                hotBlogsWhere[Op.or] = [
                    { visibility: 'public' },
                    { visibility: null }
                ];
            }

            const hotBlogs = await Blog.findAll({
                where: hotBlogsWhere,
                attributes: ['id', 'title', 'views'],
                order: [['views', 'DESC']],
                limit: 5,
                raw: true
            });

            const links = await Link.findAll({
                order: [['order', 'ASC']],
                raw: true
            });
            const categories = await Category.findAll({
                order: [['order', 'ASC']],
                raw: true
            });

            sidebarData = { hotBlogs, links, categories };
            await cache.set(sidebarCacheKey, sidebarData, 600000); // 缓存10分钟
        }

        let userArticleCount = 0;
        if (req.session.user) {
            userArticleCount = await Blog.count({ where: { authorId: req.session.user.id } });
        }

        const renderData = {
            blogs,
            hotBlogs: sidebarData.hotBlogs,
            links: sidebarData.links,
            categories: sidebarData.categories,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            query,
            sort: sortParam,
            currentCategory: categoryId,
            userArticleCount,
            user: req.session.user || null
        };

        // 缓存首页数据 (60秒)
        await cache.set(cacheKey, renderData, 60000);

        res.render('index', renderData);
    } catch (err: any) {
        console.error('Home page error:', err);
        res.status(500).render('error', {
            message: '加载首页失败',
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }
};

// 新建博客页面
export const getNewBlog = async (req: Request, res: Response) => {
    try {
        const categories = await Category.findAll({
            order: [['order', 'ASC']],
            raw: true
        });
        res.render('blog_new', { categories, user: req.session.user || null });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// 提交新建博客
export const postNewBlog = async (req: Request, res: Response) => {
    try {
        const { title, content, category, visibility, tags } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        // 创建博客
        const blog = await Blog.create({
            title,
            content,
            rawContent: content,
            image,
            categoryId: category ? parseInt(category) : null,
            visibility: visibility || 'public',
            authorId: req.session.user.id,
            status: 'approved'
        });

        // 处理标签
        if (tags) {
            const tagNames = tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
            const createdTags = await findOrCreateTags(tagNames);
            // 创建关联
            await Promise.all(createdTags.map((tag: any) =>
                BlogTag.create({ blogId: blog.id, tagId: tag.id })
            ));
        }

        // 细粒度缓存失效
        await cache.invalidateHome();

        res.redirect('/');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// 编辑博客页面
export const getEditBlog = async (req: Request, res: Response) => {
    try {
        const blogId = parseInt(req.params.id);
        const blog = await Blog.findByPk(blogId, {
            include: [
                { model: Tag, as: 'tags' }
            ]
        });

        if (!blog) {
            return res.status(404).send('博客不存在');
        }

        // 权限检查
        if (blog.authorId !== req.session.user.id && req.session.user.isAdmin !== true) {
            return res.status(403).send('无权限编辑此博客');
        }

        const categories = await Category.findAll({
            order: [['order', 'ASC']],
            raw: true
        });

        res.render('blog_edit', {
            blog: blog.get({ plain: true }),
            categories,
            user: req.session.user || null
        });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// 提交编辑博客
export const postEditBlog = async (req: Request, res: Response) => {
    try {
        const blogId = parseInt(req.params.id);
        const { title, content, category, visibility, tags } = req.body;
        const blog = await Blog.findByPk(blogId);

        if (!blog) {
            return res.status(404).send('博客不存在');
        }

        // 权限检查
        if (blog.authorId !== req.session.user.id && req.session.user.isAdmin !== true) {
            return res.status(403).send('无权限编辑此博客');
        }

        // 获取旧标签
        const oldTags = await BlogTag.findAll({ where: { blogId } });
        const oldTagIds = oldTags.map(t => t.tagId);

        // 处理新标签
        let newTagIds: number[] = [];
        if (tags) {
            const tagNames = tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
            const createdTags = await findOrCreateTags(tagNames);
            newTagIds = createdTags.map((tag: any) => tag.id);
        }

        // 减少被移除标签的计数
        const removedTagIds = oldTagIds.filter(id => !newTagIds.includes(id));
        await Promise.all(removedTagIds.map(tagId =>
            Tag.decrement('count', { where: { id: tagId } })
        ));

        // 删除旧关联，创建新关联
        await BlogTag.destroy({ where: { blogId } });
        await Promise.all(newTagIds.map(tagId =>
            BlogTag.create({ blogId, tagId })
        ));

        // 处理图片
        if (req.file) {
            if (blog.image) {
                await deleteFile(blog.image);
            }
            blog.image = `/uploads/${req.file.filename}`;
        }

        blog.title = title;
        blog.content = content;
        blog.rawContent = content;
        blog.categoryId = category ? parseInt(category) : null;
        blog.visibility = visibility || 'public';

        await blog.save();

        // 细粒度缓存失效
        await cache.invalidateBlog(blog.id.toString());

        res.redirect(`/blog/${blog.id}`);
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// 删除博客
export const deleteBlog = async (req: Request, res: Response) => {
    try {
        const blogId = parseInt(req.params.id);
        const blog = await Blog.findByPk(blogId);

        if (!blog) {
            return res.status(404).send('博客不存在');
        }

        // 权限检查
        if (blog.authorId !== req.session.user.id && req.session.user.isAdmin !== true) {
            return res.status(403).send('无权限删除此博客');
        }

        // 减少所有标签的计数
        const blogTags = await BlogTag.findAll({ where: { blogId } });
        await Promise.all(blogTags.map(bt =>
            Tag.decrement('count', { where: { id: bt.tagId } })
        ));

        // 删除图片
        if (blog.image) {
            await deleteFile(blog.image);
        }

        // 删除博客 (级联删除评论和关联)
        await Blog.destroy({ where: { id: blogId } });

        // 细粒度缓存失效
        await cache.invalidateBlog(blogId.toString());

        res.redirect('/');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// 博客详情页
export const getBlogDetail = async (req: Request, res: Response) => {
    try {
        const blogId = parseInt(req.params.id);
        const blog = await Blog.findByPk(blogId, {
            include: [
                { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
                { model: Category, as: 'category' },
                { model: Tag, as: 'tags' }
            ]
        });

        if (!blog) {
            return res.status(404).send('博客不存在');
        }

        // 可见性检查
        if (blog.visibility === 'private') {
            if (!req.session.user || (blog.authorId !== req.session.user.id && req.session.user.isAdmin !== true)) {
                return res.status(403).send('无权限查看此博客');
            }
        }

        // 增加浏览量
        viewCounter.increment(blogId.toString());

        // 获取评论
        const comments = await Comment.findAll({
            where: { blogId },
            include: [
                { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        // 检查用户是否点赞和收藏
        let hasLiked = false;
        let hasBookmarked = false;
        if (req.session.user) {
            const like = await BlogLike.findOne({
                where: { blogId, userId: req.session.user.id }
            });
            hasLiked = like !== null;

            const bookmark = await UserBookmark.findOne({
                where: { blogId, userId: req.session.user.id }
            });
            hasBookmarked = bookmark !== null;
        }

        res.render('blog_detail', {
            blog: blog.get({ plain: true }),
            comments: comments.map(c => c.get({ plain: true })),
            hasLiked,
            hasBookmarked,
            user: req.session.user || null
        });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// 点赞/取消点赞
export const toggleLike = async (req: Request, res: Response) => {
    try {
        const blogId = parseInt(req.params.id);
        const blog = await Blog.findByPk(blogId);

        if (!blog) {
            return res.status(404).json({ success: false, message: '博客不存在' });
        }

        const userId = req.session.user.id;
        const existingLike = await BlogLike.findOne({
            where: { blogId, userId }
        });

        if (existingLike) {
            // 取消点赞
            await BlogLike.destroy({ where: { blogId, userId } });
            await Blog.decrement('likesCount', { where: { id: blogId } });
        } else {
            // 点赞
            await BlogLike.create({ blogId, userId });
            await Blog.increment('likesCount', { where: { id: blogId } });

            // 创建通知
            if (blog.authorId !== userId) {
                await createNotification({
                    recipientId: blog.authorId,
                    senderId: userId,
                    type: 'like',
                    relatedBlogId: blogId
                });
            }
        }

        // 获取更新后的点赞数
        const updatedBlog = await Blog.findByPk(blogId);

        // 细粒度缓存失效
        await cache.invalidateHome();

        res.json({
            success: true,
            liked: !existingLike,
            likesCount: updatedBlog?.likesCount || 0,
            count: updatedBlog?.likesCount || 0
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 收藏/取消收藏
export const toggleBookmark = async (req: Request, res: Response) => {
    try {
        const blogId = parseInt(req.params.id);
        const userId = req.session.user.id;

        const existingBookmark = await UserBookmark.findOne({
            where: { blogId, userId }
        });

        if (existingBookmark) {
            // 取消收藏
            await UserBookmark.destroy({ where: { blogId, userId } });
            await Blog.decrement('collectCount', { where: { id: blogId } });
        } else {
            // 收藏
            await UserBookmark.create({ blogId, userId });
            await Blog.increment('collectCount', { where: { id: blogId } });
        }

        // 细粒度缓存失效
        await cache.invalidateUser(userId.toString());

        res.json({
            success: true,
            bookmarked: !existingBookmark
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 发表评论
export const postComment = async (req: Request, res: Response) => {
    try {
        const { content } = req.body;
        const blogId = parseInt(req.params.id);

        const comment = await Comment.create({
            content,
            authorId: req.session.user.id,
            blogId
        });

        // 更新博客评论数
        await Blog.increment('commentCount', { where: { id: blogId } });

        // 创建通知
        const blog = await Blog.findByPk(blogId);
        if (blog && blog.authorId !== req.session.user.id) {
            await createNotification({
                recipientId: blog.authorId,
                senderId: req.session.user.id,
                type: 'comment',
                relatedBlogId: blogId,
                relatedCommentId: comment.id
            });
        }

        // 细粒度缓存失效
        await cache.invalidateBlog(blogId.toString());

        res.redirect(`/blog/${blogId}`);
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// 更新评论
export const updateComment = async (req: Request, res: Response) => {
    try {
        const { content } = req.body;
        const commentId = parseInt(req.params.id);
        const comment = await Comment.findByPk(commentId);

        if (!comment) {
            return res.status(404).json({ success: false, message: '评论不存在' });
        }

        // 权限检查
        if (comment.authorId !== req.session.user.id && req.session.user.isAdmin !== true) {
            return res.status(403).json({ success: false, message: '无权限修改此评论' });
        }

        comment.content = content;
        await comment.save();

        // 细粒度缓存失效
        await cache.invalidateBlog(comment.blogId.toString());

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 删除评论
export const deleteComment = async (req: Request, res: Response) => {
    try {
        const commentId = parseInt(req.params.id);
        const comment = await Comment.findByPk(commentId);

        if (!comment) {
            return res.status(404).json({ success: false, message: '评论不存在' });
        }

        // 权限检查
        if (comment.authorId !== req.session.user.id && req.session.user.isAdmin !== true) {
            return res.status(403).json({ success: false, message: '无权限删除此评论' });
        }

        const blogId = comment.blogId;

        // 更新博客评论数
        await Blog.decrement('commentCount', { where: { id: blogId } });

        await Comment.destroy({ where: { id: commentId } });

        // 细粒度缓存失效
        await cache.invalidateBlog(blogId.toString());

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
