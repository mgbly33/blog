# Legacy Module Note

`node-legacy/` 保留早期实现代码，主要用于对比架构演进和迁移思路，不是当前推荐启动入口。

早期设计曾参考 MongoDB，当前实现已统一为 MySQL + JPA。

当前求职展示请以以下目录为准：

- `backend/`：Spring Boot + Spring Security + JPA。
- `frontend/`：React + TypeScript。
- `docker/`：MySQL、Redis、backend、frontend 的 Compose/Nginx 配置。
- `docs/技术总结.md` 与 `INTERVIEW.md`：面试复盘资料。

如果面试官问到旧版本，可以说明：旧版本用于保留重构前后的对比，不作为当前运行版本，也不作为当前技术栈口径。
