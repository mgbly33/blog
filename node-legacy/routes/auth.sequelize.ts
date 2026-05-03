import express from 'express';
import * as authController from '../controllers/authController.sequelize';

const router = express.Router();

// --- Auth Routes ---

// Register Page
router.get('/register', authController.getRegister);

// Register Action
router.post('/register', authController.postRegister);

// Login Page
router.get('/login', authController.getLogin);

// Login Action
router.post('/login', authController.postLogin);

// Logout
router.post('/logout', authController.logout);

export default router;
