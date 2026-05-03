import { Request, Response } from 'express';
import { Draft, DraftVersion, Blog, Category, BlogTag } from '../models/sequelize';
import { findOrCreateTags } from './tagController.sequelize';
import cache from '../utils/cache';

// 版本创建间隔（5分钟）
const VERSION_INTERVAL_MS = 5 * 60 * 1000;

// 上次版本创建时间缓存
const lastVersionTime = new Map<string, number>();

// 保存草稿（创建或更新）
export const saveDraft = async (req: Request, res: Response) => {
    try {
        const { draftId, blogId, title, content, category, tags, visibility } = req.body;
        const userId = req.session.user.id;

        let draft: Draft | null = null;
        let isNewDraft = false;
        let shouldCreateVersion = false;

        if (draftId) {
            // 更新现有草稿
            draft = await Draft.findByPk(draftId);

            if (!draft) {
                return res.status(404).json({ success: false, message: '草稿不存在' });
            }

            // 权限检查
            if (draft.authorId !== userId) {
                return res.status(403).json({ success: false, message: '无权限修改此草稿' });
            }

            // 检查是否需要创建版本（内容有变化且间隔超过5分钟）
            const lastTime = lastVersionTime.get(String(draftId)) || 0;
            const contentChanged = draft.content !== content || draft.title !== title;

            if (contentChanged && Date.now() - lastTime > VERSION_INTERVAL_MS) {
                shouldCreateVersion = true;
            }

            // 更新草稿
            draft.title = title || draft.title;
            draft.content = content ?? draft.content;
            draft.categoryId = category ? parseInt(category) : draft.categoryId;
            draft.tagsArray = tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : draft.tagsArray;
            draft.visibility = visibility || draft.visibility;

        } else {
            // 创建新草稿
            isNewDraft = true;
            shouldCreateVersion = true;

            draft = await Draft.create({
                title: title || '无标题草稿',
                content: content || '',
                categoryId: category ? parseInt(category) : null,
                tags: tags ? JSON.stringify(tags.split(',').map((t: string) => t.trim()).filter(Boolean)) : '[]',
                visibility: visibility || 'public',
                authorId: userId,
                blogId: blogId ? parseInt(blogId) : null,
                currentVersion: 0
            });
        }

        await draft.save();

        // 创建版本记录
        if (shouldCreateVersion) {
            await DraftVersion.createVersion(
                draft.id,
                draft.title,
                draft.content,
                {
                    categoryId: draft.categoryId,
                    tags: draft.tagsArray,
                    visibility: draft.visibility
                },
                'auto'
            );

            // 更新版本号
            draft.currentVersion = (draft.currentVersion || 0) + 1;
            await draft.save();

            lastVersionTime.set(String(draft.id), Date.now());
        }

        res.json({
            success: true,
            draft: {
                id: draft.id,
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
        const draftId = parseInt(req.params.id);
        const draft = await Draft.findByPk(draftId, {
            include: [
                { model: Category, as: 'category', attributes: ['id', 'name'] }
            ]
        });

        if (!draft) {
            return res.status(404).json({ success: false, message: '草稿不存在' });
        }

        // 权限检查
        if (draft.authorId !== req.session.user.id) {
            return res.status(403).json({ success: false, message: '无权限查看此草稿' });
        }

        res.json({ success: true, draft: draft.get({ plain: true }) });

    } catch (error: any) {
        console.error('获取草稿详情失败:', error);
        res.status(500).json({ success: false, message: '获取草稿详情失败' });
    }
};

// 获取草稿列表
export const getDraftList = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        const { count: total, rows: drafts } = await Draft.findAndCountAll({
            where: { authorId: userId },
            include: [
                { model: Category, as: 'category', attributes: ['id', 'name'] },
                { model: Blog, as: 'blog', attributes: ['id', 'title'] }
            ],
            order: [['updatedAt', 'DESC']],
            offset,
            limit
        });

        res.json({
            success: true,
            drafts: drafts.map(d => d.get({ plain: true })),
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
        const draftId = parseInt(req.params.id);
        const draft = await Draft.findByPk(draftId);

        if (!draft) {
            return res.status(404).json({ success: false, message: '草稿不存在' });
        }

        // 权限检查
        if (draft.authorId !== req.session.user.id) {
            return res.status(403).json({ success: false, message: '无权限删除此草稿' });
        }

        // 删除关联的版本记录
        await DraftVersion.destroy({ where: { draftId: draft.id } });

        // 删除草稿
        await draft.destroy();

        // 清理版本时间缓存
        lastVersionTime.delete(String(draftId));

        res.json({ success: true, message: '草稿已删除' });

    } catch (error: any) {
        console.error('删除草稿失败:', error);
        res.status(500).json({ success: false, message: '删除草稿失败' });
    }
};

// 发布草稿
export const publishDraft = async (req: Request, res: Response) => {
    try {
        const draftId = parseInt(req.params.id);
        const draft = await Draft.findByPk(draftId);

        if (!draft) {
            return res.status(404).json({ success: false, message: '草稿不存在' });
        }

        // 权限检查
        if (draft.authorId !== req.session.user.id) {
            return res.status(403).json({ success: false, message: '无权限发布此草稿' });
        }

        // 处理标签
        let tagIds: number[] = [];
        const tagsArray = draft.tagsArray;
        if (tagsArray && tagsArray.length > 0) {
            const createdTags = await findOrCreateTags(tagsArray);
            tagIds = createdTags.map(tag => tag.id);
        }

        let blog: Blog;

        if (draft.blogId) {
            // 更新已有博客
            const existingBlog = await Blog.findByPk(draft.blogId);

            if (!existingBlog) {
                return res.status(404).json({ success: false, message: '关联博客不存在' });
            }

            existingBlog.title = draft.title;
            existingBlog.content = draft.content;
            existingBlog.rawContent = draft.content;
            existingBlog.categoryId = draft.categoryId;
            existingBlog.visibility = draft.visibility;
            if (draft.image) {
                existingBlog.image = draft.image;
            }

            await existingBlog.save();

            // 更新标签关联
            await BlogTag.destroy({ where: { blogId: existingBlog.id } });
            for (const tagId of tagIds) {
                await BlogTag.create({ blogId: existingBlog.id, tagId });
            }

            blog = existingBlog;

        } else {
            // 创建新博客
            blog = await Blog.create({
                title: draft.title,
                content: draft.content,
                rawContent: draft.content,
                categoryId: draft.categoryId,
                visibility: draft.visibility,
                image: draft.image,
                authorId: draft.authorId,
                status: 'approved'
            });

            // 创建标签关联
            for (const tagId of tagIds) {
                await BlogTag.create({ blogId: blog.id, tagId });
            }
        }

        // 删除草稿和版本历史
        await DraftVersion.destroy({ where: { draftId: draft.id } });
        await draft.destroy();
        lastVersionTime.delete(String(draftId));

        // 清理缓存
        await cache.invalidateHome();
        if (draft.blogId) {
            await cache.invalidateBlog(String(draft.blogId));
        }

        res.json({
            success: true,
            blog: {
                id: blog.id,
                title: blog.title
            },
            redirectUrl: `/blog/${blog.id}`
        });

    } catch (error: any) {
        console.error('发布草稿失败:', error);
        res.status(500).json({ success: false, message: '发布草稿失败' });
    }
};

// 获取版本列表
export const getVersions = async (req: Request, res: Response) => {
    try {
        const draftId = parseInt(req.params.id);
        const draft = await Draft.findByPk(draftId);

        if (!draft) {
            return res.status(404).json({ success: false, message: '草稿不存在' });
        }

        // 权限检查
        if (draft.authorId !== req.session.user.id) {
            return res.status(403).json({ success: false, message: '无权限查看版本历史' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        const { count: total, rows: versions } = await DraftVersion.findAndCountAll({
            where: { draftId },
            order: [['versionNumber', 'DESC']],
            offset,
            limit
        });

        // 添加内容预览
        const versionsWithPreview = versions.map(v => {
            const plain = v.get({ plain: true }) as any;
            return {
                ...plain,
                contentPreview: plain.content.substring(0, 100) + (plain.content.length > 100 ? '...' : '')
            };
        });

        res.json({
            success: true,
            versions: versionsWithPreview,
            hasMore: offset + versions.length < total,
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
        const versionId = parseInt(req.params.versionId);
        const version = await DraftVersion.findByPk(versionId);

        if (!version) {
            return res.status(404).json({ success: false, message: '版本不存在' });
        }

        // 验证草稿权限
        const draft = await Draft.findByPk(version.draftId);
        if (!draft || draft.authorId !== req.session.user.id) {
            return res.status(403).json({ success: false, message: '无权限查看此版本' });
        }

        res.json({ success: true, version: version.get({ plain: true }) });

    } catch (error: any) {
        console.error('获取版本详情失败:', error);
        res.status(500).json({ success: false, message: '获取版本详情失败' });
    }
};

// 恢复到指定版本
export const restoreVersion = async (req: Request, res: Response) => {
    try {
        const versionId = parseInt(req.params.versionId);
        const version = await DraftVersion.findByPk(versionId);

        if (!version) {
            return res.status(404).json({ success: false, message: '版本不存在' });
        }

        const draft = await Draft.findByPk(version.draftId);

        if (!draft) {
            return res.status(404).json({ success: false, message: '草稿不存在' });
        }

        // 权限检查
        if (draft.authorId !== req.session.user.id) {
            return res.status(403).json({ success: false, message: '无权限恢复此版本' });
        }

        // 先保存当前版本（恢复前状态）
        await DraftVersion.createVersion(
            draft.id,
            draft.title,
            draft.content,
            {
                categoryId: draft.categoryId,
                tags: draft.tagsArray,
                visibility: draft.visibility
            },
            'restore'
        );

        // 解析版本快照
        const snapshot = typeof version.snapshot === 'string'
            ? JSON.parse(version.snapshot)
            : version.snapshot;

        // 恢复到目标版本
        draft.title = version.title;
        draft.content = version.content;
        draft.categoryId = snapshot.categoryId || null;
        draft.tags = JSON.stringify(snapshot.tags || []);
        draft.visibility = snapshot.visibility as 'public' | 'private';
        draft.currentVersion = (draft.currentVersion || 0) + 1;

        await draft.save();

        lastVersionTime.set(String(draft.id), Date.now());

        res.json({
            success: true,
            draft: {
                id: draft.id,
                title: draft.title,
                content: draft.content,
                categoryId: draft.categoryId,
                tags: draft.tagsArray,
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
        const userId = req.session.user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        const { count: total, rows: drafts } = await Draft.findAndCountAll({
            where: { authorId: userId },
            include: [
                { model: Category, as: 'category', attributes: ['id', 'name'] },
                { model: Blog, as: 'blog', attributes: ['id', 'title'] }
            ],
            order: [['updatedAt', 'DESC']],
            offset,
            limit
        });

        const totalPages = Math.ceil(total / limit);

        // 计算字数
        const draftsWithStats = drafts.map(draft => {
            const plain = draft.get({ plain: true }) as any;
            return {
                ...plain,
                wordCount: (plain.content || '').replace(/\s+/g, '').length,
                summary: (plain.content || '').replace(/[#*`>\[\]()]/g, '').substring(0, 120)
            };
        });

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
