package com.blog.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public class CommentDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "评论内容不能为空")
        @Size(max = 2000, message = "评论内容长度不能超过2000个字符")
        private String content;

        @NotNull(message = "文章ID不能为空")
        private Long blogId;

        private Long parentCommentId;
        private Set<Long> mentions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @Size(max = 2000, message = "评论内容长度不能超过2000个字符")
        private String content;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommentResponse {
        @JsonSerialize(using = ToStringSerializer.class)
        private Long id;
        @JsonSerialize(using = ToStringSerializer.class)
        private Long blogId;
        private String content;
        private AuthorInfo author;
        @JsonSerialize(using = ToStringSerializer.class)
        private Long parentCommentId;
        private Set<Long> mentions;
        private Integer replyCount;
        private Integer likesCount;
        private Boolean isLiked;
        private LocalDateTime createdAt;
        private List<CommentResponse> replies;
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
