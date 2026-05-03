package com.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class TagDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "标签名称不能为空")
        @Size(max = 30, message = "标签名称长度不能超过30个字符")
        private String name;
        private String description;
        private String color;
        private String icon;
        private Boolean isHot;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @Size(max = 30, message = "标签名称长度不能超过30个字符")
        private String name;
        private String description;
        private String color;
        private String icon;
        private Boolean isHot;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TagResponse {
        private String id;
        private String name;
        private String description;
        private String color;
        private String icon;
        private Integer count;
        private Boolean isHot;
        private LocalDateTime createdAt;
    }
}
