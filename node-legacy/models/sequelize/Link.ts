import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './database';

export interface LinkAttributes {
    id: number;
    name: string;
    url: string;
    description: string;
    order: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface LinkCreationAttributes extends Optional<LinkAttributes, 'id' | 'description' | 'order'> {}

export class Link extends Model<LinkAttributes, LinkCreationAttributes> implements LinkAttributes {
    public id!: number;
    public name!: string;
    public url!: string;
    public description!: string;
    public order!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Link.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        url: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: false,
            defaultValue: ''
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    },
    {
        sequelize,
        tableName: 'links',
        indexes: [
            { fields: ['order'] }
        ]
    }
);

export default Link;
