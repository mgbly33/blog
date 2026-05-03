package com.blog.dto;

import com.blog.entity.Draft;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

public class DraftDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaveRequest {
        @Size(max = 200, message = "标题长度不能超过200个字符")
        private String title;
        private String content;
        private Long categoryId;
        private Set<Long> tags;
        private Draft.Visibility visibility;
        private String image;
        private Long blogId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DraftResponse {
        @JsonSerialize(using = ToStringSerializer.class)
        private Long id;
        private String title;
        private String content;
        @JsonSerialize(using = ToStringSerializer.class)
        private Long categoryId;
        private Set<Long> tags;
        private Draft.Visibility visibility;
        private String image;
        @JsonSerialize(using = ToStringSerializer.class)
        private Long blogId;
        private Integer currentVersion;
        private Integer wordCount;
        private String summary;
        private LocalDateTime lastSavedAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DraftListItem {
        @JsonSerialize(using = ToStringSerializer.class)
        private Long id;
        private String title;
        private String summary;
        private Integer wordCount;
        private Boolean isNew;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VersionResponse {
        @JsonSerialize(using = ToStringSerializer.class)
        private Long id;
        @JsonSerialize(using = ToStringSerializer.class)
        private Long draftId;
        private Integer version;
        private String title;
        private String content;
        private Integer wordCount;
        private LocalDateTime createdAt;
    }
}
