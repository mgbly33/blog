import { Request, Response } from 'express';
import Draft from '../models/draft';
import DraftVersion from '../models/draftVersion';
import Blog from '../models/blog';
import Category from '../models/category';
import { findOrCreateTags } from './tagController';
import cache from '../utils/cache';

// 版本创建间隔（5分钟）
const VERSION_INTERVAL_MS = 5 * 60 * 1000;

// 上次版本创建时间缓存
const lastVersionTime = new Map<string, number>();

// 保存草稿（创建或更新）
export const saveDraft = async (req: Request, res: Response) => {
    try {
        const { draftId, blogId, title, content, category, tags, visibility } = req.body;
        const userId = req.session.user._id;

        let draft;
        let isNewDraft = false;
        let shouldCreateVersion = false;

        if (draftId) {
            // 更新现有草稿
            draft = await Draft.findById(draftId);

            if (!draft) {
                return res.status(404).json({ success: false, message: '草稿不存在' });
            }

            // 权限检查
            if (draft.author.toString() !== userId.toString()) {
                return res.status(403).json({ success: false, message: '无权限修改此草稿' });
            }

            // 检查是否需要创建版本（内容有变化且间隔超过5分钟）
            const lastTime = lastVersionTime.get(draftId) || 0;
            const contentChanged = draft.content !== content || draft.title !== title;

            if (contentChanged && Date.now() - lastTime > VERSION_INTERVAL_MS) {
                shouldCreateVersion = true;
            }

            // 更新草稿
            draft.title = title || draft.title;
            draft.content = content ?? draft.content;
            draft.category = category || undefined;
            draft.tags = tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : draft.tags;
            draft.visibility = visibility || draft.visibility;

        } else {
            // 创建新草稿
            isNewDraft = true;
            shouldCreateVersion = true;

            draft = new Draft({
                title: title || '无标题草稿',
                content: content || '',
                category: category || undefined,
                tags: tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
                visibility: visibility || 'public',
                author: userId,
                blogId: blogId || undefined
            });
        }

        await draft.save();

        // 创建版本记录
        if (shouldCreateVersion) {
            await DraftVersion.createVersion(
                draft._id,
                draft.title,
                draft.content,
                {
                    category: draft.category,
                    tags: draft.tags,
                    visibility: draft.visibility
                },
                'auto'
            );

            // 更新版本号
            draft.currentVersion = (draft.currentVersion || 0) + 1;
            await draft.save();

            lastVersionTime.set(draft._id.toString(), Date.now());
        }

        res.json({
            success: true,
            draft: {
                _id: draft._id,
                title: draft.title,
                lastSavedAt: draft.lastSavedAt,
                currentVersion: draft.currentVersion
            },
            savedAt: new Date().toISOString(),
            isNew: isNewDraft
        });

    } catch (error: any) {
        console.error('保存草稿失败:', error);
        res.status(500).json({ success: false, message: '保存草稿失败' });
    }
};

// 获取草稿详情
export const getDraftDetail = async (req: Request, res: Response) => {
    try {
        const draft = await Draft.findById(req.params.id)
            .populate('category', 'name')
            .lean();

        if (!draft) {
            return res.status(404).json({ success: false, message: '草稿不存在' });
        }

        // 权限检查
        if (draft.author.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ success: false, message: '无权限查看此草稿' });
        }

        res.json({ success: true, draft });

    } catch (error: any) {
        console.error('获取草稿详情失败:', error);
        res.status(500).json({ success: false, message: '获取草稿详情失败' });
    }
};

// 获取草稿列表
export const getDraftList = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const drafts = await Draft.find({ author: userId })
            .populate('category', 'name')
            .populate('blogId', 'title')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Draft.countDocuments({ author: userId });

        res.json({
            success: true,
            drafts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('获取草稿列表失败:', error);
        res.status(500).json({ success: false, message: '获取草稿列表失败' });
    }
};

// 删除草稿
export const deleteDraft = async (req: Request, res: Response) => {
    try {
        const draft = await Draft.findById(req.params.id);

        if (!draft) {
            return res.status(404).json({ success: false, message: '草稿不存在' });
        }

        // 权限检查
        if (draft.author.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ success: false, message: '无权限删除此草稿' });
        }

        // 删除关联的版本记录
        await DraftVersion.deleteMany({ draftId: draft._id });

        // 删除草稿
        await Draft.findByIdAndDelete(req.params.id);

        // 清理版本时间缓存
        lastVersionTime.delete(req.params.id);

        res.json({ success: true, message: '草稿已删除' });

    } catch (error: any) {
        console.error('删除草稿失败:', error);
        res.status(500).json({ success: false, message: '删除草稿失败' });
    }
};

