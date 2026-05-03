import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// 1. 定义接口
export interface IUser extends Document {
  username: string;
  password?: string;
  avatar: string;
  bio: string;
  isAdmin: boolean;
  isBanned: boolean;
  bookmarks: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  followers: mongoose.Types.ObjectId[];
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// 2. 创建 Schema
const userSchema: Schema<IUser> = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: '这位用户很懒，什么都没写。'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    bookmarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 3. 添加钩子
userSchema.pre<IUser>('save', async function(next) {
    if (!this.avatar) {
        const randomColor = Math.floor(Math.random()*16777215).toString(16);
        this.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.username)}&background=${randomColor}&color=fff&size=128`;
    }

    if (!this.isModified('password')) return next();

    try {
        if (this.password) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
        next();
    } catch (err: any) {
        next(err);
    }
});

// 4. 添加方法
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// 5. 添加索引
userSchema.index({ isAdmin: 1 });
userSchema.index({ isBanned: 1 });

// 6. 导出模型
export default mongoose.model<IUser>('User', userSchema);
