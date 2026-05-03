import { Request, Response } from 'express';
import { Op, literal } from 'sequelize';
import { Blog, User, Tag, Category, UserBookmark, BlogTag } from '../models/sequelize';

// 全文搜索
export const searchBlogs = async (req: Request, res: Response) => {
    try {
        const { q, category, tag, sort } = req.query as any;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

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
        const where: any = {
            status: 'approved',
            visibility: 'public'
        };

        // 添加分类过滤
        if (category) {
            where.categoryId = parseInt(category);
        }

        // Build include array
        const include: any[] = [
            { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
            { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
            { model: Category, as: 'category', attributes: ['id', 'name'] }
        ];

        // 排序选项
        let order: any[] = [];
        if (sort === 'latest') {
            order = [['createdAt', 'DESC']];
        } else if (sort === 'popular') {
            order = [['views', 'DESC']];
        } else if (sort === 'likes') {
            order = [['likesCount', 'DESC'], ['createdAt', 'DESC']];
        } else {
            // Default: relevance via FULLTEXT
            order = [['createdAt', 'DESC']];
        }

        // FULLTEXT search with MySQL
        // Note: For FULLTEXT to work, you need to create the index on the table
        const searchQuery = q.replace(/'/g, "''"); // Escape single quotes
        const fullTextSearch = literal(
            `MATCH(title, content, summary) AGAINST('${searchQuery}' IN NATURAL LANGUAGE MODE)`
        );

        const { count: totalResults, rows: blogs } = await Blog.findAndCountAll({
            where: {
                ...where,
                [Op.and]: [
                    literal(`MATCH(title, content, summary) AGAINST('${searchQuery}' IN NATURAL LANGUAGE MODE)`)
                ]
            },
            include,
            order,
            offset,
            limit,
            subQuery: false
        });

        const totalPages = Math.ceil(totalResults / limit);

        res.render('search_results', {
            query: q,
            blogs: blogs.map(b => b.get({ plain: true })),
            currentPage: page,
            totalPages,
            totalResults,
            filters: { category, tag, sort }
        });
    } catch (error: any) {
        console.error('搜索失败:', error);

        // Fallback to LIKE search if FULLTEXT fails
        try {
            const { q } = req.query as any;
            const page = parseInt(req.query.page as string) || 1;
            const limit = 20;
            const offset = (page - 1) * limit;

            const { count: totalResults, rows: blogs } = await Blog.findAndCountAll({
                where: {
                    status: 'approved',
                    visibility: 'public',
                    [Op.or]: [
                        { title: { [Op.like]: `%${q}%` } },
                        { content: { [Op.like]: `%${q}%` } },
                        { summary: { [Op.like]: `%${q}%` } }
                    ]
                },
                include: [
                    { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
                    { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
                    { model: Category, as: 'category', attributes: ['id', 'name'] }
                ],
                order: [['createdAt', 'DESC']],
                offset,
                limit
            });

            const totalPages = Math.ceil(totalResults / limit);

            return res.render('search_results', {
                query: q,
                blogs: blogs.map(b => b.get({ plain: true })),
                currentPage: page,
                totalPages,
                totalResults,
                filters: {}
            });
        } catch (fallbackError: any) {
            res.status(500).render('error', {
                message: '搜索失败',
                error: process.env.NODE_ENV === 'development' ? fallbackError : {}
            });
        }
    }
};

// 获取推荐文章
export const getRecommendedBlogs = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        const limit = parseInt(req.query.limit as string) || 10;

        let recommendedBlogs: any[] = [];

        if (userId) {
            // 基于用户收藏的标签推荐
            const bookmarks = await UserBookmark.findAll({
                where: { userId },
                include: [
                    {
                        model: Blog,
                        include: [{ model: Tag, as: 'tags' }]
                    }
                ]
            });

            // 获取用户收藏文章的标签ID
            const userTagIds: number[] = [];
            const bookmarkedBlogIds: number[] = [];

            bookmarks.forEach((bookmark: any) => {
                if (bookmark.Blog) {
                    bookmarkedBlogIds.push(bookmark.Blog.id);
                    if (bookmark.Blog.tags) {
                        bookmark.Blog.tags.forEach((tag: any) => {
                            if (!userTagIds.includes(tag.id)) {
                                userTagIds.push(tag.id);
                            }
                        });
                    }
                }
            });

            // 如果有标签，推荐相似标签的文章
            if (userTagIds.length > 0) {
                const taggedBlogs = await BlogTag.findAll({
                    where: { tagId: { [Op.in]: userTagIds } },
                    attributes: ['blogId']
                });

                const taggedBlogIds = taggedBlogs.map(tb => tb.blogId)
                    .filter(id => !bookmarkedBlogIds.includes(id));

                if (taggedBlogIds.length > 0) {
                    recommendedBlogs = await Blog.findAll({
                        where: {
                            id: { [Op.in]: taggedBlogIds },
                            status: 'approved',
                            visibility: 'public'
                        },
                        include: [
                            { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
                            { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] }
                        ],
                        order: [['likesCount', 'DESC'], ['views', 'DESC']],
                        limit
                    });
                }
            }
        }

        // 如果基于用户的推荐不足，补充热门文章
        if (recommendedBlogs.length < limit) {
            const remaining = limit - recommendedBlogs.length;
            const existingIds = recommendedBlogs.map(b => b.id);

            const hotBlogs = await Blog.findAll({
                where: {
                    status: 'approved',
                    visibility: 'public',
                    id: { [Op.notIn]: existingIds.length > 0 ? existingIds : [0] }
                },
                include: [
                    { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
                    { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] }
                ],
                order: [['likesCount', 'DESC'], ['views', 'DESC']],
                limit: remaining
            });

            recommendedBlogs = [...recommendedBlogs, ...hotBlogs];
        }

        res.json({
            success: true,
            blogs: recommendedBlogs.map(b => b.get ? b.get({ plain: true }) : b)
        });
    } catch (error) {
        console.error('获取推荐文章失败:', error);
        res.status(500).json({ success: false, message: '获取推荐失败' });
    }
};

// 获取热门文章
export const getHotBlogs = async (req: Request, res: Response) => {
    try {
        const period = req.query.period || 'week';
        const limit = parseInt(req.query.limit as string) || 10;

        const where: any = {
            status: 'approved',
            visibility: 'public'
        };

        const now = new Date();

        switch (period) {
            case 'day':
                where.createdAt = { [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
                break;
            case 'week':
                where.createdAt = { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
                break;
            case 'month':
                where.createdAt = { [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
                break;
            default:
                // all time - no date filter
                break;
        }

        const hotBlogs = await Blog.findAll({
            where,
            include: [
                { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
                { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
                { model: Category, as: 'category', attributes: ['id', 'name'] }
            ],
            order: [['likesCount', 'DESC'], ['views', 'DESC']],
            limit
        });

        res.json({
            success: true,
            blogs: hotBlogs.map(b => b.get({ plain: true }))
        });
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

        const blogs = await Blog.findAll({
            where: {
                title: { [Op.like]: `%${q}%` },
                status: 'approved',
                visibility: 'public'
            },
            attributes: ['title'],
            limit
        });

        const suggestions = blogs.map(blog => blog.title);

        res.json({ success: true, suggestions });
    } catch (error) {
        console.error('获取搜索建议失败:', error);
        res.status(500).json({ success: false, message: '获取建议失败' });
    }
};
