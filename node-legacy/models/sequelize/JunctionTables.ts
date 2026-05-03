import { DataTypes, Model } from 'sequelize';
import sequelize from './database';

// Blog-Tags junction table (many-to-many)
export class BlogTag extends Model {
    public blogId!: number;
    public tagId!: number;
}

BlogTag.init(
    {
        blogId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'blogs',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        tagId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'tags',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    },
    {
        sequelize,
        tableName: 'blog_tags',
        timestamps: false
    }
);

// User-Bookmarks junction table (User bookmarks Blog)
export class UserBookmark extends Model {
    public userId!: number;
    public blogId!: number;
}

UserBookmark.init(
    {
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        blogId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'blogs',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    },
    {
        sequelize,
        tableName: 'user_bookmarks',
        timestamps: true
    }
);

// User-Follows junction table (User follows User)
export class UserFollow extends Model {
    public followerId!: number;
    public followingId!: number;
}

UserFollow.init(
    {
        followerId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        followingId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    },
    {
        sequelize,
        tableName: 'user_follows',
        timestamps: true
    }
);

// Blog-Likes junction table (User likes Blog)
export class BlogLike extends Model {
    public userId!: number;
    public blogId!: number;
}

BlogLike.init(
    {
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        blogId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'blogs',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    },
    {
        sequelize,
        tableName: 'blog_likes',
        timestamps: true
    }
);

// Comment-Likes junction table (User likes Comment)
export class CommentLike extends Model {
    public userId!: number;
    public commentId!: number;
}

CommentLike.init(
    {
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        commentId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'comments',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    },
    {
        sequelize,
        tableName: 'comment_likes',
        timestamps: true
    }
);

// Comment-Mentions junction table (Comment mentions User)
export class CommentMention extends Model {
    public commentId!: number;
    public userId!: number;
}

CommentMention.init(
    {
        commentId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'comments',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    },
    {
        sequelize,
        tableName: 'comment_mentions',
        timestamps: false
    }
);

export default {
    BlogTag,
    UserBookmark,
    UserFollow,
    BlogLike,
    CommentLike,
    CommentMention
};
