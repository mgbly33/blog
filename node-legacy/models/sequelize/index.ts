// Sequelize Models Index - Exports all models and defines associations
import sequelize, { connectDB } from './database';

// Import all models
import User from './User';
import Blog from './Blog';
import Comment from './Comment';
import Category from './Category';
import Tag from './Tag';
import Link from './Link';
import Notification from './Notification';
import Draft from './Draft';
import DraftVersion from './DraftVersion';

// Import junction tables
import {
    BlogTag,
    UserBookmark,
    UserFollow,
    BlogLike,
    CommentLike,
    CommentMention
} from './JunctionTables';

// =============================================
// Define Associations
// =============================================

// User -> Blog (one-to-many)
User.hasMany(Blog, { foreignKey: 'authorId', as: 'blogs' });
Blog.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Category -> Blog (one-to-many)
Category.hasMany(Blog, { foreignKey: 'categoryId', as: 'blogs' });
Blog.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Blog -> Comment (one-to-many)
Blog.hasMany(Comment, { foreignKey: 'blogId', as: 'comments' });
Comment.belongsTo(Blog, { foreignKey: 'blogId', as: 'blog' });

// User -> Comment (one-to-many)
User.hasMany(Comment, { foreignKey: 'authorId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Comment self-reference (parent-child)
Comment.hasMany(Comment, { foreignKey: 'parentCommentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentCommentId', as: 'parentComment' });

// Blog <-> Tag (many-to-many)
Blog.belongsToMany(Tag, { through: BlogTag, foreignKey: 'blogId', otherKey: 'tagId', as: 'tags' });
Tag.belongsToMany(Blog, { through: BlogTag, foreignKey: 'tagId', otherKey: 'blogId', as: 'blogs' });

// User <-> Blog Bookmarks (many-to-many)
User.belongsToMany(Blog, { through: UserBookmark, foreignKey: 'userId', otherKey: 'blogId', as: 'bookmarks' });
Blog.belongsToMany(User, { through: UserBookmark, foreignKey: 'blogId', otherKey: 'userId', as: 'bookmarkedBy' });

// User <-> User Follows (many-to-many self-reference)
User.belongsToMany(User, { through: UserFollow, foreignKey: 'followerId', otherKey: 'followingId', as: 'following' });
User.belongsToMany(User, { through: UserFollow, foreignKey: 'followingId', otherKey: 'followerId', as: 'followers' });

// User <-> Blog Likes (many-to-many)
User.belongsToMany(Blog, { through: BlogLike, foreignKey: 'userId', otherKey: 'blogId', as: 'likedBlogs' });
Blog.belongsToMany(User, { through: BlogLike, foreignKey: 'blogId', otherKey: 'userId', as: 'likes' });

// User <-> Comment Likes (many-to-many)
User.belongsToMany(Comment, { through: CommentLike, foreignKey: 'userId', otherKey: 'commentId', as: 'likedComments' });
Comment.belongsToMany(User, { through: CommentLike, foreignKey: 'commentId', otherKey: 'userId', as: 'likes' });

// Comment <-> User Mentions (many-to-many)
Comment.belongsToMany(User, { through: CommentMention, foreignKey: 'commentId', otherKey: 'userId', as: 'mentions' });
User.belongsToMany(Comment, { through: CommentMention, foreignKey: 'userId', otherKey: 'commentId', as: 'mentionedIn' });

// Notification associations
User.hasMany(Notification, { foreignKey: 'recipientId', as: 'receivedNotifications' });
User.hasMany(Notification, { foreignKey: 'senderId', as: 'sentNotifications' });
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Notification.belongsTo(Blog, { foreignKey: 'relatedBlogId', as: 'relatedBlog' });
Notification.belongsTo(Comment, { foreignKey: 'relatedCommentId', as: 'relatedComment' });

// Draft associations
User.hasMany(Draft, { foreignKey: 'authorId', as: 'drafts' });
Draft.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
Draft.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Draft.belongsTo(Blog, { foreignKey: 'blogId', as: 'blog' });

// DraftVersion associations
Draft.hasMany(DraftVersion, { foreignKey: 'draftId', as: 'versions' });
DraftVersion.belongsTo(Draft, { foreignKey: 'draftId', as: 'draft' });

// =============================================
// Export everything
// =============================================

export {
    sequelize,
    connectDB,
    User,
    Blog,
    Comment,
    Category,
    Tag,
    Link,
    Notification,
    Draft,
    DraftVersion,
    BlogTag,
    UserBookmark,
    UserFollow,
    BlogLike,
    CommentLike,
    CommentMention
};

// Default export for convenience
export default {
    sequelize,
    connectDB,
    User,
    Blog,
    Comment,
    Category,
    Tag,
    Link,
    Notification,
    Draft,
    DraftVersion,
    BlogTag,
    UserBookmark,
    UserFollow,
    BlogLike,
    CommentLike,
    CommentMention
};
