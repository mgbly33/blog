import { Request, Response } from 'express';
import Blog from '../models/blog';
import User from '../models/user';

// 全文搜索
export const searchBlogs = async (req: Request, res: Response) => {
    try {
        const { q, category, tag, sort } = req.query as any;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        if (!q || q.trim() === '') {
            return res.render('search_results', {
                query: '',
                blogs: [],
                currentPage: 1,
                totalPages: 0,
                totalResults: 0
            });
        }

        // 构建查询条件
        let query: any = {
            $text: { $search: q },
            status: 'approved',
            visibility: 'public'
        };

        // 添加分类过滤
        if (category) {
            query.category = category;
        }

        // 添加标签过滤
        if (tag) {
            query.tags = tag;
        }

        // 排序选项
        let sortOptions: any = { score: { $meta: 'textScore' } };
        if (sort === 'latest') {
            sortOptions = { createdAt: -1 };
        } else if (sort === 'popular') {
            sortOptions = { views: -1 };
        } else if (sort === 'likes') {
            // 使用 likesCount 存储字段进行数据库排序（性能优化）
            sortOptions = { likesCount: -1, createdAt: -1 };
        }

        const blogs = await Blog.find(query, { score: { $meta: 'textScore' } })
            .populate('author', 'username avatar')
            .populate('tags', 'name color')
            .populate('category', 'name')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean();

        const totalResults = await Blog.countDocuments(query);
        const totalPages = Math.ceil(totalResults / limit);

        res.render('search_results', {
            query: q,
            blogs,
            currentPage: page,
            totalPages,
            totalResults,
            filters: { category, tag, sort }
        });
    } catch (error: any) {
        console.error('搜索失败:', error);
        res.status(500).render('error', {
            message: '搜索失败',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// 获取推荐文章
export const getRecommendedBlogs = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user ? req.session.user._id : null;
        const limit = parseInt(req.query.limit as string) || 10;

        let recommendedBlogs: any[] = [];

        if (userId) {
            // 基于用户兴趣的推荐
            const user = await User.findById(userId).populate('bookmarks');

            // 获取用户收藏文章的标签
            const userTags: any[] = [];
            if (user!.bookmarks && user!.bookmarks.length > 0) {
                user!.bookmarks.forEach((blog: any) => {
                    if (blog.tags) {
                        userTags.push(...blog.tags);
                    }
                });
            }

            // 如果有标签，推荐相似标签的文章
            if (userTags.length > 0) {
                recommendedBlogs = await Blog.find({
                    tags: { $in: userTags },
                    status: 'approved',
                    visibility: 'public',
                    _id: { $nin: user!.bookmarks.map((b: any) => b._id) }
                })
                    .populate('author', 'username avatar')
                    .populate('tags', 'name color')
                    .sort({ likesCount: -1, views: -1 }) // 使用 likesCount 数据库排序
                    .limit(limit)
                    .lean();
            }
        }

        // 如果基于用户的推荐不足，补充热门文章
        if (recommendedBlogs.length < limit) {
            const remaining = limit - recommendedBlogs.length;
            const existingIds = recommendedBlogs.map(b => b._id);

            const hotBlogs = await Blog.find({
                status: 'approved',
                visibility: 'public',
                _id: { $nin: existingIds }
            })
                .populate('author', 'username avatar')
                .populate('tags', 'name color')
                .sort({ likesCount: -1, views: -1 }) // 使用 likesCount 数据库排序
                .limit(remaining)
                .lean();

            recommendedBlogs = [...recommendedBlogs, ...hotBlogs];
        }

        res.json({ success: true, blogs: recommendedBlogs });
    } catch (error) {
        console.error('获取推荐文章失败:', error);
        res.status(500).json({ success: false, message: '获取推荐失败' });
    }
};

// 获取热门文章
export const getHotBlogs = async (req: Request, res: Response) => {
    try {
        const period = req.query.period || 'week'; // day, week, month, all
        const limit = parseInt(req.query.limit as string) || 10;

        let dateFilter = {};
        const now = new Date();

        switch (period) {
            case 'day':
                dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 1)) } };
                break;
            case 'week':
                dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) } };
                break;
            case 'month':
                dateFilter = { createdAt: { $gte: new Date(now.setMonth(now.getMonth() - 1)) } };
                break;
            default:
                dateFilter = {};
        }

        // 使用 likesCount 存储字段进行数据库排序（性能优化）
        const hotBlogs = await Blog.find({
            ...dateFilter,
            status: 'approved',
            visibility: 'public'
        })
            .populate('author', 'username avatar')
            .populate('tags', 'name color')
            .populate('category', 'name')
            .sort({ likesCount: -1, views: -1 })
            .limit(limit)
            .lean();

        res.json({ success: true, blogs: hotBlogs });
    } catch (error) {
        console.error('获取热门文章失败:', error);
        res.status(500).json({ success: false, message: '获取热门文章失败' });
    }
};

// 自动完成搜索建议
export const searchSuggestions = async (req: Request, res: Response) => {
    try {
        const { q } = req.query as any;
        const limit = 10;

        if (!q || q.trim() === '') {
            return res.json({ success: true, suggestions: [] });
        }

        const blogs = await Blog.find({
            title: { $regex: q, $options: 'i' },
            status: 'approved',
            visibility: 'public'
        })
            .select('title')
            .limit(limit);

        const suggestions = blogs.map(blog => blog.title);

        res.json({ success: true, suggestions });
    } catch (error) {
        console.error('获取搜索建议失败:', error);
        res.status(500).json({ success: false, message: '获取建议失败' });
    }
};
