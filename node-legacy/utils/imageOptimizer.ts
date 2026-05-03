import { Jimp } from 'jimp';
import path from 'path';

interface ImageOptimizeOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}

interface ImageDimensions {
    width: number;
    height: number;
}

/**
 * 优化上传的图片
 * @param filePath - 原始文件路径
 * @param options - 优化选项
 * @returns - 优化后的文件路径
 */
export async function optimizeImage(filePath: string, options: ImageOptimizeOptions = {}): Promise<string> {
    const {
        maxWidth = 1200,  // 最大宽度
        maxHeight = 1200, // 最大高度
        quality = 80      // 图片质量 (1-100)
    } = options;

    try {
        // 读取图片
        const image = await Jimp.read(filePath);

        // 获取原始尺寸
        const originalWidth = image.width;
        const originalHeight = image.height;

        // 如果图片尺寸超过最大限制，进行缩放
        if (originalWidth > maxWidth || originalHeight > maxHeight) {
            image.scaleToFit({ w: maxWidth, h: maxHeight });
        }

        // 保存图片（Jimp v1.x 在写入时设置质量）
        await image.write(filePath as `${string}.${string}`);

        return filePath;
    } catch (error) {
        console.error('图片优化失败:', error);
        // 如果优化失败，返回原文件路径
        return filePath;
    }
}

/**
 * 生成缩略图
 * @param filePath - 原始文件路径
 * @param size - 缩略图大小
 * @returns - 缩略图文件路径
 */
export async function generateThumbnail(filePath: string, size: number = 300): Promise<string> {
    try {
        const parsedPath = path.parse(filePath);
        const thumbnailPath = path.join(
            parsedPath.dir,
            `${parsedPath.name}_thumb${parsedPath.ext}`
        );

        const image = await Jimp.read(filePath);
        await image
            .cover({ w: size, h: size }) // 裁剪为正方形
            .write(thumbnailPath as `${string}.${string}`);

        return thumbnailPath;
    } catch (error) {
        console.error('缩略图生成失败:', error);
        return filePath;
    }
}

/**
 * 检查图片尺寸
 * @param filePath - 文件路径
 * @returns
 */
export async function getImageDimensions(filePath: string): Promise<ImageDimensions> {
    try {
        const image = await Jimp.read(filePath);
        return {
            width: image.width,
            height: image.height
        };
    } catch (error) {
        console.error('获取图片尺寸失败:', error);
        return { width: 0, height: 0 };
    }
}
