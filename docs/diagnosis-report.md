# 诊断报告

## 结论

当前主版本应按 Spring Boot + React 前后端分离项目展示，数据层统一为 MySQL + JPA + Redis。旧文档中的不一致描述已经不适合作为求职展示材料。

## 已确认的代码证据

- MySQL/JPA：`backend/pom.xml`、`application.yml`、`entity/`、`repository/`、`schema.sql`。
- Redis：`application.yml`、`AuthService`、`JwtAuthenticationFilter`、`RateLimiterService`。
- 安全：`SecurityConfig`、`JwtTokenProvider`、`HtmlSanitizer`、服务层作者/管理员校验。
- 前端：`frontend/package.json`、`frontend/src/api/client.ts`。
- Compose：`docker/docker-compose.dev.yml`、`docker/docker-compose.yml`。
- CI：`.github/workflows/backend.yml`、`.github/workflows/frontend.yml`。

## 展示风险与处理方式

- 风险：文档中出现无法由当前代码支撑的过度承诺词。
- 处理：统一改为“基础安全加固”“核心业务测试”“基础 CI 校验”“容器化部署支持”“工程化实践”等可由代码或配置支撑的说法。
- 风险：旧文档把旧实现描述为当前版本。
- 处理：README、技术总结和快速启动只描述当前 Spring Boot + MySQL/JPA 版本；历史内容只作为架构演进背景。
