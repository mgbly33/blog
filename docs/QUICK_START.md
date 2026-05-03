# 🚀 快速开始指南

## 立即开始使用您的 CSDN 级博客系统

### ⚡ 快速启动（3 步）

#### 1. 启动 MongoDB 数据库

```bash
# 方式 1: 使用批处理文件（推荐）
双击运行: 数据库启动.bat

# 方式 2: 手动启动
mongod --dbpath=data/db
```

#### 2. 启动博客系统

```bash
# 开发模式（热重载，推荐）
npm run dev

# 或编译后运行
npm run build && npm start
```

#### 3. 访问网站

打开浏览器访问：**http://localhost:3000**

---

## ✅ 核心功能测试清单

### 第一次使用

1. **注册管理员账号**
   - 访问 http://localhost:3000/register
   - 第一个注册的用户自动成为管理员

2. **创建第一篇文章**
   - 登录后点击"写文章"
   - 测试 Markdown 编辑器功能
   - 添加标签（用逗号分隔）
   - 选择分类
   - 发布文章

3. **测试搜索功能**
   - 在导航栏搜索框输入关键词
   - 查看搜索结果页面

4. **查看通知**
   - 访问 http://localhost:3000/notifications
   - 测试通知标记已读功能

---

## 🎨 新功能使用说明

### 📝 Markdown 编辑器

**支持的语法：**

```markdown
# 一级标题
## 二级标题
### 三级标题

**粗体文字**
*斜体文字*
~~删除线~~

- 无序列表 1
- 无序列表 2

1. 有序列表 1
2. 有序列表 2

[链接文字](https://example.com)

![图片描述](图片URL)

> 引用文字

\```javascript
// 代码块（支持语法高亮）
const hello = "world";
console.log(hello);
\```
```

**工具栏功能：**
- 粗体、斜体、标题
- 引用、列表
- 链接、图片、代码
- 表格
- 实时预览、并排预览、全屏
- 自动保存（每秒）

---

### 🏷️ 标签系统

**如何使用：**

1. 在发布文章时添加标签（多个标签用逗号分隔）
   ```
   例如: JavaScript, Node.js, 后端开发
   ```

2. 系统会自动：
   - 创建新标签
   - 分配随机颜色
   - 计算使用次数
   - 标记热门标签（使用次数 ≥ 10）

3. 查看标签下的文章：
   - 点击文章上的标签
   - 或访问 `/tag/标签ID`

**API 接口：**
- `GET /api/tags` - 获取所有标签
- `GET /api/tags/hot` - 获取热门标签

---

### 🔍 搜索功能

**搜索入口：**
- 导航栏搜索框
- 直接访问 `/search?q=关键词`

**搜索范围：**
- 文章标题
- 文章内容
- 文章摘要

**排序方式：**
- 相关度（默认）
- 最新发布
- 最多浏览
- 最多点赞

---

### 💡 推荐系统

**工作原理：**
1. 基于用户收藏的文章标签
2. 推荐相似标签的文章
3. 补充热门文章

**API 接口：**
```javascript
// 获取推荐文章
fetch('/api/recommended?limit=10')
    .then(res => res.json())
    .then(data => {
        console.log(data.blogs);
    });

// 获取热门文章
fetch('/api/hot?period=week&limit=10')
    .then(res => res.json())
    .then(data => {
        console.log(data.blogs);
    });
```

---

### 🔔 通知系统

**通知类型：**
- 👍 点赞通知
- 💬 评论通知
- 👥 关注通知
- @ @提醒通知
- 📢 系统通知

**功能：**
- 实时未读数量显示
- 标记单个/全部已读
- 删除通知
- 通知详情查看

**在导航栏添加通知铃铛：**

编辑 `views/partials/header.ejs`，添加：

