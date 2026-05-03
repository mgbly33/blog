package com.blog.service;

import com.blog.dto.AuthDto;
import com.blog.dto.AuthDto.AuthResponse;
import com.blog.dto.AuthDto.LoginRequest;
import com.blog.dto.AuthDto.RegisterRequest;
import com.blog.entity.User;
import com.blog.exception.DuplicateResourceException;
import com.blog.exception.ResourceNotFoundException;
import com.blog.repository.UserRepository;
import com.blog.security.JwtTokenProvider;
import com.blog.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final StringRedisTemplate redisTemplate;

    private static final String TOKEN_BLACKLIST_PREFIX = "jwt:blacklist:";

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("用户名已存在");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        user.generateDefaultAvatar();
        user = userRepository.save(user);

        // 使用用户ID生成Token
        String accessToken = tokenProvider.generateToken(user.getId());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()));

        // 从认证结果中获取UserPrincipal
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));

        // 使用用户ID生成Token
        String accessToken = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(userPrincipal.getId());

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken) || !tokenProvider.isRefreshToken(refreshToken)) {
            throw new IllegalArgumentException("无效的刷新令牌");
        }

        // 检查 token 是否已被撤销
        String jti = tokenProvider.extractJti(refreshToken);
        if (jti != null && isTokenRevoked(jti)) {
            throw new IllegalArgumentException("刷新令牌已失效");
        }

        Long userId = tokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));

        // 撤销旧的 refresh token
        revokeToken(refreshToken);

        String newAccessToken = tokenProvider.generateToken(userId);
        String newRefreshToken = tokenProvider.generateRefreshToken(userId);

        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }

    public void revokeToken(String token) {
        String jti = tokenProvider.extractJti(token);
        if (jti != null) {
            long ttl = tokenProvider.getExpirationFromToken(token);
            if (ttl > 0) {
                redisTemplate.opsForValue().set(
                        TOKEN_BLACKLIST_PREFIX + jti, "revoked", ttl, TimeUnit.MILLISECONDS);
            }
        }
    }

    public boolean isTokenRevoked(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(TOKEN_BLACKLIST_PREFIX + jti));
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(AuthDto.AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .avatar(user.getAvatar())
                        .bio(user.getBio())
                        .isAdmin(user.getIsAdmin())
                        .build())
                .build();
    }
}
