package com.blog.service;

import com.blog.dto.UserDto.ChangePasswordRequest;
import com.blog.dto.UserDto.UpdateProfileRequest;
import com.blog.dto.UserDto.UserProfile;
import com.blog.entity.Notification;
import com.blog.entity.User;
import com.blog.exception.ResourceNotFoundException;
import com.blog.exception.UnauthorizedException;
import com.blog.repository.BlogRepository;
import com.blog.repository.NotificationRepository;
import com.blog.repository.UserRepository;
import com.blog.util.HtmlSanitizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

/**
 * UserService 单元测试
 * 覆盖用户资料管理、密码修改、关注系统和通知管理
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BlogRepository blogRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private HtmlSanitizer htmlSanitizer;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private User targetUser;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .password("encoded-password")
                .avatar("avatar.png")
                .bio("测试用户简介")
                .isAdmin(false)
                .followers(new HashSet<>())
                .following(new HashSet<>())
                .createdAt(LocalDateTime.now())
                .build();

        targetUser = User.builder()
                .id(2L)
                .username("targetuser")
                .password("encoded-password2")
                .avatar("target-avatar.png")
                .isAdmin(false)
                .followers(new HashSet<>())
                .following(new HashSet<>())
                .createdAt(LocalDateTime.now())
                .build();

        testNotification = Notification.builder()
                .id(1L)
                .recipientId(1L)
                .senderId(2L)
                .type(Notification.NotificationType.FOLLOW)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ========== 用户资料测试 ==========

    @Nested
    @DisplayName("用户资料管理测试")
    class UserProfileTests {

        @Test
        @DisplayName("获取用户资料成功")
        void getUserProfile_success() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(blogRepository.countByAuthorId(1L)).thenReturn(10L);

            // Act
            UserProfile profile = userService.getUserProfile(1L, null);

            // Assert
            assertThat(profile).isNotNull();
            assertThat(profile.getUsername()).isEqualTo("testuser");
            assertThat(profile.getBlogCount()).isEqualTo(10);
        }

        @Test
        @DisplayName("用户不存在时应抛出异常")
        void getUserProfile_notFound_shouldThrowException() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> userService.getUserProfile(999L, null))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("更新用户资料成功")
        void updateProfile_success() {
            // Arrange
            UpdateProfileRequest request = new UpdateProfileRequest();
            request.setBio("新的简介");
            request.setAvatar("https://example.com/new-avatar.png");

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);
            when(blogRepository.countByAuthorId(1L)).thenReturn(0L);
            when(htmlSanitizer.stripHtml("新的简介")).thenReturn("新的简介");

            // Act
            UserProfile profile = userService.updateProfile(1L, request);

            // Assert
            assertThat(profile).isNotNull();
            verify(userRepository).save(argThat(user -> user.getBio().equals("新的简介") &&
                    user.getAvatar().equals("https://example.com/new-avatar.png")));
        }
    }

    // ========== 密码修改测试 ==========

    @Nested
    @DisplayName("密码修改测试")
    class ChangePasswordTests {

        @Test
        @DisplayName("密码修改成功")
        void changePassword_success() {
            // Arrange
            ChangePasswordRequest request = new ChangePasswordRequest();
            request.setCurrentPassword("oldPassword");
            request.setNewPassword("newPassword123");

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("oldPassword", testUser.getPassword())).thenReturn(true);
            when(passwordEncoder.encode("newPassword123")).thenReturn("encoded-new-password");

            // Act
            userService.changePassword(1L, request);

            // Assert
            verify(passwordEncoder).encode("newPassword123");
            verify(userRepository).save(argThat(user -> user.getPassword().equals("encoded-new-password")));
        }

        @Test
        @DisplayName("当前密码错误时应抛出异常")
        void changePassword_wrongCurrentPassword_shouldThrowException() {
            // Arrange
            ChangePasswordRequest request = new ChangePasswordRequest();
            request.setCurrentPassword("wrongPassword");
            request.setNewPassword("newPassword");

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("wrongPassword", testUser.getPassword())).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> userService.changePassword(1L, request))
                    .isInstanceOf(UnauthorizedException.class);

            // 验证密码没有被改变
            verify(userRepository, never()).save(any(User.class));
        }
    }

    // ========== 关注系统测试 ==========

    @Nested
    @DisplayName("关注系统测试")
    class FollowTests {

        @Test
        @DisplayName("关注用户成功")
        void toggleFollow_follow_success() {
            // Arrange
            when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(blogRepository.countByAuthorId(2L)).thenReturn(0L);

            // Act
            UserProfile profile = userService.toggleFollow(2L, 1L);

            // Assert
            assertThat(profile).isNotNull();
            // 验证当前用户的关注列表包含目标用户
            verify(userRepository, times(2)).save(any(User.class));
            // 验证发送了关注通知
            verify(notificationRepository)
                    .save(argThat(notification -> notification.getRecipientId().equals(2L) &&
                            notification.getSenderId().equals(1L) &&
                            notification.getType() == Notification.NotificationType.FOLLOW));
        }

        @Test
        @DisplayName("取消关注成功")
        void toggleFollow_unfollow_success() {
            // Arrange - 已经关注的状态
            testUser.getFollowing().add(2L);
            targetUser.getFollowers().add(1L);

            when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(blogRepository.countByAuthorId(2L)).thenReturn(0L);

            // Act
            userService.toggleFollow(2L, 1L);

            // Assert - 取消关注时不应发送通知
            verify(notificationRepository, never()).save(any());
        }

        @Test
        @DisplayName("不能关注自己")
        void toggleFollow_self_shouldThrowException() {
            // Act & Assert
            assertThatThrownBy(() -> userService.toggleFollow(1L, 1L))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("关注不存在的用户应抛出异常")
        void toggleFollow_targetNotFound_shouldThrowException() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> userService.toggleFollow(999L, 1L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ========== 通知管理测试 ==========

    @Nested
    @DisplayName("通知管理测试")
    class NotificationTests {

        @Test
        @DisplayName("获取未读通知数量")
        void getUnreadNotificationCount_success() {
            // Arrange
            when(notificationRepository.countByRecipientIdAndIsReadFalse(1L)).thenReturn(5L);

            // Act
            long count = userService.getUnreadNotificationCount(1L);

            // Assert
            assertThat(count).isEqualTo(5);
        }

        @Test
        @DisplayName("标记通知为已读成功")
        void markNotificationAsRead_success() {
            // Arrange
            when(notificationRepository.findById(1L)).thenReturn(Optional.of(testNotification));

            // Act
            userService.markNotificationAsRead(1L, 1L);

            // Assert
            verify(notificationRepository).save(argThat(notification -> notification.getIsRead()));
        }

        @Test
        @DisplayName("非接收者无法标记通知为已读")
        void markNotificationAsRead_wrongUser_shouldThrowException() {
            // Arrange
            when(notificationRepository.findById(1L)).thenReturn(Optional.of(testNotification));

            // Act & Assert
            assertThatThrownBy(() -> userService.markNotificationAsRead(1L, 999L))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        @DisplayName("通知不存在时应抛出异常")
        void markNotificationAsRead_notFound_shouldThrowException() {
            // Arrange
            when(notificationRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> userService.markNotificationAsRead(999L, 1L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
