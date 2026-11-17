# SEO 与性能优化说明

本文只记录当前项目中可对应到代码或配置的优化点。

## 前端

- Vite 构建 React SPA，生产环境由 Nginx 提供静态资源。
- `docker/nginx.conf` 配置静态资源缓存、gzip 和 SPA fallback。
- `frontend/src/api/client.ts` 统一 API baseUrl，并在响应拦截器中处理 Token 刷新。

## 后端

- MySQL 表设计中为文章状态、可见性、作者、分类、创建时间、浏览量等字段配置索引。
- `BlogRepository.searchByText()` 使用 MySQL FULLTEXT 检索，`schema.sql` 提供全文索引脚本。
- `RateLimiterService` 使用 Redis 计数，降低登录/注册/刷新等接口被高频调用的风险。
- 上传文件路径通过 `UPLOAD_PATH` 配置，根据实际部署环境调整。

## 可继续补强

- 服务端渲染或预渲染不是当前版本能力，SEO 只能做基础页面信息和静态资源优化。
- 可以增加接口缓存、分页参数保护、慢查询分析和数据库迁移脚本。
- 可以增加 Lighthouse 报告作为前端性能证据，但当前文档不伪造分数。
