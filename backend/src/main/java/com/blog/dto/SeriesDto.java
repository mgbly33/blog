package com.blog.dto;

import com.blog.entity.Series;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class SeriesDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "标题不能为空")
        @Size(max = 100, message = "标题长度不能超过100个字符")
        private String title;

        @Size(max = 500)
        private String description;

        private String coverUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @Size(max = 100, message = "标题长度不能超过100个字符")
        private String title;

        @Size(max = 500)
        private String description;

        private String coverUrl;
        private Series.Status status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        @JsonSerialize(using = ToStringSerializer.class)
        private Long id;
        private String title;
        private String description;
        private String coverUrl;
        private Series.Status status;
        private BlogDto.AuthorInfo author;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<BlogDto.BlogListItem> posts;
    }
}
