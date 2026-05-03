package com.blog.service;

import com.blog.dto.OperationLogDto;
import com.blog.dto.PageDto;
import com.blog.entity.OperationLog;
import com.blog.entity.OperationLog.ActionType;
import com.blog.entity.OperationLog.TargetType;
import com.blog.repository.OperationLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OperationLogService {

    private final OperationLogRepository operationLogRepository;

    /**
     * Record an operation log asynchronously
     */
    @Async
    @Transactional
    public void logAsync(
        Long operatorId,
        String operatorName,
        ActionType actionType,
        TargetType targetType,
        Long targetId,
        String targetName,
        String description,
        HttpServletRequest request
    ) {
        try {
            OperationLog opLog = OperationLog.builder()
                .operatorId(operatorId)
                .operatorName(operatorName)
                .actionType(actionType)
                .targetType(targetType)
                .targetId(targetId)
                .targetName(targetName)
                .description(description)
                .ipAddress(getClientIpAddress(request))
                .userAgent(request != null ? request.getHeader("User-Agent") : null)
                .success(true)
                .build();

            operationLogRepository.save(opLog);
            log.debug("Operation logged: {} by {} on {}", actionType, operatorName, targetType);
        } catch (Exception e) {
            log.error("Failed to save operation log", e);
        }
    }

    /**
     * Record operation log synchronously (for critical operations)
     */
    @Transactional
    public OperationLog log(
        Long operatorId,
        String operatorName,
        ActionType actionType,
        TargetType targetType,
        Long targetId,
        String targetName,
        String description,
        HttpServletRequest request
    ) {
        OperationLog opLog = OperationLog.builder()
            .operatorId(operatorId)
            .operatorName(operatorName)
            .actionType(actionType)
            .targetType(targetType)
            .targetId(targetId)
            .targetName(targetName)
            .description(description)
            .ipAddress(getClientIpAddress(request))
            .userAgent(request != null ? request.getHeader("User-Agent") : null)
            .success(true)
            .build();

        return operationLogRepository.save(opLog);
    }

    /**
     * Record a failed operation
     */
    @Transactional
    public void logFailure(
        Long operatorId,
        String operatorName,
        ActionType actionType,
        TargetType targetType,
        Long targetId,
        String targetName,
        String description,
        String errorMessage,
        HttpServletRequest request
    ) {
        OperationLog opLog = OperationLog.builder()
            .operatorId(operatorId)
            .operatorName(operatorName)
            .actionType(actionType)
            .targetType(targetType)
            .targetId(targetId)
            .targetName(targetName)
            .description(description)
            .ipAddress(getClientIpAddress(request))
            .userAgent(request != null ? request.getHeader("User-Agent") : null)
            .success(false)
            .errorMessage(errorMessage)
            .build();

        operationLogRepository.save(opLog);
    }

    /**
     * Get logs with filters and pagination
     */
    @Transactional(readOnly = true)
    public PageDto<OperationLogDto> getLogs(
        Long operatorId,
        ActionType actionType,
        TargetType targetType,
        LocalDate startDate,
        LocalDate endDate,
        Boolean success,
        int page,
        int size
    ) {
        Pageable pageable = PageRequest.of(page, size);

        LocalDateTime startDateTime = startDate != null
            ? startDate.atStartOfDay()
            : null;

        LocalDateTime endDateTime = endDate != null
            ? endDate.atTime(LocalTime.MAX)
            : null;

        Page<OperationLog> logPage = operationLogRepository.findByFilters(
            operatorId,
            actionType,
            targetType,
            startDateTime,
            endDateTime,
            success,
            pageable
        );

        return toPageDto(logPage);
    }

    /**
     * Search logs by keyword
     */
    @Transactional(readOnly = true)
    public PageDto<OperationLogDto> searchLogs(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<OperationLog> logPage = operationLogRepository.searchByKeyword(keyword, pageable);
        return toPageDto(logPage);
    }

    /**
     * Get recent logs for dashboard
     */
    @Transactional(readOnly = true)
    public List<OperationLogDto> getRecentLogs() {
        return operationLogRepository.findTop10ByOrderByCreatedAtDesc()
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    /**
     * Get log statistics
     */
    @Transactional(readOnly = true)
    public LogStatistics getStatistics() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        return LogStatistics.builder()
            .totalLogs(operationLogRepository.count())
            .logsToday(operationLogRepository.countToday(startOfDay))
            .failedLogs(operationLogRepository.countBySuccessFalse())
            .loginCount(operationLogRepository.countByActionType(ActionType.LOGIN))
            .build();
    }

    /**
     * Extract client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String[] headers = {
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED"
        };

        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // Take first IP if multiple
                return ip.split(",")[0].trim();
            }
        }

        return request.getRemoteAddr();
    }

    private PageDto<OperationLogDto> toPageDto(Page<OperationLog> page) {
        return PageDto.<OperationLogDto>builder()
            .content(page.getContent().stream().map(this::toDto).collect(Collectors.toList()))
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .first(page.isFirst())
            .last(page.isLast())
            .build();
    }

    private OperationLogDto toDto(OperationLog log) {
        return OperationLogDto.builder()
            .id(log.getId())
            .operatorId(log.getOperatorId())
            .operatorName(log.getOperatorName())
            .actionType(log.getActionType().name())
            .targetType(log.getTargetType() != null ? log.getTargetType().name() : null)
            .targetId(log.getTargetId())
            .targetName(log.getTargetName())
            .description(log.getDescription())
            .ipAddress(log.getIpAddress())
            .success(log.getSuccess())
            .errorMessage(log.getErrorMessage())
            .createdAt(log.getCreatedAt())
            .build();
    }

    @lombok.Builder
    @lombok.Data
    public static class LogStatistics {
        private long totalLogs;
        private long logsToday;
        private long failedLogs;
        private long loginCount;
    }
}
