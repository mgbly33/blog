import { Router } from 'express';
import * as draftController from '../controllers/draftController';

const router = Router();

// 登录验证中间件
const requireLogin = (req: any, res: any, next: any) => {
    if (!req.session.user) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: '请先登录' });
        }
        return res.redirect('/login');
    }
    next();
};

// ===== 页面路由 =====

// 草稿列表页面
router.get('/', requireLogin, draftController.getDraftsPage);

// ===== API 路由 =====

// 保存草稿（创建）
router.post('/api', requireLogin, draftController.saveDraft);

// 保存草稿（更新）
router.put('/api/:id', requireLogin, (req, res, next) => {
    req.body.draftId = req.params.id;
    next();
}, draftController.saveDraft);

// 获取草稿列表
router.get('/api', requireLogin, draftController.getDraftList);

// 获取草稿详情
router.get('/api/:id', requireLogin, draftController.getDraftDetail);

// 删除草稿
router.delete('/api/:id', requireLogin, draftController.deleteDraft);

// 发布草稿
router.post('/api/:id/publish', requireLogin, draftController.publishDraft);

// ===== 版本管理 API =====

// 获取版本列表
router.get('/api/:id/versions', requireLogin, draftController.getVersions);

// 获取版本详情
router.get('/api/versions/:versionId', requireLogin, draftController.getVersionDetail);

// 恢复到指定版本
router.post('/api/:id/versions/:versionId/restore', requireLogin, draftController.restoreVersion);

export default router;
