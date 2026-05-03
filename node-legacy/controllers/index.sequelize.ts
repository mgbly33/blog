// Sequelize Controllers Index
// 统一导出所有 Sequelize 版本的 controllers
// 在路由文件中只需将 import 路径从 '../controllers/xxxController'
// 改为 '../controllers/index.sequelize' 即可完成切换

export * as authController from './authController.sequelize';
export * as adminController from './adminController.sequelize';
export * as blogController from './blogController.sequelize';
export * as userController from './userController.sequelize';
export * as followController from './followController.sequelize';
export * as notificationController from './notificationController.sequelize';
export * as searchController from './searchController.sequelize';
export * as tagController from './tagController.sequelize';
export * as draftController from './draftController.sequelize';