// 发布草稿
export const publishDraft = async (req: Request, res: Response) => {
    try {
        const draft = await Draft.findById(req.params.id);

        if (!draft) {
            return res.status(404).json({ success: false, message: '草稿不存在' });
        }

        // 权限检查
        if (draft.author.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ success: false, message: '无权限发布此草稿' });
        }

        // 处理标签
        let tagIds: any[] = [];
        if (draft.tags && draft.tags.length > 0) {
            const createdTags = await findOrCreateTags(draft.tags);
            tagIds = createdTags.map(tag => tag._id);
        }

        let blog;

        if (draft.blogId) {
            // 更新已有博客
            blog = await Blog.findById(draft.blogId);

            if (!blog) {
                return res.status(404).json({ success: false, message: '关联博客不存在' });
            }

            blog.title = draft.title;
            blog.content = draft.content;
            blog.rawContent = draft.content;
            blog.category = draft.category;
            blog.visibility = draft.visibility;
            blog.tags = tagIds;
            if (draft.image) {
                blog.image = draft.image;
            }

            await blog.save();

        } else {
            // 创建新博客
            blog = new Blog({
                title: draft.title,
                content: draft.content,
                rawContent: draft.content,
                category: draft.category,
                visibility: draft.visibility,
                tags: tagIds,
                image: draft.image,
                author: draft.author,
                status: 'approved'
            });

            await blog.save();
        }

        // 删除草稿和版本历史
        await DraftVersion.deleteMany({ draftId: draft._id });
        await Draft.findByIdAndDelete(draft._id);
        lastVersionTime.delete(req.params.id);

        // 清理缓存
        await cache.invalidateHome();
        if (draft.blogId) {
            await cache.invalidateBlog(draft.blogId.toString());
        }

        res.json({
            success: true,
            blog: {
                _id: blog._id,
                title: blog.title
            },
            redirectUrl: `/blog/${blog._id}`
        });

    } catch (error: any) {
        console.error('发布草稿失败:', error);
        res.status(500).json({ success: false, message: '发布草稿失败' });
    }
};

// 获取版本列表
export const getVersions = async (req: Request, res: Response) => {
    try {
        const draft = await Draft.findById(req.params.id);

        if (!draft) {
            return res.status(404).json({ success: false, message: '草稿不存在' });
        }

        // 权限检查
        if (draft.author.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ success: false, message: '无权限查看版本历史' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const versions = await DraftVersion.find({ draftId: req.params.id })
            .sort({ versionNumber: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await DraftVersion.countDocuments({ draftId: req.params.id });

        // 添加内容预览
        const versionsWithPreview = versions.map(v => ({
            ...v,
            contentPreview: v.content.substring(0, 100) + (v.content.length > 100 ? '...' : '')
        }));

        res.json({
            success: true,
            versions: versionsWithPreview,
            hasMore: skip + versions.length < total,
            total
        });

    } catch (error: any) {
        console.error('获取版本列表失败:', error);
        res.status(500).json({ success: false, message: '获取版本列表失败' });
    }
};

// 获取单个版本详情
export const getVersionDetail = async (req: Request, res: Response) => {
    try {
        const version = await DraftVersion.findById(req.params.versionId);

        if (!version) {
            return res.status(404).json({ success: false, message: '版本不存在' });
        }

        // 验证草稿权限
        const draft = await Draft.findById(version.draftId);
        if (!draft || draft.author.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ success: false, message: '无权限查看此版本' });
        }

        res.json({ success: true, version });

    } catch (error: any) {
        console.error('获取版本详情失败:', error);
        res.status(500).json({ success: false, message: '获取版本详情失败' });
    }
};

// 恢复到指定版本
export const restoreVersion = async (req: Request, res: Response) => {
    try {
        const version = await DraftVersion.findById(req.params.versionId);

        if (!version) {
            return res.status(404).json({ success: false, message: '版本不存在' });
        }

        const draft = await Draft.findById(version.draftId);

        if (!draft) {
            return res.status(404).json({ success: false, message: '草稿不存在' });
        }

        // 权限检查
        if (draft.author.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ success: false, message: '无权限恢复此版本' });
        }

        // 先保存当前版本（恢复前状态）
        await DraftVersion.createVersion(
            draft._id,
            draft.title,
            draft.content,
            {
                category: draft.category,
                tags: draft.tags,
                visibility: draft.visibility
            },
            'restore'
        );

        // 恢复到目标版本
        draft.title = version.title;
        draft.content = version.content;
        draft.category = version.snapshot.category;
        draft.tags = version.snapshot.tags;
        draft.visibility = version.snapshot.visibility as 'public' | 'private';
        draft.currentVersion = (draft.currentVersion || 0) + 1;

        await draft.save();

        lastVersionTime.set(draft._id.toString(), Date.now());

        res.json({
            success: true,
            draft: {
                _id: draft._id,
                title: draft.title,
                content: draft.content,
                category: draft.category,
                tags: draft.tags,
                visibility: draft.visibility,
                currentVersion: draft.currentVersion
            },
            message: `已恢复到版本 v${version.versionNumber}`
        });

    } catch (error: any) {
        console.error('恢复版本失败:', error);
        res.status(500).json({ success: false, message: '恢复版本失败' });
    }
};

// 草稿列表页面
export const getDraftsPage = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const drafts = await Draft.find({ author: userId })
            .populate('category', 'name')
            .populate('blogId', 'title')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Draft.countDocuments({ author: userId });
        const totalPages = Math.ceil(total / limit);

        // 计算字数
        const draftsWithStats = drafts.map(draft => ({
            ...draft,
            wordCount: (draft.content || '').replace(/\s+/g, '').length,
            summary: (draft.content || '').replace(/[#*`>\[\]()]/g, '').substring(0, 120)
        }));

        res.render('drafts', {
            drafts: draftsWithStats,
            currentPage: page,
            totalPages,
            totalDrafts: total,
            user: req.session.user
        });

    } catch (error: any) {
        console.error('加载草稿列表页失败:', error);
        res.status(500).render('error', {
            message: '加载草稿列表失败',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};
