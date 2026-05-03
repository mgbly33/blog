package com.blog.entity;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reports", indexes = {
    @Index(name = "idx_report_status", columnList = "status, createdAt")
})
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Column(name = "reporter_id", nullable = false)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long reporterId;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private TargetType targetType;

    public enum TargetType {
        BLOG, COMMENT, USER
    }

    @Column(name = "target_id", nullable = false)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long targetId;

    @Column(length = 100, nullable = false)
    private String reason; // 举报原因：垃圾广告、色情低俗等

    @Column(length = 512)
    private String description; // 详细描述

    @Column(length = 512)
    private String evidenceUrl; // 截图证据

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ReportStatus status = ReportStatus.PENDING;

    public enum ReportStatus {
        PENDING, RESOLVED, REJECTED
    }

    @Column(length = 500)
    private String adminReply; // 管理员处理回复

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime resolvedAt;
}
