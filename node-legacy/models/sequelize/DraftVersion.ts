import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './database';

export interface DraftVersionAttributes {
    id: number;
    draftId: number;
    title: string;
    content: string;
    versionNumber: number;
    wordCount: number;
    changeType: 'auto' | 'manual' | 'restore';
    snapshot: string; // JSON string
    createdAt?: Date;
    updatedAt?: Date;
}

export interface DraftVersionCreationAttributes extends Optional<DraftVersionAttributes,
    'id' | 'wordCount' | 'changeType'> {}

export interface SnapshotData {
    categoryId?: number | null;
    tags: string[];
    visibility: string;
}

export class DraftVersion extends Model<DraftVersionAttributes, DraftVersionCreationAttributes> implements DraftVersionAttributes {
    public id!: number;
    public draftId!: number;
    public title!: string;
    public content!: string;
    public versionNumber!: number;
    public wordCount!: number;
    public changeType!: 'auto' | 'manual' | 'restore';
    public snapshot!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Virtual getter for snapshot object
    public get snapshotData(): SnapshotData {
        try {
            return JSON.parse(this.snapshot || '{}');
        } catch {
            return { tags: [], visibility: 'public' };
        }
    }

    // Virtual setter for snapshot object
    public set snapshotData(value: SnapshotData) {
        this.snapshot = JSON.stringify(value);
    }

    // Static method to create a new version
    public static async createVersion(
        draftId: number,
        title: string,
        content: string,
        snapshot: SnapshotData,
        changeType: 'auto' | 'manual' | 'restore' = 'auto'
    ): Promise<DraftVersion> {
        // Get the latest version number
        const latestVersion = await DraftVersion.findOne({
            where: { draftId },
            order: [['versionNumber', 'DESC']],
            attributes: ['versionNumber']
        });

        const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
        const wordCount = content.replace(/\s+/g, '').length;

        const version = await DraftVersion.create({
            draftId,
            title,
            content,
            versionNumber: newVersionNumber,
            wordCount,
            changeType,
            snapshot: JSON.stringify(snapshot)
        });

        // Limit to 50 versions per draft
        const maxVersions = 50;
        const versionsCount = await DraftVersion.count({ where: { draftId } });

        if (versionsCount > maxVersions) {
            const oldestVersions = await DraftVersion.findAll({
                where: { draftId },
                order: [['versionNumber', 'ASC']],
                limit: versionsCount - maxVersions,
                attributes: ['id']
            });

            const idsToDelete = oldestVersions.map(v => v.id);
            await DraftVersion.destroy({ where: { id: idsToDelete } });
        }

        return version;
    }
}

DraftVersion.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        draftId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'drafts',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        title: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT('long'),
            allowNull: false
        },
        versionNumber: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        wordCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        changeType: {
            type: DataTypes.ENUM('auto', 'manual', 'restore'),
            allowNull: false,
            defaultValue: 'auto'
        },
        snapshot: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '{}',
            comment: 'JSON object with category, tags, visibility'
        }
    },
    {
        sequelize,
        tableName: 'draft_versions',
        indexes: [
            { fields: ['draftId', 'versionNumber'] },
            { fields: ['createdAt'] }
        ]
    }
);

export default DraftVersion;
