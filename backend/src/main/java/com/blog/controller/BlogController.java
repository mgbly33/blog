package com.blog.controller;

import com.blog.dto.ApiResponse;
import com.blog.dto.BlogDto.BlogListItem;
import com.blog.dto.BlogDto.BlogResponse;
import com.blog.dto.BlogDto.CreateRequest;
import com.blog.dto.BlogDto.UpdateRequest;
import com.blog.dto.PageDto;
import com.blog.entity.User;
import com.blog.exception.ResourceNotFoundException;
import com.blog.repository.UserRepository;
import com.blog.security.UserPrincipal;
import com.blog.service.BlogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blogs")
@RequiredArgsConstructor
@Tag(name = "Blog", description = "博客管理接口")
public class BlogController {

    private final BlogService blogService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "获取公开博客列表（分页）")
    public ResponseEntity<ApiResponse<PageDto<BlogListItem>>> getBlogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long categoryId) {
        PageDto<BlogListItem> blogs = blogService.getPublicBlogs(page, size, categoryId);
        return ResponseEntity.ok(ApiResponse.success(blogs));
    }

    @GetMapping("/sticky")
    @Operation(summary = "获取置顶博客")
    public ResponseEntity<ApiResponse<List<BlogListItem>>> getStickyBlogs() {
        List<BlogListItem> blogs = blogService.getStickyBlogs();
        return ResponseEntity.ok(ApiResponse.success(blogs));
    }

    @GetMapping("/search")
    @Operation(summary = "搜索博客")
    public ResponseEntity<ApiResponse<PageDto<BlogListItem>>> searchBlogs(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageDto<BlogListItem> blogs = blogService.searchBlogs(q, page, size);
        return ResponseEntity.ok(ApiResponse.success(blogs));
    }

    @GetMapping("/tag/{tagId}")
    @Operation(summary = "按标签获取博客")
    public ResponseEntity<ApiResponse<PageDto<BlogListItem>>> getBlogsByTag(
            @PathVariable Long tagId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageDto<BlogListItem> blogs = blogService.getBlogsByTag(tagId, page, size);
        return ResponseEntity.ok(ApiResponse.success(blogs));
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "按分类获取博客")
    public ResponseEntity<ApiResponse<PageDto<BlogListItem>>> getBlogsByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageDto<BlogListItem> blogs = blogService.getBlogsByCategory(categoryId, page, size);
        return ResponseEntity.ok(ApiResponse.success(blogs));
    }

    @GetMapping("/liked")
    @Operation(summary = "获取当前用户点赞的博客")
    public ResponseEntity<ApiResponse<PageDto<BlogListItem>>> getLikedBlogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PageDto<BlogListItem> blogs = blogService.getLikedBlogs(userPrincipal.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(blogs));
    }

    @GetMapping("/bookmarks")
    @Operation(summary = "获取用户收藏列表")
    public ResponseEntity<ApiResponse<PageDto<BlogListItem>>> getBookmarkedBlogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PageDto<BlogListItem> blogs = blogService.getBookmarkedBlogs(userPrincipal.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(blogs));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "获取用户的博客")
    public ResponseEntity<ApiResponse<PageDto<BlogListItem>>> getUserBlogs(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        PageDto<BlogListItem> blogs = blogService.getUserBlogs(userId, page, size, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(blogs));
    }

    @GetMapping("/user/username/{username}")
    @Operation(summary = "按用户名获取用户的博客")
    public ResponseEntity<ApiResponse<PageDto<BlogListItem>>> getUserBlogsByUsername(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在: " + username));
        Long currentUserId = userPrincipal != null ? userPrincipal.getId() : null;
        PageDto<BlogListItem> blogs = blogService.getUserBlogs(user.getId(), page, size, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(blogs));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取博客详情")
    public ResponseEntity<ApiResponse<BlogResponse>> getBlogById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        // 使用用户ID而非用户名
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        BlogResponse blog = blogService.getBlogById(id, userId);
        return ResponseEntity.ok(ApiResponse.success(blog));
    }

    @PostMapping
    @Operation(summary = "创建博客")
    public ResponseEntity<ApiResponse<BlogResponse>> createBlog(
            @Valid @RequestBody CreateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        // 使用用户ID而非用户名
        BlogResponse blog = blogService.createBlog(request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("博客创建成功", blog));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新博客")
    public ResponseEntity<ApiResponse<BlogResponse>> updateBlog(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        // 使用用户ID而非用户名
        BlogResponse blog = blogService.updateBlog(id, request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("博客更新成功", blog));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除博客")
    public ResponseEntity<ApiResponse<Void>> deleteBlog(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        // 使用用户ID而非用户名
        blogService.deleteBlog(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("博客删除成功", null));
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "点赞/取消点赞博客")
    public ResponseEntity<ApiResponse<BlogResponse>> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        // 使用用户ID而非用户名
        BlogResponse blog = blogService.toggleLike(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(blog));
    }

    @PostMapping("/{id}/bookmark")
    @Operation(summary = "收藏/取消收藏博客")
    public ResponseEntity<ApiResponse<Void>> toggleBookmark(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        // 使用用户ID而非用户名
        blogService.toggleBookmark(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("收藏状态已切换", null));
    }
}
