package com.blog.controller;

import com.blog.dto.ApiResponse;
import com.blog.dto.OperationLogDto;
import com.blog.dto.PageDto;
import com.blog.entity.OperationLog.ActionType;
import com.blog.entity.OperationLog.TargetType;
import com.blog.service.OperationLogService;
import com.blog.service.OperationLogService.LogStatistics;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/logs")
@RequiredArgsConstructor
@Tag(name = "操作日志", description = "管理员操作日志管理")
public class OperationLogController {

    private final OperationLogService operationLogService;

    @GetMapping
    @Operation(summary = "按条件获取操作日志")
    public ResponseEntity<ApiResponse<PageDto<OperationLogDto>>> getLogs(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) Long operatorId,
        @RequestParam(required = false) String actionType,
        @RequestParam(required = false) String targetType,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(required = false) Boolean success
    ) {
        ActionType action = actionType != null ? ActionType.valueOf(actionType) : null;
        TargetType target = targetType != null ? TargetType.valueOf(targetType) : null;

        PageDto<OperationLogDto> logs = operationLogService.getLogs(
            operatorId,
            action,
            target,
            startDate,
            endDate,
            success,
            page,
            size
        );

        return ResponseEntity.ok(ApiResponse.success("获取操作日志成功", logs));
    }

    @GetMapping("/search")
    @Operation(summary = "按关键词搜索操作日志")
    public ResponseEntity<ApiResponse<PageDto<OperationLogDto>>> searchLogs(
        @RequestParam String keyword,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        PageDto<OperationLogDto> logs = operationLogService.searchLogs(keyword, page, size);
        return ResponseEntity.ok(ApiResponse.success("搜索操作日志成功", logs));
    }

    @GetMapping("/recent")
    @Operation(summary = "获取仪表盘最近操作日志")
    public ResponseEntity<ApiResponse<List<OperationLogDto>>> getRecentLogs() {
        List<OperationLogDto> logs = operationLogService.getRecentLogs();
        return ResponseEntity.ok(ApiResponse.success("获取最近操作日志成功", logs));
    }

    @GetMapping("/statistics")
    @Operation(summary = "获取操作日志统计")
    public ResponseEntity<ApiResponse<LogStatistics>> getStatistics() {
        LogStatistics stats = operationLogService.getStatistics();
        return ResponseEntity.ok(ApiResponse.success("获取日志统计成功", stats));
    }

    @GetMapping("/action-types")
    @Operation(summary = "获取全部操作类型")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getActionTypes() {
        List<Map<String, String>> types = Arrays.stream(ActionType.values())
            .map(type -> Map.of(
                "value", type.name(),
                "label", formatActionTypeLabel(type)
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("获取操作类型成功", types));
    }

    @GetMapping("/target-types")
    @Operation(summary = "获取全部目标类型")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getTargetTypes() {
        List<Map<String, String>> types = Arrays.stream(TargetType.values())
            .map(type -> Map.of(
                "value", type.name(),
                "label", formatTargetTypeLabel(type)
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("获取目标类型成功", types));
    }

    private String formatActionTypeLabel(ActionType actionType) {
        switch (actionType) {
            case LOGIN:
                return "登录";
            case LOGOUT:
                return "登出";
            case REGISTER:
                return "注册";
            case PASSWORD_CHANGE:
                return "修改密码";
            case BLOG_CREATE:
                return "创建文章";
            case BLOG_UPDATE:
                return "更新文章";
            case BLOG_DELETE:
                return "删除文章";
            case BLOG_PUBLISH:
                return "发布文章";
            case USER_UPDATE:
                return "更新用户";
            case USER_BAN:
                return "封禁用户";
            case USER_UNBAN:
                return "解除封禁";
            case USER_DELETE:
                return "删除用户";
            case USER_PROMOTE:
                return "提升权限";
            case USER_DEMOTE:
                return "降低权限";
            case CATEGORY_CREATE:
                return "创建分类";
            case CATEGORY_UPDATE:
                return "更新分类";
            case CATEGORY_DELETE:
                return "删除分类";
            case TAG_CREATE:
                return "创建标签";
            case TAG_UPDATE:
                return "更新标签";
            case TAG_DELETE:
                return "删除标签";
            case COMMENT_CREATE:
                return "创建评论";
            case COMMENT_DELETE:
                return "删除评论";
            case DRAFT_CREATE:
                return "创建草稿";
            case DRAFT_UPDATE:
                return "更新草稿";
            case DRAFT_DELETE:
                return "删除草稿";
            case SYSTEM_CONFIG:
                return "系统配置";
            case OTHER:
                return "其他";
            default:
                return actionType.name();
        }
    }

    private String formatTargetTypeLabel(TargetType targetType) {
        switch (targetType) {
            case USER:
                return "用户";
            case BLOG:
                return "文章";
            case COMMENT:
                return "评论";
            case CATEGORY:
                return "分类";
            case TAG:
                return "标签";
            case DRAFT:
                return "草稿";
            case SYSTEM:
                return "系统";
            default:
                return targetType.name();
        }
    }
}
