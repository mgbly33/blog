# 启动说明

当前仓库主版本是 `backend/` + `frontend/` 的 Spring Boot + React 前后端分离实现，数据层统一为 MySQL + JPA，Redis 用于 Token 黑名单和限流。

## 推荐启动方式

从仓库根目录启动完整开发环境：

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

或参考 [QUICK_START.md](./QUICK_START.md) 分别启动 MySQL、Redis、后端和前端。

## 当前关键配置

后端读取：

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `CORS_ORIGINS`

前端读取：

- `VITE_API_URL`

根据实际环境调整数据库密码、JWT 密钥、CORS 域名和上传目录。
