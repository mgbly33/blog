import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from './database';

export interface UserAttributes {
    id: number;
    username: string;
    password: string;
    avatar: string;
    bio: string;
    isAdmin: boolean;
    isBanned: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'avatar' | 'bio' | 'isAdmin' | 'isBanned'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public username!: string;
    public password!: string;
    public avatar!: string;
    public bio!: string;
    public isAdmin!: boolean;
    public isBanned!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Instance method to compare password
    public async comparePassword(candidatePassword: string): Promise<boolean> {
        if (!this.password) return false;
        return await bcrypt.compare(candidatePassword, this.password);
    }
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        username: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        avatar: {
            type: DataTypes.STRING(500),
            allowNull: false,
            defaultValue: ''
        },
        bio: {
            type: DataTypes.STRING(500),
            allowNull: false,
            defaultValue: '这位用户很懒，什么都没写。'
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        isBanned: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        sequelize,
        tableName: 'users',
        indexes: [
            { fields: ['username'], unique: true },
            { fields: ['isAdmin'] },
            { fields: ['isBanned'] }
        ],
        hooks: {
            beforeCreate: async (user: User) => {
                // Generate default avatar if not provided
                if (!user.avatar) {
                    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
                    user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=${randomColor}&color=fff&size=128`;
                }
                // Hash password
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user: User) => {
                // Hash password if changed
                if (user.changed('password') && user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        }
    }
);

export default User;
