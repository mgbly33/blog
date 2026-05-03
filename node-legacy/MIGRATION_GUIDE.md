# MongoDB to MySQL Migration Guide

This document provides a comprehensive guide for migrating the blog project from MongoDB (Mongoose) to MySQL (Sequelize).

## Migration Status

### ✅ Completed
- [x] Installed Sequelize and MySQL2 dependencies
- [x] Created database configuration (`models/sequelize/database.ts`)
- [x] Created all 9 Sequelize models
- [x] Created junction tables for many-to-many relationships
- [x] Defined all model associations
- [x] Updated `.env.example` with MySQL configuration
- [x] Created all 9 Sequelize controllers
  - `authController.sequelize.ts`
  - `adminController.sequelize.ts`
  - `blogController.sequelize.ts`
  - `userController.sequelize.ts`
  - `followController.sequelize.ts`
  - `notificationController.sequelize.ts`
  - `searchController.sequelize.ts`
  - `tagController.sequelize.ts`
  - `draftController.sequelize.ts`
- [x] Created all Sequelize routes
  - `routes/auth.sequelize.ts`
  - `routes/admin.sequelize.ts`
  - `routes/blog.sequelize.ts`
  - `routes/profile.sequelize.ts`
  - `routes/follow.sequelize.ts`
  - `routes/notification.sequelize.ts`
  - `routes/search.sequelize.ts`
  - `routes/tag.sequelize.ts`
  - `routes/draft.sequelize.ts`
- [x] Created `app.sequelize.ts` entry point
- [x] Added npm scripts for MySQL version

### 🔄 Pending
- [ ] Create and configure MySQL database
- [ ] Test all functionality
- [ ] Data migration (if needed)
- [ ] Remove Mongoose dependency (optional)

---

## Quick Start

### 1. Create MySQL Database

```sql
CREATE DATABASE blog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update MySQL credentials:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=blog_db
MYSQL_USER=root
MYSQL_PASSWORD=your_password
```

### 3. Run with MySQL

```bash
# Development
npm run dev:mysql

# Production
npm run build
npm run start:mysql
```

### 4. Create FULLTEXT Index (Optional, for search)

```sql
ALTER TABLE blogs ADD FULLTEXT INDEX ft_blog_search (title, content, summary);
```

---

## Query Pattern Migration Reference

### Basic CRUD Operations

| Mongoose | Sequelize |
|----------|-----------|
| `Model.find(filter)` | `Model.findAll({ where: filter })` |
| `Model.findOne(filter)` | `Model.findOne({ where: filter })` |
| `Model.findById(id)` | `Model.findByPk(id)` |
| `Model.countDocuments(filter)` | `Model.count({ where: filter })` |
| `Model.create(data)` | `Model.create(data)` |
| `new Model(data); await model.save()` | `Model.create(data)` |
| `Model.findByIdAndUpdate(id, data)` | `Model.update(data, { where: { id } })` |
| `Model.findByIdAndDelete(id)` | `Model.destroy({ where: { id } })` |
| `Model.deleteMany(filter)` | `Model.destroy({ where: filter })` |
| `Model.updateMany(filter, data)` | `Model.update(data, { where: filter })` |

### Population (Joins)

```typescript
// Mongoose
const blog = await Blog.findById(id)
    .populate('author', 'username avatar')
    .populate('category')
    .populate('tags');

// Sequelize
const blog = await Blog.findByPk(id, {
    include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] },
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags' }
    ]
});
```

### Sorting

```typescript
// Mongoose
const blogs = await Blog.find().sort({ createdAt: -1, views: -1 });

// Sequelize
const blogs = await Blog.findAll({
    order: [
        ['createdAt', 'DESC'],
        ['views', 'DESC']
    ]
});
```

### Pagination

```typescript
// Mongoose
const blogs = await Blog.find().skip(skip).limit(limit);

// Sequelize
const blogs = await Blog.findAll({
    offset: skip,
    limit: limit
});
```

### Complex Filters

```typescript
// Mongoose - $or
const filter = {
    $or: [
        { visibility: 'public' },
        { author: userId }
    ]
};

// Sequelize - Op.or
import { Op } from 'sequelize';
const filter = {
    [Op.or]: [
        { visibility: 'public' },
        { authorId: userId }
    ]
};
```

### Field Selection

```typescript
// Mongoose
const blogs = await Blog.find().select('title views _id');

// Sequelize
const blogs = await Blog.findAll({
    attributes: ['id', 'title', 'views']
});
```

### Lean Queries

```typescript
// Mongoose - lean() returns plain objects
const blogs = await Blog.find().lean();

// Sequelize - raw: true or get({ plain: true })
const blogs = await Blog.findAll({ raw: true });
// Or for single result:
const blog = (await Blog.findByPk(id))?.get({ plain: true });
```

### Text Search

```typescript
// Mongoose - $text index
const blogs = await Blog.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
).sort({ score: { $meta: 'textScore' } });

// Sequelize - FULLTEXT with MySQL
import { Op, literal } from 'sequelize';
const blogs = await Blog.findAll({
    where: literal(`MATCH(title, content, summary) AGAINST('${query}' IN NATURAL LANGUAGE MODE)`),
    order: literal(`MATCH(title, content, summary) AGAINST('${query}' IN NATURAL LANGUAGE MODE) DESC`)
});
```

### Incrementing Fields

```typescript
// Mongoose
await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } });

// Sequelize
await Blog.increment('views', { where: { id } });
// Or multiple fields:
await Blog.increment({ views: 1, likesCount: 1 }, { where: { id } });
```

### Array Operations (Many-to-Many)

```typescript
// Mongoose - push to array
blog.likes.push(userId);
await blog.save();

// Sequelize - use junction table
await BlogLike.create({ blogId: blog.id, userId });
// Or with association methods:
await blog.addLikes(userId);
```

### Checking Array Membership

```typescript
// Mongoose
const hasLiked = blog.likes.some(like => like.toString() === userId.toString());

// Sequelize
const hasLiked = await BlogLike.findOne({
    where: { blogId: blog.id, userId }
}) !== null;
```

---

## Controller Migration Examples

### authController.ts

```typescript
// Before (Mongoose)
const user = await User.findOne({ username });
const user = new User({ username, password });
await user.save();
const adminCount = await User.countDocuments({ isAdmin: true });

// After (Sequelize)
const user = await User.findOne({ where: { username } });
const user = await User.create({ username, password });
const adminCount = await User.count({ where: { isAdmin: true } });
```

### blogController.ts

```typescript
// Before (Mongoose)
const blogs = await Blog.find(filter)
    .populate('author', 'username avatar')
    .sort({ isSticky: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

// After (Sequelize)
const blogs = await Blog.findAll({
    where: filter,
    include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'avatar'] }
    ],
    order: [
        ['isSticky', 'DESC'],
        ['createdAt', 'DESC']
    ],
    offset: skip,
    limit,
    raw: true,
    nest: true
});
```

---

## Environment Setup

1. Create a MySQL database:
```sql
CREATE DATABASE blog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Update your `.env` file with MySQL credentials.

3. Update `app.ts`:
```typescript
// Replace
import connectDB from './config';
// With
import { connectDB } from './models/sequelize';
```

4. Run the application - Sequelize will sync tables automatically in development mode.

---

## Notes

- All MongoDB ObjectId references are now integer IDs
- The `_id` field is now just `id`
- Session storage may need updating if you stored ObjectIds
- bcrypt password hashing is handled in User model hooks
- FULLTEXT indexes require MySQL 5.6+ or MariaDB 10.0.5+
