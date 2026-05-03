import { DataTypes, Model, Optional } from 'sequelize';
import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';
import sequelize from './database';
import filterSensitiveWords from '../../utils/filter';

export interface BlogAttributes {
    id: number;
    title: string;
    content: string;
    rawContent: string;
    image: string | null;
    categoryId: number | null;
    visibility: 'public' | 'private';
    status: 'pending' | 'approved' | 'rejected';
    summary: string;
    readTime: number;
    collectCount: number;
    commentCount: number;
    likesCount: number;
    authorId: number;
    views: number;
    isSticky: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface BlogCreationAttributes extends Optional<BlogAttributes,
    'id' | 'image' | 'categoryId' | 'visibility' | 'status' | 'summary' |
    'readTime' | 'collectCount' | 'commentCount' | 'likesCount' | 'views' | 'isSticky' | 'rawContent'> {}

export class Blog extends Model<BlogAttributes, BlogCreationAttributes> implements BlogAttributes {
    public id!: number;
    public title!: string;
    public content!: string;
    public rawContent!: string;
    public image!: string | null;
    public categoryId!: number | null;
    public visibility!: 'public' | 'private';
    public status!: 'pending' | 'approved' | 'rejected';
    public summary!: string;
    public readTime!: number;
    public collectCount!: number;
    public commentCount!: number;
    public likesCount!: number;
    public authorId!: number;
    public views!: number;
    public isSticky!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Instance methods
    public calculateReadTime(): number {
        const wordsPerMinute = 200;
        const wordCount = this.content.split(/\s+/).length;
        this.readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
        return this.readTime;
    }

    public generateSummary(): string {
        if (!this.summary && this.rawContent) {
            const plainText = this.rawContent.replace(/[#*`>\[\]()]/g, '').trim();
            this.summary = plainText.substring(0, 200);
        }
        return this.summary;
    }
}

Blog.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT('long'),
            allowNull: false
        },
        rawContent: {
            type: DataTypes.TEXT('long'),
            allowNull: true
        },
        image: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        categoryId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'categories',
                key: 'id'
            },
            onDelete: 'SET NULL'
        },
        visibility: {
            type: DataTypes.ENUM('public', 'private'),
            allowNull: false,
            defaultValue: 'public'
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending'
        },
        summary: {
            type: DataTypes.STRING(500),
            allowNull: false,
            defaultValue: ''
        },
        readTime: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        collectCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        commentCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        likesCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        authorId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        views: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        isSticky: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        sequelize,
        tableName: 'blogs',
        indexes: [
            { type: 'FULLTEXT', fields: ['title', 'content', 'summary'] },
            { fields: ['status', 'visibility', 'createdAt'] },
            { fields: ['authorId', 'status'] },
            { fields: ['views'] },
            { fields: ['isSticky', 'createdAt'] },
            { fields: ['categoryId', 'status'] },
            { fields: ['createdAt'] },
            { fields: ['likesCount'] }
        ],
        hooks: {
            beforeCreate: async (blog: Blog) => {
                // Filter sensitive words in title
                if (blog.title) {
                    blog.title = filterSensitiveWords(blog.title);
                    blog.title = sanitizeHtml(blog.title, {
                        allowedTags: [],
                        allowedAttributes: {}
                    });
                }

                // Process content
                if (blog.content) {
                    let sourceContent = blog.rawContent || blog.content;
                    if (!blog.rawContent) {
                        blog.rawContent = sourceContent;
                    }

                    let cleanContent = filterSensitiveWords(sourceContent);
                    let htmlContent = marked(cleanContent) as string;

                    blog.content = sanitizeHtml(htmlContent, {
                        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'span', 'div', 'pre', 'code']),
                        allowedAttributes: {
                            ...sanitizeHtml.defaults.allowedAttributes,
                            'img': ['src', 'alt', 'width', 'height'],
                            'span': ['class'],
                            'div': ['class'],
                            'p': ['class'],
                            'code': ['class'],
                            'pre': ['class']
                        }
                    });

                    blog.generateSummary();
                    blog.calculateReadTime();
                }
            },
            beforeUpdate: async (blog: Blog) => {
                if (blog.changed('title')) {
                    blog.title = filterSensitiveWords(blog.title);
                    blog.title = sanitizeHtml(blog.title, {
                        allowedTags: [],
                        allowedAttributes: {}
                    });
                }

                if (blog.changed('content') || blog.changed('rawContent')) {
                    let sourceContent = blog.rawContent || blog.content;
                    if (!blog.rawContent) {
                        blog.rawContent = sourceContent;
                    }

                    let cleanContent = filterSensitiveWords(sourceContent);
                    let htmlContent = marked(cleanContent) as string;

                    blog.content = sanitizeHtml(htmlContent, {
                        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'span', 'div', 'pre', 'code']),
                        allowedAttributes: {
                            ...sanitizeHtml.defaults.allowedAttributes,
                            'img': ['src', 'alt', 'width', 'height'],
                            'span': ['class'],
                            'div': ['class'],
                            'p': ['class'],
                            'code': ['class'],
                            'pre': ['class']
                        }
                    });

                    blog.generateSummary();
                    blog.calculateReadTime();
                }
            }
        }
    }
);

export default Blog;
