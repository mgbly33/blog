const mongoose = require('mongoose');
const Blog = require('./models/blog');
const connectDB = require('./config');

const fixData = async () => {
    try {
        await connectDB();
        console.log('正在修复演示文章状态...');

        // 将所有待审核状态的文章改为已通过
        const result = await Blog.updateMany(
            { status: 'pending' },
            { $set: { status: 'approved' } }
        );

        console.log(`修复完成！成功上线 ${result.modifiedCount} 篇文章。`);
        console.log('现在刷新首页即可看到文章。');
        process.exit(0);
    } catch (err) {
        console.error('修复失败:', err);
        process.exit(1);
    }
};

fixData();
