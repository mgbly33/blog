# Changelog

## Unreleased

- feat(ui): 全面升级为国际数字出版级（Editorial Magazine）视觉与交互体系，新增三段式天际线顶栏、12栏非对称 Bento 首页、生成式几何 SVG 封面画板、四色护眼纸张底色切换与流光氛围光境控制器。
- feat(reader): 重构文章详情页为三栏黄金比例阅读工坊，集成莫兰迪作者档案卡、Web Speech API 中文语音听文章、核心导读框、实时滚动大纲、推荐阅读榜单与三处上下文「返回上一页」导航。
- fix(backend): 修复 SecurityConfig 公开路由匹配顺序、Series 公开专栏私密文章过滤、MySQL 8.4 `ONLY_FULL_GROUP_BY` 私信查询报错、中文标点 HTML 实体解码、敏感词最高级别空指针及浏览历史孤儿记录异常。
- docs: 统一 MySQL/JPA 技术栈描述。
- docs: 重写技术总结，改为面试复盘口径。
- docs: 增加面试复盘文档。
- docs: 优化 README 求职展示内容。
- docs: 更新快速启动、全量说明和旧诊断/优化文档，避免旧技术栈误导。
- chore: 调整本地启动脚本为 Docker Compose + MySQL/Redis 流程。
- ci: 将根目录 CI 调整为项目文档存在性检查，后端/前端 CI 继续由独立 workflow 承担。
- ci: 将后端/前端 workflow 名称调整为 CI，避免夸大部署能力。
