package com.blog.controller;

import com.blog.dto.ApiResponse;
import com.blog.entity.Report;
import com.blog.security.UserPrincipal;
import com.blog.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * 用户提交举报
     */
    @PostMapping("/api/reports")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createReport(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Report.TargetType targetType = Report.TargetType.valueOf(body.get("targetType"));
        Long targetId = Long.parseLong(body.get("targetId"));
        String reason = body.get("reason");
        String description = body.getOrDefault("description", null);
        String evidenceUrl = body.getOrDefault("evidenceUrl", null);

        if (reason == null || reason.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("请选择举报原因"));
        }

        Map<String, Object> report = reportService.createReport(
                currentUser.getId(), targetType, targetId, reason.trim(), description, evidenceUrl);
        return ResponseEntity.ok(ApiResponse.success("举报已提交，感谢您的反馈", report));
    }

    /**
     * 管理员获取举报列表
     */
    @GetMapping("/api/admin/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReports(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Report.ReportStatus reportStatus = status != null ? Report.ReportStatus.valueOf(status) : null;
        Map<String, Object> reports = reportService.getReports(reportStatus, page, size);
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    /**
     * 管理员处理举报
     */
    @PutMapping("/api/admin/reports/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleReport(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Report.ReportStatus status = Report.ReportStatus.valueOf(body.get("status"));
        String adminReply = body.getOrDefault("adminReply", null);

        Map<String, Object> report = reportService.handleReport(id, status, adminReply);
        return ResponseEntity.ok(ApiResponse.success("处理成功", report));
    }
}
