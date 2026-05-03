import fs from 'fs';
import path from 'path';

/**
 * Safely deletes a file from the public directory.
 * @param filePath - The relative path to the file (e.g., '/uploads/image.jpg').
 */
export const deleteFile = async (filePath: string): Promise<void> => {
    if (!filePath || filePath.startsWith('http')) return;

    const publicDir = path.resolve(__dirname, '../public');
    const normalizedPath = filePath.replace(/^[/\\]+/, '');
    const fullPath = path.resolve(publicDir, normalizedPath);

    if (!fullPath.toLowerCase().startsWith(publicDir.toLowerCase())) {
        return;
    }

    try {
        await fs.promises.access(fullPath); // Check if file exists
        await fs.promises.unlink(fullPath);
        console.log(`File deleted: ${fullPath}`);
    } catch (err: any) {
        if (err.code !== 'ENOENT') {
            console.error(`Failed to delete file at ${fullPath}:`, err.message);
        }
        // If file doesn't exist (ENOENT), we just ignore it.
    }
};
