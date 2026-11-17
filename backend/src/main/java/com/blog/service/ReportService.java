package com.blog.service;

import com.blog.dto.ApiResponse;
import com.blog.dto.BlogDto.AuthorInfo;
import com.blog.entity.Report;
import com.blog.entity.User;
import com.blog.exception.ResourceNotFoundException;
import com.blog.repository.ReportRepository;
import com.blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    /**
     * 提交举报
     */
    @Transactional
    public Map<String, Object> createReport(Long reporterId, Report.TargetType targetType,
                                             Long targetId, String reason, String description, String evidenceUrl) {
        Report report = Report.builder()
                .reporterId(reporterId)
                .targetType(targetType)
                .targetId(targetId)
                .reason(reason)
                .description(description)
                .evidenceUrl(evidenceUrl)
                .build();

        Report saved = reportRepository.save(report);
        return toReportMap(saved);
    }

    /**
     * 管理员获取举报列表
     */
    public Map<String, Object> getReports(Report.ReportStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Report> reports;

        if (status != null) {
            reports = reportRepository.findByStatus(status, pageable);
        } else {
            reports = reportRepository.findAll(pageable);
        }

        // 批量获取举报者信息
        Set<Long> reporterIds = reports.getContent().stream()
                .map(Report::getReporterId)
                .collect(Collectors.toSet());
        Map<Long, User> userMap = userRepository.findAllById(reporterIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<Map<String, Object>> items = reports.getContent().stream().map(r -> {
            Map<String, Object> item = toReportMap(r);
            User reporter = userMap.get(r.getReporterId());
            if (reporter != null) {
                item.put("reporter", AuthorInfo.builder()
                        .id(reporter.getId())
                        .username(reporter.getUsername())
                        .avatar(reporter.getAvatar())
                        .build());
            }
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", items);
        result.put("page", reports.getNumber());
        result.put("size", reports.getSize());
        result.put("totalElements", reports.getTotalElements());
        result.put("totalPages", reports.getTotalPages());
        result.put("first", reports.isFirst());
        result.put("last", reports.isLast());
        return result;
    }

    /**
     * 管理员处理举报
     */
    @Transactional
    public Map<String, Object> handleReport(Long reportId, Report.ReportStatus status, String adminReply) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("举报不存在"));

        report.setStatus(status);
        report.setAdminReply(adminReply);
        report.setResolvedAt(java.time.LocalDateTime.now());
        Report updated = reportRepository.save(report);
        return toReportMap(updated);
    }

    private Map<String, Object> toReportMap(Report r) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", String.valueOf(r.getId()));
        map.put("reporterId", String.valueOf(r.getReporterId()));
        map.put("targetType", r.getTargetType());
        map.put("targetId", String.valueOf(r.getTargetId()));
        map.put("reason", r.getReason());
        map.put("description", r.getDescription());
        map.put("evidenceUrl", r.getEvidenceUrl());
        map.put("status", r.getStatus());
        map.put("adminReply", r.getAdminReply());
        map.put("createdAt", r.getCreatedAt());
        map.put("resolvedAt", r.getResolvedAt());
        return map;
    }
}
