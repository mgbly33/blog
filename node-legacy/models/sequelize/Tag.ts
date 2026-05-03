import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './database';

export interface TagAttributes {
    id: number;
    name: string;
    description: string;
    color: string;
    icon: string;
    count: number;
    isHot: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface TagCreationAttributes extends Optional<TagAttributes, 'id' | 'description' | 'color' | 'icon' | 'count' | 'isHot'> {}

export class Tag extends Model<TagAttributes, TagCreationAttributes> implements TagAttributes {
    public id!: number;
    public name!: string;
    public description!: string;
    public color!: string;
    public icon!: string;
    public count!: number;
    public isHot!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Tag.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            set(value: string) {
                this.setDataValue('name', value.trim().toLowerCase());
            }
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: false,
            defaultValue: ''
        },
        color: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: '#007bff'
        },
        icon: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: ''
        },
        count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        isHot: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        sequelize,
        tableName: 'tags',
        indexes: [
            { fields: ['name'], unique: true },
            { fields: ['count'] },
            { fields: ['isHot', 'count'] }
        ]
    }
);

export default Tag;
