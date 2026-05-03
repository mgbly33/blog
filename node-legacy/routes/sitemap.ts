import express, { Request, Response } from 'express';
import Blog from '../models/blog';

const router = express.Router();

// 生成 sitemap.xml
router.get('/sitemap.xml', async (req: Request, res: Response) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        // 获取所有已审核且公开的博客
        const blogs = await Blog.find({
            status: 'approved',
            visibility: 'public'
        }).select('_id createdAt updatedAt').sort({ updatedAt: -1 });

        // 构建 XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // 首页
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/</loc>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>1.0</priority>\n`;
        xml += '  </url>\n';

        // 登录页
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/login</loc>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.5</priority>\n`;
        xml += '  </url>\n';

        // 注册页
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/register</loc>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.5</priority>\n`;
        xml += '  </url>\n';

        // 博客文章
        blogs.forEach((blog: any) => {
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}/blog/${blog._id}</loc>\n`;
            const lastmod = blog.updatedAt || blog.createdAt;
            if (lastmod) {
                xml += `    <lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>\n`;
            }
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;
            xml += '  </url>\n';
        });

        xml += '</urlset>';

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        console.error('Sitemap generation error:', err);
        res.status(500).send('Error generating sitemap');
    }
});

export default router;
