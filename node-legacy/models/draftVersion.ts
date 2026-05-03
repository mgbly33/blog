import mongoose, { Document, Schema } from 'mongoose';

// DraftVersion 接口定义
export interface IDraftVersion extends Document {
    draftId: mongoose.Types.ObjectId;
    title: string;
    content: string;
    versionNumber: number;
    wordCount: number;
    changeType: 'auto' | 'manual' | 'restore';
    snapshot: {
        category?: mongoose.Types.ObjectId;
        tags: string[];
        visibility: string;
    };
    createdAt: Date;
}

// DraftVersion Schema
const draftVersionSchema: Schema<IDraftVersion> = new Schema({
    draftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Draft',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    versionNumber: {
        type: Number,
        required: true,
        min: 1
    },
    wordCount: {
        type: Number,
        default: 0
    },
    changeType: {
        type: String,
        enum: ['auto', 'manual', 'restore'],
        default: 'auto'
    },
    snapshot: {
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        },
        tags: [{
            type: String
        }],
        visibility: {
            type: String,
            default: 'public'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 复合索引：按草稿ID和版本号查询
draftVersionSchema.index({ draftId: 1, versionNumber: -1 });

// 按创建时间索引（用于 TTL 清理，可选）
draftVersionSchema.index({ createdAt: 1 });

// 静态方法：创建新版本
draftVersionSchema.statics.createVersion = async function(
    draftId: mongoose.Types.ObjectId,
    title: string,
    content: string,
    snapshot: { category?: mongoose.Types.ObjectId; tags: string[]; visibility: string },
    changeType: 'auto' | 'manual' | 'restore' = 'auto'
): Promise<IDraftVersion> {
    // 获取最新版本号
    const latestVersion = await this.findOne({ draftId })
        .sort({ versionNumber: -1 })
        .select('versionNumber')
        .lean();

    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // 计算字数
    const wordCount = content.replace(/\s+/g, '').length;

    // 创建新版本
    const version = new this({
        draftId,
        title,
        content,
        versionNumber: newVersionNumber,
        wordCount,
        changeType,
        snapshot
    });

    await version.save();

    // 限制每个草稿最多保留 50 个版本
    const maxVersions = 50;
    const versionsCount = await this.countDocuments({ draftId });

    if (versionsCount > maxVersions) {
        // 删除最旧的版本
        const oldestVersions = await this.find({ draftId })
            .sort({ versionNumber: 1 })
            .limit(versionsCount - maxVersions)
            .select('_id');

        const idsToDelete = oldestVersions.map((v: any) => v._id);
        await this.deleteMany({ _id: { $in: idsToDelete } });
    }

    return version;
};

// 扩展静态方法类型
interface IDraftVersionModel extends mongoose.Model<IDraftVersion> {
    createVersion(
        draftId: mongoose.Types.ObjectId,
        title: string,
        content: string,
        snapshot: { category?: mongoose.Types.ObjectId; tags: string[]; visibility: string },
        changeType?: 'auto' | 'manual' | 'restore'
    ): Promise<IDraftVersion>;
}

export default mongoose.model<IDraftVersion, IDraftVersionModel>('DraftVersion', draftVersionSchema);
