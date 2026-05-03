package com.blog.aspect;

import com.blog.annotation.RateLimit;
import com.blog.exception.TooManyRequestsException;
import com.blog.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 限流切面，拦截带有 @RateLimit 注解的方法
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitAspect {

    private final RateLimiterService rateLimiterService;

    @Around("@annotation(rateLimit)")
    public Object checkRateLimit(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        HttpServletRequest request = getRequest();
        if (request == null) {
            return joinPoint.proceed();
        }

        String clientIp = getClientIp(request);
        String key = rateLimit.key().isEmpty()
                ? ((MethodSignature) joinPoint.getSignature()).getMethod().getName()
                : rateLimit.key();

        if (!rateLimiterService.isAllowed(clientIp, key, rateLimit.limit(), rateLimit.window())) {
            long resetTime = rateLimiterService.getResetTimeSeconds(clientIp, key);
            log.warn("限流触发 - IP: {}, Action: {}, ResetIn: {}s", clientIp, key, resetTime);
            throw new TooManyRequestsException(rateLimit.message());
        }

        return joinPoint.proceed();
    }

    private HttpServletRequest getRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    private String getClientIp(HttpServletRequest request) {
        // 尝试从代理头获取真实IP
        String[] headers = {
                "X-Forwarded-For",
                "X-Real-IP",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP"
        };

        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For可能包含多个IP，取第一个
                return ip.split(",")[0].trim();
            }
        }

        return request.getRemoteAddr();
    }
}
