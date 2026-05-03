import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import session from 'express-session';
import multer from 'multer';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { RedisStore } from 'connect-redis';
import Redis from 'ioredis';
import connectDB from './config';

import adminRouter from './routes/admin';
import authRouter from './routes/auth';
import blogRouter from './routes/blog';
import profileRouter from './routes/profile';
import sitemapRouter from './routes/sitemap';
import followRouter from './routes/follow';
import tagRouter from './routes/tag';
import searchRouter from './routes/search';
import notificationRouter from './routes/notification';
import draftRouter from './routes/draft';

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    app.set('trust proxy', 1);
}

// 项目根目录 (用于生产环境从 dist/ 运行时正确定位视图和静态资源)
const rootDir = process.cwd();

// 安全配置: Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.bootcdn.net", "https://code.jquery.com", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.bootcdn.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "blob:", "https://ui-avatars.com", "https://gravatar.com", "https://www.gravatar.com", "https://gw.alipayobjects.com"],
            fontSrc: ["'self'", "https://cdn.bootcdn.net", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "https://gw.alipayobjects.com"],
        },
    },
}));

// 安全配置: Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 1000, // 每个IP限制1000个请求 (开发环境放宽)
    message: '请求过于频繁，请15分钟后再试'
});
app.use(limiter);

// 安全配置: 防止NoSQL注入
app.use(mongoSanitize());

// 启用 gzip 压缩
app.use(compression());

// 中间件配置
app.set('view engine', 'ejs');
app.set('views', path.join(rootDir, 'views'));

// 静态资源配置 - 带缓存头
// uploads 目录：短期缓存（用户上传内容可能更新）
app.use('/uploads', express.static(path.join(rootDir, 'public/uploads'), {
    maxAge: isProduction ? '1d' : 0, // 生产环境 1 天
    etag: true,
    lastModified: true
}));

// 其他静态资源：长期缓存（CSS/JS/图片等）
app.use(express.static(path.join(rootDir, 'public'), {
    maxAge: isProduction ? '7d' : 0, // 生产环境 7 天
    etag: true,
    lastModified: true,
    immutable: isProduction // 生产环境标记为不可变
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session配置
// 扩展 Request 类型以包含 session
declare module 'express-session' {
    interface SessionData {
        user: any;
    }
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && isProduction) {
    throw new Error('SESSION_SECRET must be set in production.');
}

// Redis Session Store 配置 (生产环境使用 Redis，开发环境使用内存)
let sessionStore: RedisStore | undefined;
if (process.env.REDIS_HOST) {
    const redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryStrategy: (times) => {
            if (times > 3) {
                console.log('Redis session store connection failed, falling back to memory store');
                return null;
            }
            return Math.min(times * 50, 2000);
        }
    });

    redisClient.on('connect', () => {
        console.log('Redis session store connected');
    });

    redisClient.on('error', (err) => {
        console.error('Redis session store error:', err);
    });

    sessionStore = new RedisStore({
        client: redisClient,
        prefix: 'blog:session:'
    });
}

app.use(session({
    store: sessionStore,
    secret: sessionSecret || 'my_secret_key_blog_project',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

const sameOriginCheck = (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
        return next();
    }

    const origin = req.get('origin');
    const referer = req.get('referer');
    const expectedOrigin = `${req.protocol}://${req.get('host')}`;

    if (!origin && !referer) {
        if (isProduction) {
            return res.status(403).send('Forbidden');
        }
        return next();
    }

    if (origin && origin !== expectedOrigin) {
        return res.status(403).send('Forbidden');
    }

    if (!origin && referer && !referer.startsWith(expectedOrigin)) {
        return res.status(403).send('Forbidden');
    }

    return next();
};

app.use(sameOriginCheck);

// 设置全局用户信息变量，方便在所有模板中使用
app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.user = req.session.user || null;
    res.locals.pageTitle = '个人博客系统 | 听见思想的声音';
    res.locals.pageDescription = '分享技术见解，记录成长的每一步';
    res.locals.pageKeywords = '个人博客,技术博客,开发者社区';
    res.locals.pageImage = '/img/default-og-image.jpg';
    res.locals.pageUrl = 'http://localhost:3000';
    res.locals.pageType = 'website';
    next();
});

// 路由配置
app.use('/admin', adminRouter);
app.use('/drafts', draftRouter);
app.use('/', authRouter);
app.use('/', blogRouter);
app.use('/', profileRouter);
app.use('/', sitemapRouter);
app.use('/', followRouter);
app.use('/', tagRouter);
app.use('/', searchRouter);
app.use('/', notificationRouter);

// 404 错误处理
app.use((req: Request, res: Response) => {
    res.status(404).render('error', {
        message: '页面找不到了',
        error: { status: 404 }
    });
});

// 全局错误处理中间件
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // 处理文件上传错误
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).send('文件大小不能超过5MB');
        }
        return res.status(400).send('文件上传失败: ' + err.message);
    }

    // 处理服务器内部错误
    console.error('Server error:', err);
    res.status(500).render('error', {
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 异步启动逻辑 (在所有中间件和路由注册之后)
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
            console.log('Admin bootstrap: set ADMIN_INVITE_CODE to allow first admin registration.');
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();

export default app;
