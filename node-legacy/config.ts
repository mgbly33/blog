import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog_db';

        // MongoDB 连接池配置
        const options = {
            maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE || '10'), // 最大连接数
            minPoolSize: 2, // 最小连接数
            maxIdleTimeMS: 30000, // 空闲连接最大存活时间 30s
            serverSelectionTimeoutMS: 5000, // 服务器选择超时 5s
            socketTimeoutMS: 45000, // Socket 超时 45s
            bufferCommands: false, // 禁用命令缓冲（连接失败时立即报错）
        };

        await mongoose.connect(mongoURI, options);
        console.log('MongoDB connected successfully (pool size:', options.maxPoolSize, ')');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

export default connectDB;
