import mongoose, { Document, Schema } from 'mongoose';

// Draft 接口定义
export interface IDraft extends Document {
    title: string;
    content: string;           // Markdown 原始内容
    category?: mongoose.Types.ObjectId;
    tags: string[];            // 标签名数组（未创建的标签名）
    visibility: 'public' | 'private';
    image?: string;
    author: mongoose.Types.ObjectId;
    blogId?: mongoose.Types.ObjectId;  // 关联已发布博客（编辑模式）
    lastSavedAt: Date;
    currentVersion: number;    // 当前版本号
    createdAt: Date;
    updatedAt: Date;

    // 虚拟属性
    isNewDraft: boolean;
}

// Draft Schema
const draftSchema: Schema<IDraft> = new Schema({
    title: {
        type: String,
        required: true,
        default: '无标题草稿',
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        default: ''
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: false
    },
    tags: [{
        type: String,
        trim: true
    }],
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    image: {
        type: String,
        required: false
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    blogId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: false,
        sparse: true  // 稀疏索引，允许多个 null 值
    },
    lastSavedAt: {
        type: Date,
        default: Date.now
    },
    currentVersion: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true  // 自动添加 createdAt 和 updatedAt
});

// 虚拟属性：判断是否为新建草稿（未关联已发布博客）
draftSchema.virtual('isNewDraft').get(function(this: IDraft) {
    return !this.blogId;
});

// 保存前更新 lastSavedAt
draftSchema.pre<IDraft>('save', function(next) {
    this.lastSavedAt = new Date();
    next();
});

// 索引
draftSchema.index({ author: 1, updatedAt: -1 });  // 按用户查询并按时间排序
draftSchema.index({ blogId: 1 }, { sparse: true });  // 查找关联博客的草稿
draftSchema.index({ author: 1, blogId: 1 });  // 复合查询

// 确保 toJSON 和 toObject 包含虚拟属性
draftSchema.set('toJSON', { virtuals: true });
draftSchema.set('toObject', { virtuals: true });

export default mongoose.model<IDraft>('Draft', draftSchema);
