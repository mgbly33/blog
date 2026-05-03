import { DataTypes, Model, Optional } from 'sequelize';
import sanitizeHtml from 'sanitize-html';
import sequelize from './database';
import filterSensitiveWords from '../../utils/filter';

export interface CommentAttributes {
    id: number;
    blogId: number;
    content: string;
    authorId: number;
    parentCommentId: number | null;
    replyCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'parentCommentId' | 'replyCount'> {}

export class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
    public id!: number;
    public blogId!: number;
    public content!: string;
    public authorId!: number;
    public parentCommentId!: number | null;
    public replyCount!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Comment.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        blogId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'blogs',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
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
        parentCommentId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'comments',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        replyCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    },
    {
        sequelize,
        tableName: 'comments',
        indexes: [
            { fields: ['blogId', 'createdAt'] },
            { fields: ['authorId'] },
            { fields: ['parentCommentId'] }
        ],
        hooks: {
            beforeCreate: async (comment: Comment) => {
                if (comment.content) {
                    let cleanContent = filterSensitiveWords(comment.content);
                    comment.content = sanitizeHtml(cleanContent, {
                        allowedTags: [],
                        allowedAttributes: {}
                    });
                }
            },
            beforeUpdate: async (comment: Comment) => {
                if (comment.changed('content')) {
                    let cleanContent = filterSensitiveWords(comment.content);
                    comment.content = sanitizeHtml(cleanContent, {
                        allowedTags: [],
                        allowedAttributes: {}
                    });
                }
            }
        }
    }
);

export default Comment;
