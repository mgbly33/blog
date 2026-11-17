# Blog Forum Platform

这是一个基于 **Spring Boot + React** 的前后端分离博客论坛平台，当前实现统一使用 **MySQL + JPA + Redis**，用于展示文章发布、评论互动、后台审核、通知私信与基础安全治理等全栈开发能力。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 后端 | Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA, Bean Validation, AOP |
| 前端 | React 18, TypeScript, Vite, Axios, Zustand, React Query |
| 数据库 | MySQL 8.x, JPA Entity, Repository, 关系型表设计, FULLTEXT 检索索引 |
| 缓存/中间件 | Redis, Token 黑名单, 接口限流 |
| 部署 | Docker, Docker Compose, Nginx 反向代理 |
| CI | GitHub Actions, Maven 测试, ESLint/TypeScript 检查, Docker 镜像构建校验 |

## 核心功能

- 用户登录、注册、JWT 刷新、退出登录。
- 文章发布、编辑、删除、Markdown 渲染、图片上传、草稿保存、版本回滚。
- 评论、回复、点赞、收藏、关注、通知和私信。
- 后台审核文章、分类、标签、敏感词、举报、用户和操作日志。
- 作者、普通用户和管理员的权限控制。

## 安全特性

- `Spring Security + JWT`：Access Token 用于接口访问，Refresh Token 用于续期。
- `Redis Token 黑名单`：刷新或退出时撤销旧 Token，过滤器拒绝已撤销的 jti。
- `XSS 过滤`：文章和评论内容进入系统前经过 `OWASP Java HTML Sanitizer` 清洗。
- `作者/管理员权限校验`：文章、评论、草稿、通知等操作按 `authorId/userId/admin` 判断权限，降低 IDOR 越权风险。
- `接口限流`：登录、注册、刷新等接口通过 Redis 计数做基础频率限制。

## 项目结构

```text
blog/
├── backend/                  # Spring Boot 后端
│   ├── src/main/java/com/blog
│   │   ├── controller/        # REST API
│   │   ├── service/           # 业务逻辑
│   │   ├── repository/        # JPA Repository
│   │   ├── entity/            # JPA Entity
│   │   ├── security/          # JWT、UserPrincipal、过滤器
│   │   ├── aspect/            # 操作日志、限流切面
│   │   └── util/              # HTML 清洗、敏感词等工具
│   └── src/test/java/         # 后端单元测试
├── frontend/                 # React + TypeScript 前端
│   ├── src/api/               # Axios API 客户端
│   ├── src/pages/             # 页面
│   ├── src/components/        # 通用组件
│   └── src/stores/            # 前端状态
├── docker/                   # Dockerfile、Compose、Nginx 配置
├── docs/                     # 项目文档和技术总结
├── sql/                      # MySQL 初始化/参考脚本
└── .github/workflows/         # GitHub Actions
```

## 本地启动

### 1. 准备依赖

- Java 17+
- Maven 3.9+
- Node.js 20+
- MySQL 8.x
- Redis 7.x

### 2. 初始化 MySQL

创建数据库：

```sql
CREATE DATABASE IF NOT EXISTS blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

后端默认使用 `spring.jpa.hibernate.ddl-auto=update` 自动维护表结构。全文检索索引可参考：

```bash
cd backend
# 应用启动并创建 blogs 表后，再按需执行 schema.sql 中的 FULLTEXT 索引脚本
```

### 3. 启动后端

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

常用后端环境变量：

| 变量 | 说明 |
| --- | --- |
| `DB_URL` | MySQL JDBC 地址 |
| `DB_USERNAME` / `DB_PASSWORD` | MySQL 用户名和密码 |
| `JWT_SECRET` | JWT 签名密钥，生产环境必须显式设置 |
| `JWT_EXPIRATION` / `JWT_REFRESH_EXPIRATION` | Access/Refresh Token 过期时间，单位毫秒 |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis 连接配置 |
| `CORS_ORIGINS` | 允许访问后端的前端域名 |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_INIT_ENABLED` | 本地初始化管理员账号，根据实际环境调整 |
| `UPLOAD_PATH` | 上传文件存储路径 |

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端 API 地址通过 `VITE_API_URL` 配置。未设置时默认走 `/api`；本地前后端分离启动时可设置为：

```powershell
$env:VITE_API_URL="http://localhost:8080"
npm run dev
```

访问地址：

| 服务 | 地址 |
| --- | --- |
| 前端 | `http://localhost:5173` |
| 后端 API | `http://localhost:8080` |
| Swagger | `http://localhost:8080/swagger-ui.html` |

## Docker Compose

开发环境：

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

该配置会启动 `frontend`、`backend`、`mysql`、`redis`。生产/部署环境请根据实际服务器修改密码、域名、CORS、上传路径和 JWT 密钥：

```bash
docker compose -f docker/docker-compose.yml up --build -d
```

## 测试与检查

后端测试：

```bash
cd backend
mvn test
```

前端检查和构建：

```bash
cd frontend
npm run lint
npm run build
```

当前测试主要覆盖：认证注册/登录/刷新、文章创建与可见性权限、评论创建与删除权限、用户资料/关注/通知、分类标签服务、HTML Sanitizer 的 XSS 过滤规则。没有在文档中声明无法验证的覆盖率。

## 面试亮点

- 完成从早期 Node.js/EJS 单体页面到 Spring Boot REST API + React SPA 的架构重构，前后端职责更清晰。
- 使用 MySQL + JPA 建模文章、评论、用户、草稿、通知等关系，配合索引和 Repository 查询支撑列表、检索和权限过滤。
- 用 Spring Security + JWT + Redis 黑名单实现登录、刷新、撤销和接口鉴权闭环。
- 针对 XSS、IDOR、身份标识混用做了基础安全加固，并有对应服务层校验和工具类支撑。
- 配置 Docker Compose、Nginx 和 GitHub Actions，具备容器化部署支持和基础 CI 校验。

## 相关文档

- [技术总结](./docs/技术总结.md)
- [面试复盘](./INTERVIEW.md)
- [快速启动](./docs/QUICK_START.md)
- [变更记录](./CHANGELOG.md)
