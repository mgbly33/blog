package com.blog.controller;

import com.blog.dto.ApiResponse;
import com.blog.dto.PageDto;
import com.blog.dto.UserDto.ChangePasswordRequest;
import com.blog.dto.UserDto.NotificationResponse;
import com.blog.dto.UserDto.UpdateProfileRequest;
import com.blog.dto.UserDto.UserProfile;
import com.blog.security.UserPrincipal;
import com.blog.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "用户管理接口")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "获取当前用户信息")
    public ResponseEntity<ApiResponse<UserProfile>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserProfile profile = userService.getUserProfile(userPrincipal.getId(), userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取用户信息")
    public ResponseEntity<ApiResponse<UserProfile>> getUserById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        UserProfile profile = userService.getUserProfile(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/username/{username}")
    @Operation(summary = "根据用户名获取用户信息")
    public ResponseEntity<ApiResponse<UserProfile>> getUserByUsername(
            @PathVariable String username,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        UserProfile profile = userService.getUserProfileByUsername(username, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me")
    @Operation(summary = "更新当前用户信息")
    public ResponseEntity<ApiResponse<UserProfile>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserProfile profile = userService.updateProfile(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("资料更新成功", profile));
    }

    @PostMapping("/me/password")
    @Operation(summary = "修改密码")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        userService.changePassword(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("密码修改成功", null));
    }

    @PostMapping("/{id}/follow")
    @Operation(summary = "关注/取消关注用户")
    public ResponseEntity<ApiResponse<UserProfile>> toggleFollow(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserProfile profile = userService.toggleFollow(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/{id}/followers")
    @Operation(summary = "获取用户的粉丝列表")
    public ResponseEntity<ApiResponse<PageDto<UserProfile>>> getFollowers(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        PageDto<UserProfile> followers = userService.getFollowers(id, page, size, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(followers));
    }

    @GetMapping("/{id}/following")
    @Operation(summary = "获取用户关注的人")
    public ResponseEntity<ApiResponse<PageDto<UserProfile>>> getFollowing(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        PageDto<UserProfile> following = userService.getFollowing(id, page, size, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(following));
    }

    @GetMapping("/notifications")
    @Operation(summary = "获取当前用户的通知")
    public ResponseEntity<ApiResponse<PageDto<NotificationResponse>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PageDto<NotificationResponse> notifications = userService.getNotifications(
                userPrincipal.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/notifications/unread-count")
    @Operation(summary = "获取未读通知数量")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        long count = userService.getUnreadNotificationCount(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    @PostMapping("/notifications/{id}/read")
    @Operation(summary = "标记通知为已读")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        userService.markNotificationAsRead(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("通知已标记为已读", null));
    }

    @PostMapping("/notifications/read-all")
    @Operation(summary = "标记所有通知为已读")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        userService.markAllNotificationsAsRead(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("所有通知已标记为已读", null));
    }
}
