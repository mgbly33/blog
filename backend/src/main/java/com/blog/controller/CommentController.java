package com.blog.controller;

import com.blog.dto.ApiResponse;
import com.blog.dto.CommentDto.CommentResponse;
import com.blog.dto.CommentDto.CreateRequest;
import com.blog.dto.PageDto;
import com.blog.security.UserPrincipal;
import com.blog.service.CommentService;
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
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@Tag(name = "Comment", description = "评论管理接口")
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/blog/{blogId}")
    @Operation(summary = "获取博客评论")
    public ResponseEntity<ApiResponse<PageDto<CommentResponse>>> getCommentsByBlog(
            @PathVariable Long blogId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        PageDto<CommentResponse> comments = commentService.getCommentsByBlog(blogId, page, size, userId);
        return ResponseEntity.ok(ApiResponse.success(comments));
    }

    @GetMapping("/{id}/replies")
    @Operation(summary = "获取评论的回复")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getReplies(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        List<CommentResponse> replies = commentService.getReplies(id, userId);
        return ResponseEntity.ok(ApiResponse.success(replies));
    }

    @PostMapping
    @Operation(summary = "创建评论")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @Valid @RequestBody CreateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        CommentResponse comment = commentService.createComment(request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("评论创建成功", comment));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除评论")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        commentService.deleteComment(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("评论删除成功", null));
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "点赞/取消点赞评论")
    public ResponseEntity<ApiResponse<CommentResponse>> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        CommentResponse comment = commentService.toggleLike(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(comment));
    }
}
