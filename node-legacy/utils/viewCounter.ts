import Blog from '../models/blog';

interface ViewCount {
    count: number;
    lastUpdated: number;
}

class ViewCounter {
    private views: Map<string, ViewCount>;
    private readonly flushThreshold: number;
    private readonly flushInterval: number;
    private timer: NodeJS.Timeout | null = null;

    constructor(flushThreshold: number = 100, flushInterval: number = 5 * 60 * 1000) {
        this.views = new Map();
        this.flushThreshold = flushThreshold;
        this.flushInterval = flushInterval;
        this.startAutoFlush();
    }

    // 记录浏览
    increment(blogId: string): void {
        const existing = this.views.get(blogId);
        if (existing) {
            existing.count++;
            existing.lastUpdated = Date.now();
        } else {
            this.views.set(blogId, {
                count: 1,
                lastUpdated: Date.now()
            });
        }

        // 如果总记录数超过阈值，立即刷新
        if (this.getTotalCount() >= this.flushThreshold) {
            this.flush();
        }
    }

    // 获取总浏览记录数
    private getTotalCount(): number {
        let total = 0;
        for (const view of this.views.values()) {
            total += view.count;
        }
        return total;
    }

    // 批量写入数据库
    async flush(): Promise<void> {
        if (this.views.size === 0) return;

        const updates: Array<{ blogId: string; count: number }> = [];
        for (const [blogId, data] of this.views.entries()) {
            updates.push({ blogId, count: data.count });
        }

        // 清空缓存
        this.views.clear();

        // 批量更新
        try {
            const bulkOps = updates.map(({ blogId, count }) => ({
                updateOne: {
                    filter: { _id: blogId },
                    update: { $inc: { views: count } }
                }
            }));

            if (bulkOps.length > 0) {
                await Blog.bulkWrite(bulkOps, { ordered: false });
                console.log(`ViewCounter: flushed ${updates.length} blog views`);
            }
        } catch (err) {
            console.error('ViewCounter flush error:', err);
            // 恢复失败的数据
            for (const { blogId, count } of updates) {
                const existing = this.views.get(blogId);
                if (existing) {
                    existing.count += count;
                } else {
                    this.views.set(blogId, { count, lastUpdated: Date.now() });
                }
            }
        }
    }

    // 启动定时刷新
    private startAutoFlush(): void {
        this.timer = setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }

    // 停止定时刷新（用于优雅关闭）
    async stop(): Promise<void> {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        await this.flush();
    }

    // 获取待刷新的浏览量（用于调试）
    getPendingCount(): number {
        return this.getTotalCount();
    }
}

// 单例导出
const viewCounter = new ViewCounter(100, 5 * 60 * 1000); // 100次或5分钟

// 优雅关闭时刷新
process.on('SIGTERM', async () => {
    await viewCounter.stop();
});

process.on('SIGINT', async () => {
    await viewCounter.stop();
});

export default viewCounter;
