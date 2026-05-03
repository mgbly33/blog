import { Request, Response } from 'express';
import User from '../models/user';

// 获取注册页面
export const getRegister = (req: Request, res: Response) => {
    const allowAdminCode = Boolean(process.env.ADMIN_INVITE_CODE);
    res.render('register', { allowAdminCode });
};

// 处理注册请求
export const postRegister = async (req: Request, res: Response) => {
    const { username, password, adminCode } = req.body;
    const allowAdminCode = Boolean(process.env.ADMIN_INVITE_CODE);
    const adminInviteCode = process.env.ADMIN_INVITE_CODE;
    const normalizedAdminCode = typeof adminCode === 'string' ? adminCode.trim() : '';
    const normalizedInviteCode = adminInviteCode ? adminInviteCode.trim() : '';

    try {

        // 验证用户名长度
        if (!username || username.length < 3 || username.length > 20) {
            return res.render('register', {
                error: '用户名长度必须在3-20个字符之间',
                username: username,
                allowAdminCode
            });
        }

        // 验证用户名格式（支持中文）
        if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
            return res.render('register', {
                error: '用户名只能包含字母、数字、下划线和中文',
                username: username,
                allowAdminCode
            });
        }

        // 验证密码长度
        if (!password || password.length < 6) {
            return res.render('register', {
                error: '密码长度至少为6个字符',
                username: username,
                allowAdminCode
            });
        }

        // 检查数据库中是否存在管理员
        const adminCount = await User.countDocuments({ isAdmin: true });
        const canBootstrapAdmin = Boolean(
            normalizedInviteCode &&
                normalizedAdminCode &&
                normalizedAdminCode === normalizedInviteCode &&
                adminCount === 0
        );

        if (normalizedAdminCode && !canBootstrapAdmin) {
            return res.render('register', {
                error: 'Admin invite code is invalid or already used.',
                username: username,
                allowAdminCode
            });
        }

        const user = new User({
            username,
            password,
            isAdmin: canBootstrapAdmin
        });
        await user.save();

        if (canBootstrapAdmin) {
            console.log(`Admin bootstrap completed for user: ${username}`);
        }

        // 自动登录
        req.session.user = user;
        res.redirect('/');
    } catch (err: any) {
        if (err.code === 11000) {
            return res.render('register', {
                error: '用户名已被占用，请使用其他用户名',
                username: req.body.username,
                allowAdminCode
            });
        }
        return res.render('register', {
            error: '注册失败: ' + err.message,
            username: req.body.username,
            allowAdminCode
        });
    }
};

// 获取登录页面
export const getLogin = (req: Request, res: Response) => {
    res.render('login');
};

// 处理登录请求
export const postLogin = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // 调试日志
        console.log('登录尝试:', username);

        const user = await User.findOne({ username });
        if (!user) {
            return res.render('login', {
                error: '用户名或密码错误，请重试',
                username: username
            });
        }

        // 检查账户是否被封禁
        if (user.isBanned) {
            return res.render('login', {
                error: '您的账号已被封禁，请联系管理员',
                username: username
            });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.render('login', {
                error: '用户名或密码错误，请重试',
                username: username
            });
        }

        // 设置Session
        req.session.user = user;
        res.redirect('/');
    } catch (err: any) {
        console.log('登录错误:', err.message);
        return res.render('login', {
            error: '登录失败：' + err.message,
            username: req.body.username
        });
    }
};

// 处理注销请求
export const logout = (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).send('无法注销');
        res.redirect('/');
    });
};
