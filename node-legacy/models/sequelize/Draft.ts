import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './database';

export interface DraftAttributes {
    id: number;
    title: string;
    content: string;
    categoryId: number | null;
    tags: string; // JSON string of tag names
    visibility: 'public' | 'private';
    image: string | null;
    authorId: number;
    blogId: number | null;
    lastSavedAt: Date;
    currentVersion: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface DraftCreationAttributes extends Optional<DraftAttributes,
    'id' | 'title' | 'content' | 'categoryId' | 'tags' | 'visibility' | 'image' | 'blogId' | 'lastSavedAt' | 'currentVersion'> {}

export class Draft extends Model<DraftAttributes, DraftCreationAttributes> implements DraftAttributes {
    public id!: number;
    public title!: string;
    public content!: string;
    public categoryId!: number | null;
    public tags!: string;
    public visibility!: 'public' | 'private';
    public image!: string | null;
    public authorId!: number;
    public blogId!: number | null;
    public lastSavedAt!: Date;
    public currentVersion!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Virtual getter for tags array
    public get tagsArray(): string[] {
        try {
            return JSON.parse(this.tags || '[]');
        } catch {
            return [];
        }
    }

    // Virtual setter for tags array
    public set tagsArray(value: string[]) {
        this.tags = JSON.stringify(value);
    }

    // Virtual property to check if this is a new draft
    public get isNewDraft(): boolean {
        return !this.blogId;
    }
}

Draft.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING(500),
            allowNull: false,
            defaultValue: '无标题草稿'
        },
        content: {
            type: DataTypes.TEXT('long'),
            allowNull: false,
            defaultValue: ''
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
        tags: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '[]',
            comment: 'JSON array of tag names'
        },
        visibility: {
            type: DataTypes.ENUM('public', 'private'),
            allowNull: false,
            defaultValue: 'public'
        },
        image: {
            type: DataTypes.STRING(500),
            allowNull: true
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
        blogId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'blogs',
                key: 'id'
            },
            onDelete: 'SET NULL'
        },
        lastSavedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        currentVersion: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        }
    },
    {
        sequelize,
        tableName: 'drafts',
        indexes: [
            { fields: ['authorId', 'updatedAt'] },
            { fields: ['blogId'] },
            { fields: ['authorId', 'blogId'] }
        ],
        hooks: {
            beforeSave: async (draft: Draft) => {
                draft.lastSavedAt = new Date();
            }
        }
    }
);

export default Draft;
