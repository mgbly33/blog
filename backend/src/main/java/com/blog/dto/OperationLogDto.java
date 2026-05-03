package com.blog.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for operation log responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationLogDto {

    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long operatorId;

    private String operatorName;

    private String actionType;

    private String targetType;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long targetId;

    private String targetName;

    private String description;

    private String ipAddress;

    private Boolean success;

    private String errorMessage;

    private LocalDateTime createdAt;
}
