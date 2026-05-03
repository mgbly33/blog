import mongoose, { Document, Schema } from 'mongoose';
import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';
import filterSensitiveWords from '../utils/filter'; // 现在可以安全导入 ts 版本

// 1. 定义接口
export interface IBlog extends Document {
    title: string;
    content: string;
    image?: string;
    category?: mongoose.Types.ObjectId;
    visibility: 'public' | 'private';
    status: 'pending' | 'approved' | 'rejected';
    tags: mongoose.Types.ObjectId[];
    rawContent?: string;
    summary: string;
    readTime: number;
    collectCount: number;
    commentCount: number;
    likes: mongoose.Types.ObjectId[];
    likesCount: number; // 存储字段，用于排序
    author: mongoose.Types.ObjectId;
    views: number;
    isSticky: boolean;
    createdAt: Date;

    // Methods
    calculateReadTime(): number;
    generateSummary(): string;
}

// 2. 创建 Schema
const blogSchema: Schema<IBlog> = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: false
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    rawContent: {
        type: String,
        required: false
    },
    summary: {
        type: String,
        maxlength: 200
    },
    readTime: {
        type: Number,
        default: 1
    },
    collectCount: {
        type: Number,
        default: 0
    },
    commentCount: {
        type: Number,
        default: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likesCount: {
        type: Number,
        default: 0,
        index: true // 添加索引用于排序
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isSticky: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 3. 添加钩子
blogSchema.pre<IBlog>('save', function (next) {
    if (this.isModified('title')) {
        this.title = filterSensitiveWords(this.title);
        // 标题应该是纯文本，去除所有HTML标签
        this.title = sanitizeHtml(this.title, {
            allowedTags: [],
            allowedAttributes: {}
        });
    }

    if (this.isModified('content') || this.isModified('rawContent')) {
        // 如果有rawContent，使用它；否则使用content
        let sourceContent = this.rawContent || this.content;

        // 如果没有rawContent，保存一份
        if (!this.rawContent) {
            this.rawContent = sourceContent;
        }

        // 先过滤敏感词
        let cleanContent = filterSensitiveWords(sourceContent);

        // 将 Markdown 转换为 HTML
        // marked 返回 Promise 或 string，视版本配置而定。v4+ 默认同步。
        // 如有异步需求，需改为 async function 并 await marked(cleanContent)
        let htmlContent = marked(cleanContent) as string;

        // 然后净化HTML以防止XSS攻击，允许部分安全标签
        this.content = sanitizeHtml(htmlContent, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'span', 'div', 'pre', 'code']),
            allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                'img': ['src', 'alt', 'width', 'height'],
                'span': ['class'],
                'div': ['class'],
                'p': ['class'],
                'code': ['class'],
                'pre': ['class']
            },
            allowedClasses: {
                'code': ['language-*', 'hljs', 'lang-*'],
                'pre': ['hljs']
            }
        });

        // 自动生成摘要和计算阅读时间
        this.generateSummary();
        this.calculateReadTime();
    }

    next();
});

// 4. 全文索引
blogSchema.index({ title: 'text', content: 'text', summary: 'text' });

// 5. 同步 likesCount 字段（保持向后兼容）
blogSchema.pre<IBlog>('save', function (next) {
    // 自动同步 likesCount 字段
    if (this.isModified('likes')) {
        this.likesCount = this.likes ? this.likes.length : 0;
    }
    next();
});

// 6. Methods
blogSchema.methods.calculateReadTime = function (this: IBlog): number {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    return this.readTime;
};

blogSchema.methods.generateSummary = function (this: IBlog): string {
    if (!this.summary && this.rawContent) {
        // 从markdown中提取前200个字符作为摘要
        const plainText = this.rawContent.replace(/[#*`>\[\]()]/g, '').trim();
        this.summary = plainText.substring(0, 200);
    }
    return this.summary;
};

// 7. 性能索引
blogSchema.index({ status: 1, visibility: 1, createdAt: -1 });
blogSchema.index({ author: 1, status: 1 });
blogSchema.index({ views: -1 });
blogSchema.index({ isSticky: -1, createdAt: -1 });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ createdAt: -1 });

export default mongoose.model<IBlog>('Blog', blogSchema);
