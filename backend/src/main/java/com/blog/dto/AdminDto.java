package com.blog.dto;

import com.blog.entity.Blog;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AdminDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardStats {
        private Long totalUsers;
        private Long totalBlogs;
        private Long totalComments;
        private Long pendingBlogs;
        private Long bannedUsers;
        private Long todayViews;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlogApprovalRequest {
        @NotNull(message = "审核状态不能为空")
        private Blog.Status status;
        private String rejectReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserBanRequest {
        private Boolean banned;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlogAdminView {
        @JsonSerialize(using = ToStringSerializer.class)
        private Long id;
        private String title;
        private String summary;
        private AuthorInfo author;
        private Blog.Status status;
        private Blog.Visibility visibility;
        private Integer views;
        private Integer likesCount;
        private Integer commentCount;
        private java.time.LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthorInfo {
        @JsonSerialize(using = ToStringSerializer.class)
        private Long id;
        private String username;
        private String avatar;
    }
}
