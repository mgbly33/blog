package com.blog.controller;

import com.blog.annotation.Loggable;
import com.blog.annotation.RateLimit;
import com.blog.dto.ApiResponse;
import com.blog.dto.AuthDto.AuthResponse;
import com.blog.dto.AuthDto.LoginRequest;
import com.blog.dto.AuthDto.RefreshTokenRequest;
import com.blog.dto.AuthDto.RegisterRequest;
import com.blog.entity.OperationLog.ActionType;
import com.blog.entity.OperationLog.TargetType;
import com.blog.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "用户认证接口")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "用户注册")
    @RateLimit(key = "register", limit = 3, window = 60, message = "注册请求过于频繁，请1分钟后重试")
    @Loggable(action = ActionType.REGISTER, target = TargetType.USER, description = "用户注册")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("注册成功", response));
    }

    @PostMapping("/login")
    @Operation(summary = "用户登录")
    @RateLimit(key = "login", limit = 5, window = 60, message = "登录尝试过于频繁，请1分钟后重试")
    @Loggable(action = ActionType.LOGIN, target = TargetType.USER, description = "用户登录")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("登录成功", response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "刷新访问令牌")
    @RateLimit(key = "refresh", limit = 10, window = 60, message = "令牌刷新请求过于频繁，请稍后重试")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("令牌刷新成功", response));
    }

    @PostMapping("/logout")
    @Operation(summary = "用户登出")
    @Loggable(action = ActionType.LOGOUT, target = TargetType.USER, description = "用户登出")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            authService.revokeToken(token);
        }
        return ResponseEntity.ok(ApiResponse.success("登出成功", null));
    }
}
