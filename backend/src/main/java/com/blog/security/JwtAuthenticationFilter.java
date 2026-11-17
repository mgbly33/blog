package com.blog.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final StringRedisTemplate redisTemplate;

    private static final String TOKEN_BLACKLIST_PREFIX = "jwt:blacklist:";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                // 拒绝 refresh token 用于 API 访问
                if (!tokenProvider.isAccessToken(jwt)) {
                    log.warn("拒绝非 access 类型的 Token 用于 API 访问");
                    filterChain.doFilter(request, response);
                    return;
                }

                // 检查 token 是否已被撤销（Redis 异常时优雅降级）
                String jti = tokenProvider.extractJti(jwt);
                if (jti != null) {
                    try {
                        if (Boolean.TRUE.equals(redisTemplate.hasKey(TOKEN_BLACKLIST_PREFIX + jti))) {
                            log.warn("拒绝已撤销的 Token");
                            filterChain.doFilter(request, response);
                            return;
                        }
                    } catch (Exception redisEx) {
                        log.warn("Redis 黑名单查询不可用，跳过吊销检查: {}", redisEx.getMessage());
                    }
                }

                Long userId = tokenProvider.getUserIdFromToken(jwt);

                // 使用用户ID加载用户详情并校验账号启用与封禁状态
                UserDetails userDetails = userDetailsService.loadUserById(userId);
                if (!userDetails.isEnabled() || !userDetails.isAccountNonLocked()) {
                    log.warn("拒绝被封禁或禁用账号的 Token, userId={}", userId);
                    filterChain.doFilter(request, response);
                    return;
                }

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities());

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            log.error("无法在安全上下文中设置用户认证", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
