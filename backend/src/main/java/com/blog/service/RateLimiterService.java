package com.blog.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Redis实现的限流服务。
 * 使用固定窗口算法，简单高效。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimiterService {

    private final StringRedisTemplate redisTemplate;

    private static final String RATE_LIMIT_PREFIX = "rate_limit:";

    /**
     * 检查是否允许请求
     * 
     * @param key           限流键 (如 IP地址或用户ID)
     * @param action        操作类型 (如 login, register)
     * @param limit         时间窗口内允许的最大请求数
     * @param windowSeconds 时间窗口秒数
     * @return true 表示允许请求，false 表示超出限制
     */
    public boolean isAllowed(String key, String action, int limit, int windowSeconds) {
        try {
            String redisKey = RATE_LIMIT_PREFIX + action + ":" + key;

            Long currentCount = redisTemplate.opsForValue().increment(redisKey);
            if (currentCount == null) {
                return false;
            }

            // 第一次请求时设置过期时间
            if (currentCount == 1) {
                redisTemplate.expire(redisKey, windowSeconds, TimeUnit.SECONDS);
            }

            return currentCount <= limit;
        } catch (Exception ex) {
            // Redis 不可用时降级放行，避免登录/注册被系统依赖阻断
            log.warn("Rate limiter degraded: Redis unavailable for action='{}', key='{}'", action, key, ex);
            return true;
        }
    }

    /**
     * 获取剩余请求次数
     */
    public int getRemainingRequests(String key, String action, int limit) {
        try {
            String redisKey = RATE_LIMIT_PREFIX + action + ":" + key;
            String value = redisTemplate.opsForValue().get(redisKey);

            if (value == null) {
                return limit;
            }

            int used = Integer.parseInt(value);
            return Math.max(0, limit - used);
        } catch (Exception ex) {
            log.warn("Failed to get remaining requests from Redis for action='{}', key='{}'", action, key, ex);
            return limit;
        }
    }

    /**
     * 获取重置时间（秒）
     */
    public long getResetTimeSeconds(String key, String action) {
        try {
            String redisKey = RATE_LIMIT_PREFIX + action + ":" + key;
            Long ttl = redisTemplate.getExpire(redisKey, TimeUnit.SECONDS);
            return ttl != null && ttl > 0 ? ttl : 0;
        } catch (Exception ex) {
            log.warn("Failed to get rate-limit reset time from Redis for action='{}', key='{}'", action, key, ex);
            return 0;
        }
    }
}
