package com.blog.dto;

import com.blog.entity.Blog;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

public class BlogDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "标题不能为空")
        @Size(max = 200, message = "标题长度不能超过200个字符")
        private String title;

        @NotBlank(message = "内容不能为空")
        private String content;

        private String rawContent;
        private String image;
        private Long categoryId;
        private Set<Long> tags;
        private Blog.Visibility visibility;
        private String publishAt;
        private String unpublishAt;
        private Long seriesId;
        private Integer chapterOrder;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @Size(max = 200, message = "标题长度不能超过200个字符")
        private String title;
        private String content;
        private String rawContent;
        private String image;
        private Long categoryId;
        private Set<Long> tags;
        private Blog.Visibility visibility;
        private String publishAt;
        private String unpublishAt;
        private Long seriesId;
        private Integer chapterOrder;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlogResponse {
        @JsonSerialize(using = ToStringSerializer.class)
        private Long id;
        private String title;
        private String content;
        private String rawContent;
        private String summary;
        private String image;
        @JsonSerialize(using = ToStringSerializer.class)
        private Long categoryId;
        private Set<Long> tags;
        private Blog.Visibility visibility;
        private Blog.Status status;
        private Integer readTime;
        private Integer views;
        private Integer likesCount;
        private Integer collectCount;
        private Integer commentCount;
        private Boolean isSticky;
        private AuthorInfo author;
        private LocalDateTime createdAt;
        private LocalDateTime publishAt;
        private LocalDateTime unpublishAt;
        @JsonSerialize(using = ToStringSerializer.class)
        private Long seriesId;
        private Integer chapterOrder;
        private Boolean isLiked;
        private Boolean isBookmarked;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlogListItem {
        @JsonSerialize(using = ToStringSerializer.class)
        private Long id;
        private String title;
        private String summary;
        private String image;
        @JsonSerialize(using = ToStringSerializer.class)
        private Long categoryId;
        private Set<Long> tags;
        private Blog.Status status;
        private Integer readTime;
        private Integer views;
        private Integer likesCount;
        private Integer commentCount;
        private Boolean isSticky;
        private AuthorInfo author;
        private LocalDateTime createdAt;
        private LocalDateTime publishAt;
        @JsonSerialize(using = ToStringSerializer.class)
        private Long seriesId;
        private Integer chapterOrder;
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
