import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    type: 'like' | 'comment' | 'follow' | 'mention' | 'reply' | 'system';
    content: string;
    relatedBlog?: mongoose.Types.ObjectId;
    relatedComment?: mongoose.Types.ObjectId;
    isRead: boolean;
    createdAt: Date;
}

const notificationSchema: Schema<INotification> = new Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true  // 按接收者查询优化
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'comment', 'follow', 'mention', 'reply', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    relatedBlog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog'
    },
    relatedComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true  // 未读消息查询优化
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// 复合索引：查询某用户的未读消息
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', notificationSchema);
