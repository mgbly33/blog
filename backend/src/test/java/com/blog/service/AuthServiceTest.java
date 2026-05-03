package com.blog.service;

import com.blog.dto.AuthDto.AuthResponse;
import com.blog.dto.AuthDto.LoginRequest;
import com.blog.dto.AuthDto.RegisterRequest;
import com.blog.entity.User;
import com.blog.exception.DuplicateResourceException;
import com.blog.exception.ResourceNotFoundException;
import com.blog.repository.UserRepository;
import com.blog.security.JwtTokenProvider;
import com.blog.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * AuthService 单元测试
 * 覆盖用户注册、登录和令牌刷新的核心安全逻辑
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .password("encoded-password")
                .avatar("default-avatar.png")
                .isAdmin(false)
                .build();
    }

    // ========== 用户注册测试 ==========

    @Nested
    @DisplayName("用户注册测试")
    class RegisterTests {

        @Test
        @DisplayName("成功注册新用户")
        void register_success() {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setUsername("newuser");
            request.setPassword("password123");

            when(userRepository.existsByUsername("newuser")).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(2L);
                return user;
            });
            when(tokenProvider.generateToken(2L)).thenReturn("access-token");
            when(tokenProvider.generateRefreshToken(2L)).thenReturn("refresh-token");

            // Act
            AuthResponse response = authService.register(request);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("access-token");
            assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
            assertThat(response.getUser().getUsername()).isEqualTo("newuser");

            // 验证密码被加密
            verify(passwordEncoder).encode("password123");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("用户名重复时应抛出异常")
        void register_duplicateUsername_shouldThrowException() {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setUsername("existinguser");
            request.setPassword("password123");

            when(userRepository.existsByUsername("existinguser")).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("用户名已存在");

            // 验证不会尝试保存
            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("注册时应生成默认头像")
        void register_shouldGenerateDefaultAvatar() {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setUsername("newuser");
            request.setPassword("password123");

            when(userRepository.existsByUsername("newuser")).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("encoded");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(2L);
                return user;
            });
            when(tokenProvider.generateToken(2L)).thenReturn("token");
            when(tokenProvider.generateRefreshToken(2L)).thenReturn("refresh");

            // Act
            authService.register(request);

            // Assert - 验证保存前调用了头像生成
            verify(userRepository).save(argThat(user -> user.getAvatar() != null));
        }
    }

    // ========== 用户登录测试 ==========

    @Nested
    @DisplayName("用户登录测试")
    class LoginTests {

        @Test
        @DisplayName("凭据正确时成功登录")
        void login_validCredentials_success() {
            // Arrange
            LoginRequest request = new LoginRequest();
            request.setUsername("testuser");
            request.setPassword("correctPassword");

            // 创建 UserPrincipal 时会调用 User.getId()，这里需要确保 User 对象已正确构建
            // 注意：Mockito 创建的 mock 对象默认方法返回 null/0/false
            // 但在这里我们使用的是真实对象构建 UserPrincipal
            UserPrincipal userPrincipal = new UserPrincipal(testUser);

            Authentication authentication = mock(Authentication.class);
            when(authentication.getPrincipal()).thenReturn(userPrincipal);
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(authentication);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(tokenProvider.generateToken(authentication)).thenReturn("access-token");
            when(tokenProvider.generateRefreshToken(1L)).thenReturn("refresh-token");

            // Act
            AuthResponse response = authService.login(request);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("access-token");
            assertThat(response.getUser().getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("密码错误时应抛出认证异常")
        void login_wrongPassword_shouldThrowException() {
            // Arrange
            LoginRequest request = new LoginRequest();
            request.setUsername("testuser");
            request.setPassword("wrongPassword");

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new BadCredentialsException("密码错误"));

            // Act & Assert
            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class);
        }

        @Test
        @DisplayName("用户不存在时认证管理器应抛出异常")
        void login_userNotFound_shouldThrowException() {
            // Arrange
            LoginRequest request = new LoginRequest();
            request.setUsername("nonexistent");
            request.setPassword("password");

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new BadCredentialsException("用户不存在"));

            // Act & Assert
            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class);
        }
    }

    // ========== 令牌刷新测试 ==========

    @Nested
    @DisplayName("令牌刷新测试")
    class RefreshTokenTests {

        @Test
        @DisplayName("使用有效 Refresh Token 获取新令牌")
        void refreshToken_validToken_success() {
            // Arrange
            String validRefreshToken = "valid-refresh-token";

            when(tokenProvider.validateToken(validRefreshToken)).thenReturn(true);
            when(tokenProvider.isRefreshToken(validRefreshToken)).thenReturn(true);
            when(tokenProvider.getUserIdFromToken(validRefreshToken)).thenReturn(1L);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(tokenProvider.generateToken(1L)).thenReturn("new-access-token");
            when(tokenProvider.generateRefreshToken(1L)).thenReturn("new-refresh-token");

            // Act
            AuthResponse response = authService.refreshToken(validRefreshToken);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("new-access-token");
            assertThat(response.getRefreshToken()).isEqualTo("new-refresh-token");
        }

        @Test
        @DisplayName("无效 Token 应抛出异常")
        void refreshToken_invalidToken_shouldThrowException() {
            // Arrange
            String invalidToken = "invalid-token";

            when(tokenProvider.validateToken(invalidToken)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.refreshToken(invalidToken))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("无效的刷新令牌");
        }

        @Test
        @DisplayName("使用 Access Token 作为 Refresh Token 应抛出异常")
        void refreshToken_accessTokenUsedAsRefresh_shouldThrowException() {
            // Arrange
            String accessToken = "access-token";

            when(tokenProvider.validateToken(accessToken)).thenReturn(true);
            when(tokenProvider.isRefreshToken(accessToken)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.refreshToken(accessToken))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Token 对应的用户不存在应抛出异常")
        void refreshToken_userNotFound_shouldThrowException() {
            // Arrange
            String validToken = "valid-token";

            when(tokenProvider.validateToken(validToken)).thenReturn(true);
            when(tokenProvider.isRefreshToken(validToken)).thenReturn(true);
            when(tokenProvider.getUserIdFromToken(validToken)).thenReturn(999L);
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.refreshToken(validToken))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("用户不存在");
        }
    }
}
