import Redis from 'ioredis';

class CacheService {
    private client: Redis | null = null;
    private memoryCache: Map<string, { value: any; expiresAt: number }>;
    private useRedis: boolean = false;
    private ttl: number;
    private readonly keyPrefix = 'blog:';

    constructor(ttl: number = 300000) { // Default 5 minutes
        this.memoryCache = new Map();
        this.ttl = ttl;

        // Try to connect to Redis if environment variables are set
        if (process.env.REDIS_HOST) {
            this.client = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                retryStrategy: (times) => {
                    if (times > 3) {
                        console.log('Redis connection failed, falling back to memory cache');
                        this.useRedis = false;
                        return null;
                    }
                    return Math.min(times * 50, 2000);
                }
            });

            this.client.on('connect', () => {
                console.log('Redis connected');
                this.useRedis = true;
            });

            this.client.on('error', (err) => {
                console.error('Redis error:', err);
                this.useRedis = false;
            });
        }
    }

    async set(key: string, value: any, customTTL: number | null = null): Promise<void> {
        const ttl = customTTL || this.ttl;
        const prefixedKey = this.keyPrefix + key;
        if (this.useRedis && this.client) {
            try {
                await this.client.set(prefixedKey, JSON.stringify(value), 'PX', ttl);
            } catch (err) {
                console.error('Redis set error, falling back to memory:', err);
                this.setMemory(key, value, ttl);
            }
        } else {
            this.setMemory(key, value, ttl);
        }
    }

    async get(key: string): Promise<any | null> {
        const prefixedKey = this.keyPrefix + key;
        if (this.useRedis && this.client) {
            try {
                const data = await this.client.get(prefixedKey);
                return data ? JSON.parse(data) : null;
            } catch (err) {
                console.error('Redis get error, falling back to memory:', err);
                return this.getMemory(key);
            }
        } else {
            return this.getMemory(key);
        }
    }

    async delete(key: string): Promise<void> {
        const prefixedKey = this.keyPrefix + key;
        if (this.useRedis && this.client) {
            try {
                await this.client.del(prefixedKey);
            } catch (err) {
                console.error('Redis delete error:', err);
            }
        }
        this.memoryCache.delete(key);
    }

    async clear(): Promise<void> {
        if (this.useRedis && this.client) {
            try {
                // 只删除带前缀的 key，不使用 flushdb() 以避免误删其他业务数据
                const keys = await this.client.keys(this.keyPrefix + '*');
                if (keys.length > 0) {
                    await this.client.del(...keys);
                }
            } catch (err) {
                console.error('Redis clear error:', err);
            }
        }
        this.memoryCache.clear();
    }

    // 按前缀删除缓存 (细粒度失效)
    async deleteByPrefix(prefix: string): Promise<number> {
        const fullPrefix = this.keyPrefix + prefix;
        let deletedCount = 0;

        if (this.useRedis && this.client) {
            try {
                const keys = await this.client.keys(fullPrefix + '*');
                if (keys.length > 0) {
                    await this.client.del(...keys);
                    deletedCount = keys.length;
                }
            } catch (err) {
                console.error('Redis deleteByPrefix error:', err);
            }
        }

        // 同时清理内存缓存
        for (const key of this.memoryCache.keys()) {
            if (key.startsWith(prefix)) {
                this.memoryCache.delete(key);
                deletedCount++;
            }
        }

        return deletedCount;
    }

    // 删除多个前缀的缓存
    async deleteByPrefixes(prefixes: string[]): Promise<number> {
        let totalDeleted = 0;
        for (const prefix of prefixes) {
            totalDeleted += await this.deleteByPrefix(prefix);
        }
        return totalDeleted;
    }

    // 使缓存失效的便捷方法
    async invalidateHome(): Promise<void> {
        await this.deleteByPrefixes(['home_', 'sidebar_']);
    }

    async invalidateBlog(blogId: string): Promise<void> {
        await this.deleteByPrefix(`blog_${blogId}`);
        await this.deleteByPrefix('home_');
    }

    async invalidateUser(userId: string): Promise<void> {
        await this.deleteByPrefix(`user_${userId}`);
    }

    // Memory cache fallback methods
    private setMemory(key: string, value: any, ttl: number): void {
        const expiresAt = Date.now() + ttl;
        this.memoryCache.set(key, { value, expiresAt });
    }

    private getMemory(key: string): any | null {
        const item = this.memoryCache.get(key);
        if (!item) return null;
        if (Date.now() > item.expiresAt) {
            this.memoryCache.delete(key);
            return null;
        }
        return item.value;
    }

    // Only needed for memory cache cleanup
    cleanup(): void {
        const now = Date.now();
        for (const [key, item] of this.memoryCache.entries()) {
            if (now > item.expiresAt) {
                this.memoryCache.delete(key);
            }
        }
    }
}

const cache = new CacheService(300000); // 5 minutes default

// Cleanup memory cache periodically
setInterval(() => {
    cache.cleanup();
}, 600000);

export default cache;
