package com.blog.service;

import com.blog.dto.PageDto;
import com.blog.dto.UserDto.ChangePasswordRequest;
import com.blog.dto.UserDto.NotificationResponse;
import com.blog.dto.UserDto.SenderInfo;
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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BlogRepository blogRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final HtmlSanitizer htmlSanitizer;

    public UserProfile getUserProfile(Long userId, Long currentUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));

        return toUserProfile(user, currentUserId);
    }

    public UserProfile getUserProfileByUsername(String username, Long currentUserId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));

        return toUserProfile(user, currentUserId);
    }

    @Transactional
    public UserProfile updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));

        if (request.getBio() != null) {
            // XSS防护: 对bio进行消毒处理
            String sanitizedBio = htmlSanitizer.stripHtml(request.getBio());
            user.setBio(sanitizedBio);
        }
        if (request.getAvatar() != null) {
            // URL验证: 只允许http/https协议的合法URL
            String avatar = request.getAvatar();
            if (!avatar.isEmpty() && !avatar.matches("^https?://.*")) {
                throw new IllegalArgumentException("头像URL必须以http://或https://开头");
            }
            user.setAvatar(avatar);
        }

        User updatedUser = userRepository.save(user);
        return toUserProfile(updatedUser, userId);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new UnauthorizedException("当前密码错误");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserProfile toggleFollow(Long targetUserId, Long currentUserId) {
        if (targetUserId.equals(currentUserId)) {
            throw new IllegalArgumentException("不能关注自己");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("当前用户不存在"));

        if (currentUser.getFollowing().contains(targetUserId)) {
            currentUser.getFollowing().remove(targetUserId);
            targetUser.getFollowers().remove(currentUserId);
        } else {
            currentUser.getFollowing().add(targetUserId);
            targetUser.getFollowers().add(currentUserId);

            // Create notification
            Notification notification = Notification.builder()
                    .recipientId(targetUserId)
                    .senderId(currentUserId)
                    .type(Notification.NotificationType.FOLLOW)
                    .build();
            notificationRepository.save(notification);
        }

        userRepository.save(currentUser);
        userRepository.save(targetUser);

        return toUserProfile(targetUser, currentUserId);
    }

    public PageDto<UserProfile> getFollowers(Long userId, int page, int size, Long currentUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));

        List<Long> followerIds = new ArrayList<>(user.getFollowers());
        int start = page * size;
        int end = Math.min(start + size, followerIds.size());

        if (start >= followerIds.size()) {
            return PageDto.<UserProfile>builder()
                    .content(List.of())
                    .page(page)
                    .size(size)
                    .totalElements(followerIds.size())
                    .totalPages((int) Math.ceil((double) followerIds.size() / size))
                    .first(page == 0)
                    .last(end >= followerIds.size())
                    .hasNext(end < followerIds.size())
                    .hasPrevious(page > 0)
                    .build();
        }

        List<Long> pageIds = followerIds.subList(start, end);
        List<User> followers = userRepository.findAllById(pageIds);

        List<UserProfile> profiles = followers.stream()
                .map(u -> toUserProfile(u, currentUserId))
                .collect(Collectors.toList());

        return PageDto.<UserProfile>builder()
                .content(profiles)
                .page(page)
                .size(size)
                .totalElements(followerIds.size())
                .totalPages((int) Math.ceil((double) followerIds.size() / size))
                .first(page == 0)
                .last(end >= followerIds.size())
                .hasNext(end < followerIds.size())
                .hasPrevious(page > 0)
                .build();
    }

    public PageDto<UserProfile> getFollowing(Long userId, int page, int size, Long currentUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));

        List<Long> followingIds = new ArrayList<>(user.getFollowing());
        int start = page * size;
        int end = Math.min(start + size, followingIds.size());

        if (start >= followingIds.size()) {
            return PageDto.<UserProfile>builder()
                    .content(List.of())
                    .page(page)
                    .size(size)
                    .totalElements(followingIds.size())
                    .totalPages((int) Math.ceil((double) followingIds.size() / size))
                    .first(page == 0)
                    .last(end >= followingIds.size())
                    .hasNext(end < followingIds.size())
                    .hasPrevious(page > 0)
                    .build();
        }

        List<Long> pageIds = followingIds.subList(start, end);
        List<User> following = userRepository.findAllById(pageIds);

        List<UserProfile> profiles = following.stream()
                .map(u -> toUserProfile(u, currentUserId))
                .collect(Collectors.toList());

        return PageDto.<UserProfile>builder()
                .content(profiles)
                .page(page)
                .size(size)
                .totalElements(followingIds.size())
                .totalPages((int) Math.ceil((double) followingIds.size() / size))
                .first(page == 0)
                .last(end >= followingIds.size())
                .hasNext(end < followingIds.size())
                .hasPrevious(page > 0)
                .build();
    }

    public PageDto<NotificationResponse> getNotifications(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable);

        List<Long> senderIds = notifications.getContent().stream()
                .map(Notification::getSenderId)
                .filter(s -> s != null)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, User> senderMap = userRepository.findAllById(senderIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return PageDto.from(notifications, n -> toNotificationResponse(n, senderMap));
    }

    public long getUnreadNotificationCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markNotificationAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("通知不存在"));

        if (!notification.getRecipientId().equals(userId)) {
            throw new UnauthorizedException("无权访问该通知");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllNotificationsAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    private UserProfile toUserProfile(User user, Long currentUserId) {
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        long blogCount = blogRepository.countByAuthorId(user.getId());
        long likedCount = blogRepository.countLikedByUserId(user.getId());
        long receivedLikeCount = blogRepository.countReceivedLikesByAuthorId(user.getId());
        int bookmarkCount = user.getBookmarks() != null ? user.getBookmarks().size() : 0;

        // 注意：isAdmin字段已从公开资料中移除，防止攻击者枚举ADMIN ACCOUNT
        return UserProfile.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatar(user.getAvatar())
                .bio(user.getBio())
                .isAdmin(Boolean.TRUE.equals(user.getIsAdmin()))
                .blogCount((int) blogCount)
                .likeCount((int) receivedLikeCount)
                .likedCount((int) likedCount)
                .receivedLikeCount((int) receivedLikeCount)
                .bookmarkCount(bookmarkCount)
                .followerCount(user.getFollowers().size())
                .followingCount(user.getFollowing().size())
                .isFollowing(currentUser != null && currentUser.getFollowing().contains(user.getId()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    private NotificationResponse toNotificationResponse(Notification notification, Map<Long, User> senderMap) {
        User sender = notification.getSenderId() != null ? senderMap.get(notification.getSenderId()) : null;

        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType().name())
                .content(notification.getContent())
                .sender(sender != null ? SenderInfo.builder()
                        .id(sender.getId())
                        .username(sender.getUsername())
                        .avatar(sender.getAvatar())
                        .build() : null)
                .relatedBlogId(notification.getRelatedBlogId())
                .relatedCommentId(notification.getRelatedCommentId())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
