import { Request, Response, NextFunction } from 'express';

export const requireLogin = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.user) {
        return next();
    }
    // 如果是 AJAX 请求，返回 401 状态码
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(401).json({ error: '请先登录' });
    }
    // 普通请求重定向到登录页
    res.redirect('/login');
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.user && req.session.user.isAdmin) {
        return next();
    }
    res.status(403).send('访问拒绝：您不是管理员。');
};
