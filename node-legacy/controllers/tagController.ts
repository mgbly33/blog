import { Request, Response } from 'express';
import Tag from '../models/tag';
import Blog from '../models/blog';

// 获取所有标签
export const getAllTags = async (req: Request, res: Response) => {
    try {
        const tags = await Tag.find().sort({ count: -1, name: 1 });
        res.json({ success: true, tags });
    } catch (error) {
        console.error('获取标签失败:', error);
        res.status(500).json({ success: false, message: '获取标签失败' });
    }
};

// 获取热门标签
export const getHotTags = async (req: Request, res: Response) => {
    try {
        const hotTags = await Tag.find({ isHot: true }).sort({ count: -1 }).limit(10);
        res.json({ success: true, tags: hotTags });
    } catch (error) {
        console.error('获取热门标签失败:', error);
        res.status(500).json({ success: false, message: '获取热门标签失败' });
    }
};

// 根据标签查询文章
export const getBlogsByTag = async (req: Request, res: Response) => {
    try {
        const { tagId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const tag = await Tag.findById(tagId);
        if (!tag) {
            return res.status(404).render('error', {
                message: '标签不存在',
                error: { status: 404 }
            });
        }

        const blogs = await Blog.find({
            tags: tagId,
            status: 'approved',
            visibility: 'public'
        })
            .populate('author', 'username avatar')
            .populate('tags', 'name color')
            .populate('category', 'name')
            .sort({ isSticky: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalBlogs = await Blog.countDocuments({
            tags: tagId,
            status: 'approved',
            visibility: 'public'
        });

        const totalPages = Math.ceil(totalBlogs / limit);

        res.render('tag_blogs', {
            tag,
            blogs,
            currentPage: page,
            totalPages
        });
    } catch (error: any) {
        console.error('获取标签文章失败:', error);
        res.status(500).render('error', {
            message: '获取文章失败',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// 创建或更新标签
export const findOrCreateTag = async (tagName: string) => {
    try {
        const normalizedName = tagName.trim().toLowerCase();

        let tag = await Tag.findOne({ name: normalizedName });

        if (!tag) {
            // 生成随机颜色
            const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            tag = new Tag({
                name: normalizedName,
                color: randomColor,
                count: 1
            });
            await tag.save();
        } else {
            // 增加标签使用计数
            tag.count += 1;

            // 如果使用次数超过10次，设置为热门标签
            if (tag.count >= 10) {
                tag.isHot = true;
            }

            await tag.save();
        }

        return tag;
    } catch (error) {
        console.error('创建或更新标签失败:', error);
        throw error;
    }
};

// 更新标签计数
export const updateTagCounts = async () => {
    try {
        const tags = await Tag.find();

        for (const tag of tags) {
            const count = await Blog.countDocuments({
                tags: tag._id,
                status: 'approved'
            });

            tag.count = count;
            tag.isHot = count >= 10;
            await tag.save();
        }

        console.log('标签计数更新成功');
    } catch (error) {
        console.error('更新标签计数失败:', error);
        throw error;
    }
};

// 批量创建或获取标签（并行处理）
export const findOrCreateTags = async (tagNames: string[]): Promise<any[]> => {
    if (!tagNames || tagNames.length === 0) return [];

    try {
        // 并行处理所有标签
        const tagPromises = tagNames.map(tagName => findOrCreateTag(tagName));
        const tags = await Promise.all(tagPromises);
        return tags;
    } catch (error) {
        console.error('批量创建标签失败:', error);
        throw error;
    }
};
