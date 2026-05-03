import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
    name: string;
    description: string;
    color: string;
    icon: string;
    count: number;
    isHot: boolean;
    createdAt: Date;
}

const tagSchema: Schema<ITag> = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true  // 标签统一小写存储
    },
    description: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: '#007bff'  // 默认蓝色
    },
    icon: {
        type: String,
        default: ''  // 可选图标
    },
    count: {
        type: Number,
        default: 0  // 使用该标签的文章数量
    },
    isHot: {
        type: Boolean,
        default: false  // 是否热门标签
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 添加索引
tagSchema.index({ name: 1 });
tagSchema.index({ count: -1 });  // 按使用频率排序
tagSchema.index({ isHot: -1, count: -1 });  // 热门标签查询

export default mongoose.model<ITag>('Tag', tagSchema);
