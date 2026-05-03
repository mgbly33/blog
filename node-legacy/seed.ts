import mongoose from 'mongoose';
import User from './models/user';
import Blog from './models/blog';
import Comment from './models/comment';
import Category from './models/category';
import Link from './models/link';
import Tag from './models/tag';
import connectDB from './config';

const seedData = async () => {
    try {
        await connectDB();

        // 1. Clean existing data
        console.log('Cleaning database...');
        await User.deleteMany({});
        await Blog.deleteMany({});
        await Comment.deleteMany({});
        await Category.deleteMany({});
        await Link.deleteMany({});
        await Tag.deleteMany({});

        // 2. Create Categories
        console.log('Creating categories...');
        const categoriesData = [
            { name: '前端开发', order: 1 },
            { name: '后端架构', order: 2 },
            { name: '人工智能', order: 3 },
            { name: '生活随笔', order: 4 },
            { name: '学习笔记', order: 5 }
        ];
        const categories = await Category.insertMany(categoriesData);

        // 3. Create NPC Users (NO ADMIN)
        console.log('Creating NPC users...');
        const userNames = [
            '技术大咖', '代码诗人', '极客阿强', '前端小妹',
            '全栈老王', '数据分析师李', '云原生探索者', '生活观察家',
            '读书人张三', '咖啡与代码'
        ];

        const usersData = [];
        for (let i = 0; i < userNames.length; i++) {
            usersData.push({
                username: userNames[i],
                password: 'password123',
                bio: `热爱技术，热爱生活。这是 ${userNames[i]} 的个人简介。`,
                isAdmin: false // Ensure they are NOT admins
            });
        }

        const users = [];
        for (const userData of usersData) {
            const user = new User(userData);
            // User registered 90-120 days ago
            const regTime = Date.now() - (90 * 24 * 60 * 60 * 1000) - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
            user.createdAt = new Date(regTime);
            await user.save();
            users.push(user);
        }

        // 4. Create Blogs
        console.log('Creating blogs...');

        // Real article data + Renaissance/Art/Tech mix
        const articleData = [
            {
                title: "代码之美：算法里的黄金分割率",
                content: "<p>在数学与艺术的交汇点，黄金分割率（1.618）不仅是达芬奇画作中的常客，也悄然存在于优雅的代码结构中。</p><p>当我们讨论代码的可读性与对称性时，我们实际上是在讨论一种程序美学。一份比例匀称、逻辑分明的代码，本身就是一种数字时代的雕塑艺术。</p>",
                categoryName: "前端开发",
                tags: ["代码美学", "数学", "设计模式"]
            },
            {
                title: "文艺复兴时期的透视法与现代响应式布局",
                content: "<p>15世纪的艺术家们通过消失点创造了三维深度。今天，我们通过 CSS Grid 和 Flexbox 在二维屏幕上构建复杂的空间感。</p><p>响应式布局不仅仅是适配屏幕，它是对数字空间感的一种重塑。正如布鲁内莱斯基重构了城市景观，我们也正在重构信息流的展现方式。</p>",
                categoryName: "前端开发",
                tags: ["UI设计", "历史", "CSS"]
            },
            {
                title: "后人类时代的 AI：数字灵魂的觉醒？",
                content: "<p>如果米开朗基罗在今天，他或许不会在大理石上雕刻，而是在神经网络中赋予数字生命。</p><p>大语言模型（LLM）不仅是概率预测器，它们是人类集体智慧的映射。我们正站在一个新时代的边缘，硅基生命与人类情感的边界正变得前所未有的模糊。</p>",
                categoryName: "人工智能",
                tags: ["AI哲学", "ChatGPT", "未来"]
            },
            {
                title: "极简主义：在繁杂的后端架构中寻找减法",
                content: "<p>正如现代主义建筑大师密斯·凡·德·罗所言：‘Less is More’。在复杂的微服务集群中，真正的智慧往往在于如何优雅地解耦。</p><p>过度设计是开发者面临的最大诱惑。我们需要重归设计的本源，用最克制的代码实现最强大的功能，这便是技术的禅意。</p>",
                categoryName: "后端架构",
                tags: ["微服务", "架构哲学", "解耦"]
            },
            {
                title: "暗影与光：UI 设计中的克莱罗斯库罗",
                content: "<p>克莱罗斯库罗（Chiaroscuro）是意大利语中‘明暗对照法’。通过强烈的对比，画面会展现出惊人的戏剧张力。</p><p>在我们的中性色调布局中，光影的微妙变化能引导用户的视线，创造出一种沉浸式的交互体验。这不仅仅是视觉美化，更是心理暗示的艺术。</p>",
                categoryName: "前端开发",
                tags: ["设计原理", "光影", "文艺复兴"]
            },
            {
                title: "深夜食堂：一碗让代码冷静下来的热汤面",
                content: "<p>有时候，最好的 Debug 手段不是搜索 Stack Overflow，而是合上电脑，去厨房煮一碗面。</p><p>热气腾腾的烟雾里，那些卡住的内存泄漏或许会突然显现出真相。生活随笔不只是记录，它是我们链接真实世界的锚点。</p>",
                categoryName: "生活随笔",
                tags: ["程序员生活", "美食", "治愈"]
            },
            {
                title: "从羊皮卷到 Markdown：人类知识载体的变迁",
                content: "<p>从中世纪修道院里的僧侣抄写员，到今天在 IDE 中敲击 Markdown 的我们，记录的工具在变，但渴望沟通的灵魂从未改变。</p><p>Markdown 的流行在于它的纯粹。它剥离了排版的干扰，迫使我们将注意力重新集中在‘思考’与‘表达’本身。</p>",
                categoryName: "学习笔记",
                tags: ["写作工具", "知识管理", "Markdown"]
            }
        ];

        const blogs = [];

        for (const article of articleData) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            // Find category by name
            const category = categories.find(c => c.name === article.categoryName) || categories[0];

            const authorRegTime = randomUser.createdAt.getTime();
            // Blog posted 1-30 days AFTER author registration
            const blogTime = authorRegTime + (24 * 60 * 60 * 1000) + Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);

            // Process tags
            const tagIds = [];
            if (article.tags && article.tags.length > 0) {
                for (const tagName of article.tags) {
                    let tag = await Tag.findOne({ name: tagName.toLowerCase() });
                    if (!tag) {
                        tag = await Tag.create({
                            name: tagName,
                            color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
                        });
                    }
                    tagIds.push(tag._id);
                }
            }

            const blog = new Blog({
                title: article.title,
                content: article.content,
                author: randomUser._id,
                category: category._id,
                tags: tagIds,
                visibility: 'public',
                views: Math.floor(Math.random() * 1000) + 100,
                likes: [users[Math.floor(Math.random() * users.length)]._id],
                status: 'approved', // 核心：确保演示文章直接显示
                createdAt: new Date(blogTime)
            });
            await blog.save();
            blogs.push(blog);
        }

        // 5. Create Comments
        console.log('Creating comments...');
        const commentsData = [
            "写得太好了，受益匪浅！", "干货满满，支持博主！", "这个观点很有趣。",
            "Mark一下，回头再看。", "请问有没有更详细的教程？", "这里的代码好像有个小bug？",
            "感谢分享，正好在学这个。", "期待下一篇更新！", "顶顶顶！", "学习了。"
        ];

        for (const blog of blogs) {
            const commentCount = Math.floor(Math.random() * 5);
            for (let j = 0; j < commentCount; j++) {
                const randomUser = users[Math.floor(Math.random() * users.length)];
                const randomContent = commentsData[Math.floor(Math.random() * commentsData.length)];
                const blogPubTime = blog.createdAt.getTime();
                // Comment posted 1-5 days AFTER blog publication
                const commentTime = blogPubTime + (60 * 60 * 1000) + Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000);

                await Comment.create({
                    blogId: blog._id,
                    content: randomContent,
                    author: randomUser._id,
                    createdAt: new Date(commentTime)
                });
            }
        }

        // 6. Create Links
        console.log('Creating links...');
        await Link.create({ name: 'Google', url: 'https://www.google.com', description: '搜索引擎' });
        await Link.create({ name: 'StackOverflow', url: 'https://stackoverflow.com', description: '开发者问答' });
        await Link.create({ name: 'GitHub', url: 'https://github.com', description: '代码托管' });
        await Link.create({ name: 'Vue.js', url: 'https://vuejs.org', description: '前端框架' });

        console.log('--- Initialization Complete ---');
        console.log(`Generated ${users.length} users, ${blogs.length} blogs, and multiple comments.`);
        console.log('Note: NO ADMIN account was created. The next registered user will become Admin.');

        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
};

seedData();
