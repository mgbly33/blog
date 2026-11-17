# 快速启动

本文档对应当前 Spring Boot + React 版本。当前实现统一使用 MySQL + JPA + Redis。

## 方式一：Docker Compose 开发环境

在仓库根目录执行：

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

该命令会启动：

- `mysql:8.0`，默认库名 `blog`。
- `redis:7-alpine`。
- `backend`，通过 Maven 运行 Spring Boot dev profile。
- `frontend`，通过 Vite 暴露 `5173`。

访问：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:8080`
- Swagger：`http://localhost:8080/swagger-ui.html`

开发 Compose 中的默认密码只用于本地环境。公开部署时请通过环境变量替换。

## 方式二：本机分别启动

### 1. 创建 MySQL 数据库

```sql
CREATE DATABASE IF NOT EXISTS blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

启动 Redis，并确认端口为 `6379`。如你的 Redis 有密码，请配置 `REDIS_PASSWORD`。

### 2. 启动后端

PowerShell 示例：

```powershell
cd backend
$env:DB_URL="jdbc:mysql://localhost:3306/blog?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your-db-password"
$env:JWT_SECRET="base64-encoded-secret-at-least-32-bytes"
$env:REDIS_HOST="localhost"
$env:REDIS_PORT="6379"
mvn spring-boot:run
```

后端会读取 `backend/src/main/resources/application.yml` 与 `application-dev.yml`。本地 dev profile 带有默认值，但建议显式设置数据库和 JWT 变量。

### 3. 启动前端

```powershell
cd frontend
npm install
$env:VITE_API_URL="http://localhost:8080"
npm run dev
```

前端 API 客户端位于 `frontend/src/api/client.ts`，会把 `VITE_API_URL` 规范化为 `/api` 前缀。

## 常用检查命令

后端测试：

```bash
cd backend
mvn test
```

前端检查：

```bash
cd frontend
npm run lint
npm run build
```

## 常见问题

- 后端启动提示数据库连接失败：检查 `DB_URL`、`DB_USERNAME`、`DB_PASSWORD` 和 MySQL 是否已启动。
- Token 相关报错：检查 `JWT_SECRET` 是否为可 Base64 解码的足够长度密钥。
- 前端请求 404：检查 `VITE_API_URL` 是否指向后端地址，或 Nginx 是否正确代理 `/api`。
- Redis 不可用：登录限流可能降级，Token 黑名单能力会受影响，部署环境应保证 Redis 可用。