```html
<% if (user) { %>
    <a href="/notifications" class="position-relative me-3">
        <i class="fa-solid fa-bell fs-5"></i>
        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              id="unread-count" style="display: none;">
            0
        </span>
    </a>

    <script>
        function updateUnreadCount() {
            fetch('/api/notifications/unread-count')
                .then(res => res.json())
                .then(data => {
                    const badge = document.getElementById('unread-count');
                    if (data.count > 0) {
                        badge.textContent = data.count;
                        badge.style.display = 'inline';
                    } else {
                        badge.style.display = 'none';
                    }
                });
        }
        updateUnreadCount();
        setInterval(updateUnreadCount, 30000); // 每30秒更新
    </script>
<% } %>
```

---

## 🔧 管理功能

### 管理员后台

访问 `/admin` 可以：
- 管理文章（审核、删除）
- 管理用户（禁用）
- 管理分类
- 管理评论
- 查看统计数据

---

## 💾 数据库管理

### 创建文本索引（首次使用）

如果搜索功能不工作，手动创建索引：

```bash
# 进入 MongoDB Shell
mongo

# 选择数据库
use blog_db

# 创建文本索引
db.blogs.createIndex({ title: "text", content: "text", summary: "text" })

# 退出
exit
```

### 备份数据库

```bash
# 导出数据
mongodump --db blog_db --out ./backup

# 导入数据
mongorestore --db blog_db ./backup/blog_db
```

---

## 📱 前端集成示例

### 在首页显示热门标签

```javascript
// 在 views/index.ejs 中添加
<div class="hot-tags mb-4">
    <h5>热门标签</h5>
    <div id="tags-container"></div>
</div>

<script>
    $.get('/api/tags/hot', function(data) {
        const container = $('#tags-container');
        data.tags.forEach(tag => {
            const size = Math.min(20 + tag.count, 32); // 根据使用次数调整大小
            container.append(`
                <a href="/tag/${tag._id}" class="badge me-2 mb-2"
                   style="background-color: ${tag.color}; font-size: ${size}px; text-decoration: none;">
                    # ${tag.name} (${tag.count})
                </a>
            `);
        });
    });
</script>
```

### 在侧边栏显示推荐文章

```javascript
// 在文章详情页或首页侧边栏
<div class="recommended-blogs">
    <h5>推荐阅读</h5>
    <div id="recommended-container"></div>
</div>

<script>
    $.get('/api/recommended?limit=5', function(data) {
        const container = $('#recommended-container');
        data.blogs.forEach(blog => {
            container.append(`
                <div class="mb-2">
                    <a href="/blog/${blog._id}" class="text-decoration-none">
                        <small>${blog.title}</small>
                    </a>
                    <div class="text-muted small">
                        <i class="fa-solid fa-eye"></i> ${blog.views}
                    </div>
                </div>
            `);
        });
    });
</script>
```

---

## 🐛 常见问题

### Q1: 搜索功能不工作
**解决：** 手动创建文本索引（见上方"数据库管理"部分）

### Q2: Markdown 编辑器不显示
**检查：**
1. 浏览器控制台是否有错误
2. CDN 链接是否可访问
3. jQuery 是否已加载

### Q3: 标签未正确保存
**解决：** 确保在 `controllers/blogController.ts` 中集成了标签创建逻辑。

### Q4: 通知不显示
**检查：**
1. 用户是否已登录
2. 路由是否正确配置
3. 在评论控制器中是否调用了 `createNotification`

---

## 📚 更多文档

详细文档请查看：
- **README.md** - 项目主说明文档
- **USER_MANUAL.md** - 用户操作手册
- **UI_BEAUTIFICATION_SUMMARY.md** - 界面美化总结

---

## 🎉 恭喜！

您的 CSDN 级博客系统已经准备就绪！

**下一步建议：**
1. ✅ 测试所有核心功能
2. ✅ 自定义主题和样式
3. ✅ 添加自己的内容
4. ✅ 配置生产环境部署
5. ✅ 邀请用户注册使用

享受您的强大博客平台！ 🚀
