package com.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class CategoryDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "分类名称不能为空")
        @Size(max = 50, message = "分类名称长度不能超过50个字符")
        private String name;
        private Integer order;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @Size(max = 50, message = "分类名称长度不能超过50个字符")
        private String name;
        private Integer order;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryResponse {
        private String id;
        private String name;
        private Integer order;
        private Long blogCount;
        private LocalDateTime createdAt;
    }
}
