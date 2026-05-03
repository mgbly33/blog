/**
 * MySQL Configuration
 * Replace MONGODB environment variables with these
 *
 * Add to your .env file:
 *
 * MYSQL_HOST=localhost
 * MYSQL_PORT=3306
 * MYSQL_DATABASE=blog_db
 * MYSQL_USER=root
 * MYSQL_PASSWORD=your_password
 * MYSQL_POOL_SIZE=10
 */

import { connectDB } from './models/sequelize';

export default connectDB;
