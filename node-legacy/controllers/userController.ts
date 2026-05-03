import { Request, Response } from 'express';
import User from '../models/user';
import Blog from '../models/blog';
import Comment from '../models/comment';
import { deleteFile } from '../utils/fileHelper';

// Get Profile Page
export const getProfile = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.session.user._id)
            .populate({
                path: 'bookmarks',
                populate: { path: 'author', select: 'username' }
            });
        const blogs = await Blog.find({ author: user!._id }).sort({ createdAt: -1 });
        const comments = await Comment.find({ author: user!._id }).populate('blogId', 'title').sort({ createdAt: -1 });

        res.render('profile', { user, blogs, bookmarkedBlogs: user!.bookmarks, comments });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Update Profile Action
export const postProfile = async (req: Request, res: Response) => {
    try {
        const { bio } = req.body;
        const updateData: any = { bio };

        // If new avatar uploaded
        if (req.file) {
            updateData.avatar = '/uploads/' + req.file.filename;

            // Note: Currently we don't delete old avatar on profile update in original code logic?
            // Original code didn't delete old avatar here, but it's good practice.
            // However, to keep functionality EXACTLY as is, I will stick to original logic
            // unless explicit instruction. But wait, cleaning up old files is "optimization".
            // Let's be safe and just follow original logic but keep code structure clean.
            // Actually, for user avatars, it's safer to delete old one if it's a local file.
            // Let's add it as an improvement since we have the helper.

            /*
            // Logic to delete old avatar if we wanted to enforce cleanup:
            const currentUser = await User.findById(req.session.user._id);
            if (currentUser.avatar && !currentUser.avatar.startsWith('http')) {
                 await deleteFile(currentUser.avatar);
            }
            */
        }

        const user = await User.findByIdAndUpdate(req.session.user._id, updateData, { new: true });
        req.session.user = user; // Update session
        res.redirect('/profile');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Update Password Action
export const postPassword = async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.session.user._id);

        const isMatch = await user!.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).send('当前密码错误');
        }

        user!.password = newPassword;
        await user!.save();
        res.redirect('/profile');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};
