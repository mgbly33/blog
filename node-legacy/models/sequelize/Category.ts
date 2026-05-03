import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './database';

export interface CategoryAttributes {
    id: number;
    name: string;
    order: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'order'> {}

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
    public id!: number;
    public name!: string;
    public order!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Category.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    },
    {
        sequelize,
        tableName: 'categories',
        indexes: [
            { fields: ['name'], unique: true },
            { fields: ['order'] }
        ]
    }
);

export default Category;
