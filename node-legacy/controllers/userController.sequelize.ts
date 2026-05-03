import { Request, Response } from 'express';
import { User, Blog, Comment, UserBookmark } from '../models/sequelize';

// Get Profile Page
export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user.id;

        const user = await User.findByPk(userId);

        // Get user's blogs
        const blogs = await Blog.findAll({
            where: { authorId: userId },
            order: [['createdAt', 'DESC']]
        });

        // Get user's comments with blog info
        const comments = await Comment.findAll({
            where: { authorId: userId },
            include: [
                { model: Blog, as: 'blog', attributes: ['id', 'title'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Get bookmarked blogs
        const bookmarks = await UserBookmark.findAll({
            where: { userId },
            include: [
                {
                    model: Blog,
                    include: [
                        { model: User, as: 'author', attributes: ['id', 'username'] }
                    ]
                }
            ]
        });

        const bookmarkedBlogs = bookmarks.map((b: any) => b.Blog);

        res.render('profile', {
            user: user?.get({ plain: true }),
            blogs: blogs.map(b => b.get({ plain: true })),
            bookmarkedBlogs,
            comments: comments.map(c => c.get({ plain: true }))
        });
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Update Profile Action
export const postProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user.id;
        const { bio } = req.body;
        const updateData: any = { bio };

        // If new avatar uploaded
        if (req.file) {
            updateData.avatar = '/uploads/' + req.file.filename;
        }

        await User.update(updateData, { where: { id: userId } });

        // Update session with new data
        const updatedUser = await User.findByPk(userId);
        if (updatedUser) {
            req.session.user = {
                id: updatedUser.id,
                username: updatedUser.username,
                avatar: updatedUser.avatar,
                isAdmin: updatedUser.isAdmin
            };
        }

        res.redirect('/profile');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};

// Update Password Action
export const postPassword = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user.id;
        const { currentPassword, newPassword } = req.body;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send('用户不存在');
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).send('当前密码错误');
        }

        user.password = newPassword;
        await user.save();
        res.redirect('/profile');
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};
