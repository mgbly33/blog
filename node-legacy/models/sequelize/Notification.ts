import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './database';

export interface NotificationAttributes {
    id: number;
    recipientId: number;
    senderId: number;
    type: 'like' | 'comment' | 'follow' | 'mention' | 'reply' | 'system';
    content: string;
    relatedBlogId: number | null;
    relatedCommentId: number | null;
    isRead: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface NotificationCreationAttributes extends Optional<NotificationAttributes,
    'id' | 'relatedBlogId' | 'relatedCommentId' | 'isRead'> {}

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
    public id!: number;
    public recipientId!: number;
    public senderId!: number;
    public type!: 'like' | 'comment' | 'follow' | 'mention' | 'reply' | 'system';
    public content!: string;
    public relatedBlogId!: number | null;
    public relatedCommentId!: number | null;
    public isRead!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Notification.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        recipientId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        senderId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        type: {
            type: DataTypes.ENUM('like', 'comment', 'follow', 'mention', 'reply', 'system'),
            allowNull: false
        },
        content: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        relatedBlogId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'blogs',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        relatedCommentId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'comments',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        sequelize,
        tableName: 'notifications',
        indexes: [
            { fields: ['recipientId'] },
            { fields: ['isRead'] },
            { fields: ['createdAt'] },
            { fields: ['recipientId', 'isRead', 'createdAt'] }
        ]
    }
);

export default Notification;
