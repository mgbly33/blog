package com.blog.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ReadHistoryDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateProgressRequest {
        @NotNull(message = "progress 不能为空")
        @Min(value = 0, message = "progress 不能小于 0")
        @Max(value = 100, message = "progress 不能大于 100")
        private Integer progress;

        @NotNull(message = "scrollPosition 不能为空")
        @Min(value = 0, message = "scrollPosition 不能小于 0")
        private Integer scrollPosition;
    }
}
