# 🚀 TypeScript 全栈博客系统 - 启动指南

本文档将帮助你快速启动经过 TypeScript 重构和工程化升级的博客系统。

## 📋 环境要求

*   **Node.js**: v14+ (推荐 v18 或 v20)
*   **Docker** & **Docker Compose** (推荐用于一键启动所有服务)
*   或者本地安装了 **MongoDB** 和 **Redis**

---

## 🛠️ 方式一：使用 Docker 一键启动 (推荐)

这是最简单的方式，不需要手动安装 MongoDB 和 Redis。

1.  **构建并启动服务**
    ```bash
    docker-compose up --build
    ```
    *(加上 `-d` 参数可在后台运行: `docker-compose up --build -d`)*

2.  **访问应用**
    打开浏览器访问: [http://localhost:3000](http://localhost:3000)

3.  **停止服务**
    ```bash
    docker-compose down
    ```

---

## 💻 方式二：本地开发模式启动

如果你想在本地进行开发或调试，请按照以下步骤操作。

### 1. 安装依赖

```bash
npm install --legacy-peer-deps
```

### 2. 准备环境

确保你本地已经启动了 MongoDB 和 Redis。

*   **MongoDB**: 默认端口 `27017`
*   **Redis**: 默认端口 `6379`

如果需要修改数据库配置，请创建 `.env` 文件（参考 `.env.example`，如果不存在则直接创建）：

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/blog-project
REDIS_HOST=localhost
REDIS_PORT=6379
SESSION_SECRET=your_secret_key
NODE_ENV=development
```

### 3. 编译 TypeScript 代码

在启动之前，由于我们迁移到了 TypeScript，建议先尝试编译代码检查是否有错误（虽然 `ts-node` 可以直接运行，但编译是很好的检查步骤）。

```bash
# 编译代码到 dist 目录
npx tsc
```
*如果遇到 `tsc` 命令未找到错误，尝试 `npm install typescript -g` 或直接运行 `npm run dev` (我们已经配置了 nodemon + ts-node)*

### 4. 启动应用

我们更新了 `package.json` 脚本以支持 TypeScript。

**开发模式 (自动重启):**
由于我们引入了 TypeScript，你需要确保 `nodemon.json` 配置了对 `.ts` 文件的支持，或者直接使用：

```bash
# 推荐：使用 ts-node 直接运行（需先安装 ts-node）
npm install -g ts-node
ts-node app.ts
```

**或者修改 `package.json` 的 `dev` 脚本:**
我们建议将 `package.json` 中的 `dev` 脚本修改为使用 `ts-node-dev` 或 `nodemon` 配合 `ts-node`。

*当前推荐的启动命令（如果 Docker 不可用）：*

1.  **安装 ts-node 和 nodemon** (如果尚未安装)
    ```bash
    npm install -g ts-node typescript nodemon
    ```

2.  **运行**
    ```bash
    nodemon app.ts
    ```

---

## ✅ 验证安装

1.  **访问首页**: [http://localhost:3000](http://localhost:3000)
2.  **注册管理员**: 访问 `/register` 注册第一个用户，自动成为管理员。
3.  **检查日志**: 查看 `logs/combined.log` 确认日志记录正常。

## 🧪 运行测试

确保代码功能正常：

```bash
npm test
```

## 📝 常见问题

*   **错误: `Cannot find module ...`**: 确保执行了 `npm install`。
*   **错误: `Redis connection failed`**: 检查 Redis 是否启动，或者应用会自动降级使用内存缓存。
*   **TypeScript 编译错误**: 检查 `tsconfig.json` 配置，确保包含了所有必要的文件。

---

祝你使用愉快！🚀
