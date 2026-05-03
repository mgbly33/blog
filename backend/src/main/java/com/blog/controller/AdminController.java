package com.blog.controller;

import com.blog.annotation.Loggable;
import com.blog.dto.AdminDto.BlogAdminView;
import com.blog.dto.AdminDto.BlogApprovalRequest;
import com.blog.dto.AdminDto.DashboardStats;
import com.blog.dto.AdminDto.UserBanRequest;
import com.blog.dto.ApiResponse;
import com.blog.dto.PageDto;
import com.blog.dto.UserDto.UserListItem;
import com.blog.entity.Blog;
import com.blog.entity.OperationLog.ActionType;
import com.blog.entity.OperationLog.TargetType;
import com.blog.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "管理后台", description = "后台管理接口")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    @Operation(summary = "获取仪表盘统计数据")
    public ResponseEntity<ApiResponse<DashboardStats>> getDashboardStats() {
        DashboardStats stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // User Management

    @GetMapping("/users")
    @Operation(summary = "分页获取用户列表")
    public ResponseEntity<ApiResponse<PageDto<UserListItem>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        PageDto<UserListItem> users = adminService.getAllUsers(page, size, search);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PostMapping("/users/{id}/ban")
    @Operation(summary = "封禁或解封用户")
    @Loggable(action = ActionType.USER_BAN, target = TargetType.USER, description = "切换用户封禁状态")
    public ResponseEntity<ApiResponse<Void>> toggleUserBan(
            @PathVariable Long id,
            @Valid @RequestBody UserBanRequest request) {
        adminService.toggleUserBan(id, request);
        String message = request.getBanned() ? "用户已封禁" : "用户已解封";
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    @PostMapping("/users/{id}/admin")
    @Operation(summary = "授予或撤销管理员权限")
    @Loggable(action = ActionType.USER_PROMOTE, target = TargetType.USER, description = "切换用户管理员权限")
    public ResponseEntity<ApiResponse<Void>> toggleUserAdmin(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request) {
        adminService.toggleUserAdmin(id, request.getOrDefault("isAdmin", false));
        return ResponseEntity.ok(ApiResponse.success("管理员状态更新成功", null));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "删除用户")
    @Loggable(action = ActionType.USER_DELETE, target = TargetType.USER, description = "删除用户")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("用户删除成功", null));
    }

    // Blog Management

    @GetMapping("/blogs")
    @Operation(summary = "分页获取博客列表")
    public ResponseEntity<ApiResponse<PageDto<BlogAdminView>>> getAllBlogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Blog.Status status) {
        PageDto<BlogAdminView> blogs = adminService.getAllBlogs(page, size, status);
        return ResponseEntity.ok(ApiResponse.success(blogs));
    }

    @GetMapping("/blogs/pending")
    @Operation(summary = "获取待审核博客")
    public ResponseEntity<ApiResponse<PageDto<BlogAdminView>>> getPendingBlogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageDto<BlogAdminView> blogs = adminService.getPendingBlogs(page, size);
        return ResponseEntity.ok(ApiResponse.success(blogs));
    }

    @PostMapping("/blogs/{id}/status")
    @Operation(summary = "审核通过或拒绝博客")
    @Loggable(action = ActionType.BLOG_UPDATE, target = TargetType.BLOG, description = "审核博客状态")
    public ResponseEntity<ApiResponse<Void>> updateBlogStatus(
            @PathVariable Long id,
            @Valid @RequestBody BlogApprovalRequest request) {
        Blog.Status finalStatus = adminService.updateBlogStatus(id, request);
        String message;
        if (finalStatus == Blog.Status.SCHEDULED) {
            message = "博客审核通过，已加入定时发布";
        } else if (finalStatus == Blog.Status.APPROVED) {
            message = "博客审核通过";
        } else {
            message = "博客审核拒绝";
        }
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    @PostMapping("/blogs/{id}/sticky")
    @Operation(summary = "切换博客置顶状态")
    @Loggable(action = ActionType.BLOG_UPDATE, target = TargetType.BLOG, description = "切换博客置顶状态")
    public ResponseEntity<ApiResponse<Void>> toggleBlogSticky(@PathVariable Long id) {
        adminService.toggleBlogSticky(id);
        return ResponseEntity.ok(ApiResponse.success("置顶状态已切换", null));
    }

    @DeleteMapping("/blogs/{id}")
    @Operation(summary = "删除博客")
    @Loggable(action = ActionType.BLOG_DELETE, target = TargetType.BLOG, description = "删除博客")
    public ResponseEntity<ApiResponse<Void>> deleteBlog(@PathVariable Long id) {
        adminService.deleteBlog(id);
        return ResponseEntity.ok(ApiResponse.success("博客删除成功", null));
    }
}
