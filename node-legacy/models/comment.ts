import mongoose, { Document, Schema } from 'mongoose';
import filterSensitiveWords from '../utils/filter';
import sanitizeHtml from 'sanitize-html';

export interface IComment extends Document {
    blogId: mongoose.Types.ObjectId;
    content: string;
    author: mongoose.Types.ObjectId;
    parentComment?: mongoose.Types.ObjectId;
    mentions: mongoose.Types.ObjectId[];
    replyCount: number;
    likes: mongoose.Types.ObjectId[];
    createdAt: Date;
}

const commentSchema: Schema<IComment> = new Schema({
    blogId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // 新增：父评论ID，用于实现评论回复功能
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    // 新增：被@的用户列表
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // 新增：回复列表（虚拟字段或者直接查询）
    replyCount: {
        type: Number,
        default: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook for sensitive word filtering and XSS prevention
commentSchema.pre<IComment>('save', function (next) {
    if (this.isModified('content')) {
        // 提取@提醒（后续处理）
        // 匹配 @username 格式
        const mentionRegex = /@(\w+)/g;
        const mentions: string[] = [];
        let match;
        while ((match = mentionRegex.exec(this.content)) !== null) {
            mentions.push(match[1]);
        }
        // 稍后在控制器中处理mentions数组，转换为用户ID

        // First filter sensitive words
        let cleanContent = filterSensitiveWords(this.content);

        // Then sanitize HTML - comments should not allow any HTML tags
        this.content = sanitizeHtml(cleanContent, {
            allowedTags: [],
            allowedAttributes: {}
        });
    }
    next();
});

// 添加索引优化
commentSchema.index({ blogId: 1, createdAt: -1 });  // 查询文章评论
commentSchema.index({ author: 1 });  // 查询用户评论
commentSchema.index({ parentComment: 1 });  // 查询回复

export default mongoose.model<IComment>('Comment', commentSchema);
