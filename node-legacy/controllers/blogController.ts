import { Request, Response } from 'express';
import Blog from '../models/blog';
import Category from '../models/category';
import Link from '../models/link';
import Comment from '../models/comment';
import User from '../models/user';
import Tag from '../models/tag';
import { deleteFile } from '../utils/fileHelper';
import cache from '../utils/cache';
import viewCounter from '../utils/viewCounter';

import { findOrCreateTag, findOrCreateTags } from './tagController';
import { createNotification } from './notificationController';

// 首页 - 博客列表
export const getHome = async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = 6;
        const skip = (page - 1) * limit;
        const query = req.query.q as string;
        const sortParam = req.query.sort || 'recommend';
        const categoryId = req.query.category;

        // 生成缓存键
        const cacheKey = `home_v2_${page}_${limit}_${query || 'all'}_${sortParam}_${categoryId || 'all'}_${req.session.user ? req.session.user._id : 'guest'}`;

        // 检查缓存
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
            return res.render('index', cachedData);
        }

        let filter: any = { status: 'approved' };
        if (query) {
            filter.title = { $regex: query, $options: 'i' };
        }
        if (categoryId) {
            filter.category = categoryId;
        }

        // 可见性过滤
        if (req.session.user) {
            filter.$or = [
                { visibility: 'public' },
                { visibility: { $exists: false } },
                { author: req.session.user._id, visibility: 'private' }
            ];
        } else {
            filter.$or = [
                { visibility: 'public' },
                { visibility: { $exists: false } }
            ];
        }

        let sortOption: any = { isSticky: -1, createdAt: -1 };
        if (sortParam === 'latest') {
            sortOption = { createdAt: -1 };
        } else if (sortParam === 'hot') {
            sortOption = { views: -1 };
        }

        const blogs = await Blog.find(filter)
            .populate('author', 'username avatar')
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .lean(); // 使用 lean() 提高性能

        const count = await Blog.countDocuments(filter);

        // 侧边栏数据缓存键
        const sidebarCacheKey = `sidebar_${req.session.user ? req.session.user._id : 'guest'}`;
        let sidebarData: any = await cache.get(sidebarCacheKey);

        if (!sidebarData) {
            // 侧边栏数据：热门博客
            let hotBlogsFilter: any = { status: 'approved' };
            if (req.session.user) {
                hotBlogsFilter.$or = [
                    { visibility: 'public' },
                    { visibility: { $exists: false } },
                    { author: req.session.user._id, visibility: 'private' }
                ];
            } else {
                hotBlogsFilter.$or = [
                    { visibility: 'public' },
                    { visibility: { $exists: false } }
                ];
            }

            const hotBlogs = await Blog.find(hotBlogsFilter)
                .sort({ views: -1 })
                .limit(5)
                .select('title views _id')
                .lean();

            const links = await Link.find().sort({ order: 1 }).lean();
            const categories = await Category.find().sort({ order: 1 }).lean();

            sidebarData = { hotBlogs, links, categories };
            await cache.set(sidebarCacheKey, sidebarData, 600000); // 缓存10分钟
        }

        let userArticleCount = 0;
        if (req.session.user) {
            userArticleCount = await Blog.countDocuments({ author: req.session.user._id });
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
        const categories = await Category.find().sort({ order: 1 }).lean();
        res.render('blog_new', { categories, user: req.session.user || null });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// 提交新建博客
export const postNewBlog = async (req: Request, res: Response) => {
    try {
        const { title, content, category, visibility, tags } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : undefined;

        // 处理标签（并行创建）
        let tagIds: any[] = [];
        if (tags) {
            const tagNames = tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
            const createdTags = await findOrCreateTags(tagNames);
            tagIds = createdTags.map(tag => tag._id);
        }

        const blog = new Blog({
            title,
            content,
            rawContent: content,
            image,
            category: category || undefined,
            visibility: visibility || 'public',
            tags: tagIds,
            author: req.session.user._id,
            status: 'approved' // 或者根据权限设置为 'pending'
        });

        await blog.save();

        // 细粒度缓存失效：只清除首页和侧边栏缓存
        await cache.invalidateHome();

        res.redirect('/');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// 编辑博客页面
export const getEditBlog = async (req: Request, res: Response) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('tags').lean();

        if (!blog) {
            return res.status(404).send('博客不存在');
        }

        // 权限检查
        if (blog.author.toString() !== req.session.user._id.toString() && req.session.user.isAdmin !== true) {
            return res.status(403).send('无权限编辑此博客');
        }

        const categories = await Category.find().sort({ order: 1 }).lean();

        res.render('blog_edit', { blog, categories, user: req.session.user || null });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// 提交编辑博客
export const postEditBlog = async (req: Request, res: Response) => {
    try {
        const { title, content, category, visibility, tags } = req.body;
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).send('博客不存在');
        }

        // 权限检查
        if (blog.author.toString() !== req.session.user._id.toString() && req.session.user.isAdmin !== true) {
            return res.status(403).send('无权限编辑此博客');
        }

        // 保存旧标签 ID 用于计数修复
        const oldTagIds = blog.tags.map(t => t.toString());

        // 处理新标签（并行创建）
        let tagIds: string[] = [];
        if (tags) {
            const tagNames = tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
            const createdTags = await findOrCreateTags(tagNames);
            tagIds = createdTags.map(tag => tag._id.toString());
        }

        // 减少被移除标签的计数（并行处理）
        const removedTags = oldTagIds.filter(id => !tagIds.includes(id));
        await Promise.all(removedTags.map(tagId =>
            Tag.findByIdAndUpdate(tagId, { $inc: { count: -1 } })
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
        blog.category = category || undefined;
        blog.visibility = visibility || 'public';
        blog.tags = tagIds as any;

        await blog.save();

        // 细粒度缓存失效：清除该博客和首页缓存
        await cache.invalidateBlog(blog._id.toString());

        res.redirect(`/blog/${blog._id}`);
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// 删除博客
export const deleteBlog = async (req: Request, res: Response) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).send('博客不存在');
        }

        // 权限检查
        if (blog.author.toString() !== req.session.user._id.toString() && req.session.user.isAdmin !== true) {
            return res.status(403).send('无权限删除此博客');
        }

        // 减少所有标签的计数（并行处理）
        await Promise.all(blog.tags.map(tagId =>
            Tag.findByIdAndUpdate(tagId, { $inc: { count: -1 } })
        ));

        // 删除图片
        if (blog.image) {
            await deleteFile(blog.image);
        }

        // 删除相关评论
        await Comment.deleteMany({ blogId: blog._id });

        await Blog.findByIdAndDelete(req.params.id);

        // 细粒度缓存失效：清除该博客和首页缓存
        await cache.invalidateBlog(req.params.id);

        res.redirect('/');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// 博客详情页
export const getBlogDetail = async (req: Request, res: Response) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate('author', 'username avatar')
            .populate('category')
            .populate('tags')
            .lean();

        if (!blog) {
            return res.status(404).send('博客不存在');
        }

        // 可见性检查
        if (blog.visibility === 'private') {
            if (!req.session.user || (blog.author._id.toString() !== req.session.user._id.toString() && req.session.user.isAdmin !== true)) {
                return res.status(403).send('无权限查看此博客');
            }
        }

        // 增加浏览量（批量异步更新，减少数据库压力）
        viewCounter.increment(req.params.id);

        // 获取评论
        const comments = await Comment.find({ blogId: req.params.id })
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 })
            .lean();

        // 检查用户是否点赞和收藏
        let hasLiked = false;
        let hasBookmarked = false;
        if (req.session.user) {
            hasLiked = blog.likes.some((like: any) => like.toString() === req.session.user._id.toString());
            const user = await User.findById(req.session.user._id);
            hasBookmarked = user?.bookmarks?.some((bookmark: any) => bookmark.toString() === req.params.id) || false;
        }

        res.render('blog_detail', {
            blog,
            comments,
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
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ success: false, message: '博客不存在' });
        }

        const userId = req.session.user._id;
        const hasLiked = blog.likes.some((like: any) => like.toString() === userId.toString());

        if (hasLiked) {
            // 取消点赞
            blog.likes = blog.likes.filter((like: any) => like.toString() !== userId.toString());
        } else {
            // 点赞
            blog.likes.push(userId);

            // 创建通知
            if (blog.author.toString() !== userId.toString()) {
                await createNotification({
                    recipient: blog.author,
                    sender: userId,
                    type: 'like',
                    blog: blog._id
                });
            }
        }

        await blog.save();

        // 细粒度缓存失效：点赞影响首页排序
        await cache.invalidateHome();

        res.json({
            success: true,
            liked: !hasLiked,
            likesCount: blog.likes.length,
            count: blog.likes.length
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 收藏/取消收藏
export const toggleBookmark = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.session.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        const blogId = req.params.id;
        const hasBookmarked = user.bookmarks?.some((bookmark: any) => bookmark.toString() === blogId) || false;

        if (hasBookmarked) {
            // 取消收藏
            user.bookmarks = user.bookmarks?.filter((bookmark: any) => bookmark.toString() !== blogId) || [];
            await Blog.findByIdAndUpdate(blogId, { $inc: { collectCount: -1 } });
        } else {
            // 收藏
            if (!user.bookmarks) {
                user.bookmarks = [];
            }
            user.bookmarks.push(blogId as any);
            await Blog.findByIdAndUpdate(blogId, { $inc: { collectCount: 1 } });
        }

        await user.save();

        // 细粒度缓存失效：收藏影响用户数据
        await cache.invalidateUser(req.session.user._id.toString());

        res.json({
            success: true,
            bookmarked: !hasBookmarked
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 发表评论
export const postComment = async (req: Request, res: Response) => {
    try {
        const { content } = req.body;
        const blogId = req.params.id;

        const comment = new Comment({
            content,
            author: req.session.user._id,
            blogId: blogId
        });

        await comment.save();

        // 更新博客评论数
        await Blog.findByIdAndUpdate(blogId, { $inc: { commentCount: 1 } });

        // 创建通知
        const blog = await Blog.findById(blogId);
        if (blog && blog.author.toString() !== req.session.user._id.toString()) {
            await createNotification({
                recipient: blog.author,
                sender: req.session.user._id,
                type: 'comment',
                blog: blogId,
                comment: comment._id
            });
        }

        // 细粒度缓存失效：评论只影响对应博客详情
        await cache.invalidateBlog(blogId);

        res.redirect(`/blog/${blogId}`);
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// 更新评论
export const updateComment = async (req: Request, res: Response) => {
    try {
        const { content } = req.body;
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ success: false, message: '评论不存在' });
        }

        // 权限检查
        if (comment.author.toString() !== req.session.user._id.toString() && req.session.user.isAdmin !== true) {
            return res.status(403).json({ success: false, message: '无权限修改此评论' });
        }

        comment.content = content;
        await comment.save();

        // 细粒度缓存失效：评论更新只影响对应博客
        await cache.invalidateBlog(comment.blogId.toString());

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 删除评论
export const deleteComment = async (req: Request, res: Response) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ success: false, message: '评论不存在' });
        }

        // 权限检查
        if (comment.author.toString() !== req.session.user._id.toString() && req.session.user.isAdmin !== true) {
            return res.status(403).json({ success: false, message: '无权限删除此评论' });
        }

        // 更新博客评论数
        await Blog.findByIdAndUpdate(comment.blogId, { $inc: { commentCount: -1 } });

        await Comment.findByIdAndDelete(req.params.id);

        // 细粒度缓存失效：评论删除影响对应博客和首页
        await cache.invalidateBlog(comment.blogId.toString());

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
