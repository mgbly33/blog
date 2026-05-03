import express from 'express';
import multer from 'multer';
import path from 'path';
import { requireLogin } from '../middleware/auth';
import * as userController from '../controllers/userController.sequelize';

const router = express.Router();

// --- Multer Configuration for Profile Avatar ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads/'));
    },
    filename: function (req, file, cb) {
        cb(null, 'avatar-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for avatars
    fileFilter: function (req, file, cb) {
        // 只允许图片格式
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只支持图片文件 (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// --- Profile Routes ---

// View Profile
router.get('/profile', requireLogin, userController.getProfile);

// Update Profile
router.post('/profile', requireLogin, upload.single('avatar'), userController.postProfile);

// Update Password
router.post('/profile/password', requireLogin, userController.postPassword);

export default router;
