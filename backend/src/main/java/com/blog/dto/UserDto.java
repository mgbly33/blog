package com.blog.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class UserDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateProfileRequest {
        @Size(max = 200, message = "简介长度不能超过200个字符")
        private String bio;
        private String avatar;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserProfile {
        @JsonSerialize(using = ToStringSerializer.class)
        private Long id;
        private String username;
        private String avatar;
        private String bio;
        private Boolean isAdmin;
        private Integer blogCount;
        private Integer likeCount;
        private Integer likedCount;
        private Integer receivedLikeCount;
        private Integer bookmarkCount;
        private Integer followerCount;
        private Integer followingCount;
        private Boolean isFollowing;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserListItem {
        @JsonSerialize(using = ToStringSerializer.class)
        private Long id;
        private String username;
        private String avatar;
        private String bio;
        private Boolean isAdmin;
        private Boolean isBanned;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationResponse {
        @JsonSerialize(using = ToStringSerializer.class)
        private Long id;
        private String type;
        private String content;
        private SenderInfo sender;
        @JsonSerialize(using = ToStringSerializer.class)
        private Long relatedBlogId;
        @JsonSerialize(using = ToStringSerializer.class)
        private Long relatedCommentId;
        private Boolean isRead;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SenderInfo {
        @JsonSerialize(using = ToStringSerializer.class)
        private Long id;
        private String username;
        private String avatar;
    }
}
