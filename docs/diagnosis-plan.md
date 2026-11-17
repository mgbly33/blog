# 诊断计划

当前求职展示优先级：

1. 统一技术栈口径为 Spring Boot / Spring Security / JPA / MySQL / Redis / React / TypeScript / Docker / GitHub Actions。
2. 保证 README、技术总结、快速启动和面试复盘能对应到真实代码或配置。
3. 删除夸大表达，统一使用“基础安全加固”“核心业务测试”“基础 CI 校验”“容器化部署支持”等稳妥说法。
4. 避免把旧实现描述成当前运行版本。

## 核查清单

- `backend/src/main/resources/application*.yml` 是否说明 MySQL、JPA、Redis。
- `docker/docker-compose*.yml` 是否编排 MySQL、Redis、backend、frontend。
- `.github/workflows/backend.yml` 与 `.github/workflows/frontend.yml` 是否支撑基础 CI 说法。
- `backend/src/test/java/` 是否支撑测试模块说明。
- `backend/src/main/java/com/blog/security/` 与 `AuthService` 是否支撑 JWT、刷新和黑名单说明。
- `HtmlSanitizer` 和服务层权限校验是否支撑安全治理说明。
