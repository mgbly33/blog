# 面试复盘

## 项目一句话介绍

这是一个基于 Spring Boot + React 的前后端分离博客论坛平台，后端使用 MySQL + JPA + Redis，覆盖登录注册、文章发布、评论互动、后台审核、通知私信和基础安全治理。

## 为什么做这个项目

这个项目的目标不是只做页面展示，而是把一个常见内容社区拆成完整的前后端工程：后端负责认证鉴权、业务规则、数据持久化和安全校验，前端负责路由、页面状态、编辑器和用户交互。它适合用来展示 Java 后端、React 前端、数据库建模、缓存和工程化交付能力。

## 技术选型原因

- Spring Boot：适合快速搭建 REST API，生态中包含 Spring Security、JPA、Validation、AOP 等常用工程能力。
- React + TypeScript：适合前后端分离页面，类型约束能降低接口字段变化带来的问题。
- MySQL + JPA：博客、用户、评论、通知等数据关系明确，适合用关系型表和 Repository 查询表达。
- Redis：用于 Token 黑名单和接口限流，避免把所有临时状态都落到 MySQL。
- Docker / Nginx / GitHub Actions：用于展示基础工程化能力，包括容器化运行、反向代理和 CI 校验。

## 核心模块说明

- 认证模块：`AuthController`、`AuthService`、`JwtTokenProvider`、`JwtAuthenticationFilter`。
- 文章模块：`BlogController`、`BlogService`、`BlogRepository`、`Blog`。
- 评论模块：`CommentController`、`CommentService`、`CommentRepository`、`Comment`。
- 草稿模块：`DraftController`、`DraftService`、`Draft`、`DraftVersion`。
- 后台模块：`AdminController`、`AdminService`，以及分类、标签、敏感词、举报、日志等管理接口。
- 通知/私信模块：`NotificationRepository`、`MessageController`、`MessageService`。

## 登录鉴权流程

1. 用户调用 `/api/auth/login`，提交用户名和密码。
2. `AuthenticationManager` 校验账号密码。
3. `AuthService` 从认证结果中取得 `UserPrincipal`。
4. `JwtTokenProvider` 使用 userId 生成 Access Token 和 Refresh Token。
5. 前端保存 Token，并在后续请求中通过 `Authorization: Bearer <token>` 携带。
6. `JwtAuthenticationFilter` 每次请求解析 Token，校验签名、过期时间、Token 类型和 Redis 黑名单。

## JWT 刷新和 Token 黑名单设计

Access Token 用于接口访问，Refresh Token 用于续期。刷新时服务端先校验 Refresh Token 是否有效，再把旧 Refresh Token 的 jti 写入 Redis 黑名单，随后签发新的 Access Token 和 Refresh Token。过滤器发现请求 Token 的 jti 在黑名单中时，会拒绝继续设置登录态。

对应代码：`AuthService.refreshToken()`、`AuthService.revokeToken()`、`JwtTokenProvider.extractJti()`、`JwtAuthenticationFilter`。

## XSS 如何防护

文章内容先由 Markdown 转 HTML，再通过 `HtmlSanitizer.sanitizeBlogContent()` 清洗后保存；评论走更严格的 `sanitizeComment()`。清洗策略限制允许的标签、属性和 URL 协议，移除脚本、危险协议和不可信 HTML。

对应代码：`backend/src/main/java/com/blog/util/HtmlSanitizer.java`、`BlogService.createBlog()`、`BlogService.updateBlog()`、`CommentService.createComment()`。

## IDOR 越权如何防护

IDOR 的核心是不能只相信前端传来的资源 id。服务层读取资源后，会用当前登录用户 id 与资源的 `authorId` 或所属用户 id 比较；如果不是作者，也不是管理员，就拒绝操作。

示例：

- `BlogService.getBlogById()`：非作者只能访问已审核公开文章，管理员例外。
- `BlogService.updateBlog()` / `deleteBlog()`：作者或管理员才能修改/删除。
- `DraftService`：草稿读取、更新、删除都校验 `authorId`。
- `UserService`：通知等个人资源校验当前用户归属。

## MySQL 表设计概览

- `users`：用户账号、密码、头像、简介、管理员标识、封禁状态。
- `blogs`：文章标题、正文、摘要、作者、分类、状态、可见性、发布时间、浏览/点赞/收藏计数。
- `comments`：评论内容、文章 id、作者 id、父评论 id。
- `drafts` / `draft_versions`：草稿和历史版本。
- `notifications` / `messages`：通知和私信。
- `categories` / `tags`：分类、标签。
- `blog_tags`、`blog_likes`、`user_bookmarks`、`user_following` 等集合表：维护多对多或用户行为关系。

对应代码在 `backend/src/main/java/com/blog/entity/`，参考 SQL 在 `sql/blog.sql` 和 `backend/src/main/resources/schema.sql`。

## Redis 用在哪里

- Token 黑名单：以 `jwt:blacklist:{jti}` 存储被撤销 Token，TTL 与 Token 剩余有效期对齐。
- 接口限流：以 `rate_limit:{action}:{key}` 做固定窗口计数，限制登录、注册、刷新等高频接口。

对应代码：`AuthService`、`JwtAuthenticationFilter`、`RateLimiterService`、`RateLimitAspect`。

## Docker / Nginx / GitHub Actions 分别做什么

- Docker：后端打包为 JAR 运行镜像，前端构建为静态资源镜像。
- Docker Compose：编排 MySQL、Redis、backend、frontend，降低本地启动成本。
- Nginx：提供前端静态资源，代理 `/api` 到后端，并支持 SPA 路由 fallback。
- GitHub Actions：后端运行 Maven 编译和测试，前端运行 lint、类型检查和构建，并做 Docker 镜像构建校验。

## 面试官可能追问的问题和参考回答

### 为什么当前版本用 MySQL + JPA？

博客论坛的数据关系比较明确，例如用户与文章、文章与评论、文章与标签、用户关注、点赞收藏等，使用关系型表更直观，也方便用索引优化列表查询和状态过滤。JPA 能减少重复 CRUD 代码，同时保留自定义 JPQL/native SQL 处理复杂查询。

### Token 黑名单为什么放 Redis？

黑名单是有过期时间的临时状态，适合放 Redis。每个 Token 带 jti，撤销时把 jti 写入 Redis 并设置 TTL。这样不用在 MySQL 中维护大量短期 Token 记录，也能让过滤器快速判断 Token 是否已撤销。

### 如果 Redis 挂了怎么办？

当前实现中限流服务在 Redis 异常时会降级放行，避免登录注册完全不可用。Token 黑名单校验依赖 Redis，真实部署时应保证 Redis 可用性，并结合更短 Access Token 有效期降低风险。

### XSS 防护有哪些边界？

服务端使用 HTML Sanitizer 过滤内容，能降低存储型 XSS 风险，但不是唯一防线。前端渲染 Markdown/HTML 时也需要避免直接执行不可信脚本，上传、链接跳转、富文本扩展都应继续做白名单约束。

### IDOR 防护的关键点是什么？

关键是服务端不能只根据资源 id 直接返回或修改数据。每次访问私有资源时都要把资源所属用户和当前登录用户比较，或者判断当前用户是否有管理员角色。这个项目把校验放在 `Service` 层，避免只依赖前端隐藏按钮。

### 为什么只说基础 CI 校验？

当前 GitHub Actions 能证明编译、测试、lint、构建和 Docker 镜像构建校验，但没有把镜像发布到仓库，也没有服务器发布和真实环境回滚流程。因此更准确的说法是基础 CI 校验和容器化部署支持。
