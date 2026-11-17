# 项目进展说明

本文档记录当前可用于求职展示的实现状态，不伪造历史迭代记录。

## 当前版本

- 后端：Spring Boot 3.2 + Spring Security + Spring Data JPA。
- 前端：React 18 + TypeScript + Vite。
- 数据层：MySQL + JPA，Redis 用于 Token 黑名单和限流。
- 工程化：Docker Compose、Nginx、GitHub Actions 基础 CI 校验。

## 已具备的展示点

- 登录注册、JWT 刷新、Token 黑名单。
- 文章发布、审核、定时发布/下线、草稿和版本。
- 评论、点赞、收藏、关注、通知、私信。
- 管理员接口、分类标签、举报、敏感词、操作日志。
- XSS 清洗、作者/管理员权限校验、身份标识统一为 userId。
- 后端服务层测试和前端 lint/build 检查。

## 后续可以继续补强

- 补充端到端测试或接口集成测试。
- 增加数据库迁移工具，例如 Flyway 或 Liquibase。
- 将部署链路扩展为镜像发布、服务器部署和回滚，而不是只做基础 CI。
- 为前端关键页面补充更多组件测试。
