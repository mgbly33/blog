import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DATABASE || 'blog_db',
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    pool: {
        max: parseInt(process.env.MYSQL_POOL_SIZE || '10'),
        min: 2,
        acquire: 30000,
        idle: 10000
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true
    }
});

export const connectDB = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        console.log('MySQL connected successfully (pool size:', process.env.MYSQL_POOL_SIZE || '10', ')');

        // Sync models in development (use migrations in production)
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('Database synchronized');
        }
    } catch (err) {
        console.error('MySQL connection error:', err);
        process.exit(1);
    }
};

export default sequelize;
