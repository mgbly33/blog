const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// 如果安装了 mongodb-memory-server，则使用它，否则连接到本地测试库
let mongod;

module.exports.connect = async () => {
  if (process.env.USE_MEMORY_SERVER === 'true') {
     try {
       mongod = await MongoMemoryServer.create();
       const uri = mongod.getUri();
       await mongoose.connect(uri);
     } catch (err) {
       console.warn("MongoMemoryServer failed, falling back to local DB");
       await mongoose.connect('mongodb://localhost:27017/blog-project-test');
     }
  } else {
      // 默认使用本地测试数据库，避免 CI 环境安装问题
      await mongoose.connect('mongodb://localhost:27017/blog-project-test');
  }
};

module.exports.closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) {
    await mongod.stop();
  }
};

module.exports.clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};
