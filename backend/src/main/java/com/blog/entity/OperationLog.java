package com.blog.entity;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Operation log entity for audit trail
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "operation_logs", indexes = {
    @Index(name = "idx_oplog_operator_id", columnList = "operatorId"),
    @Index(name = "idx_oplog_action_type", columnList = "actionType"),
    @Index(name = "idx_oplog_created_at", columnList = "createdAt"),
    @Index(name = "idx_oplog_target_type", columnList = "targetType")
})
public class OperationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    /**
     * Operator user ID (null for anonymous actions)
     */
    @JsonSerialize(using = ToStringSerializer.class)
    private Long operatorId;

    /**
     * Operator username for display purposes
     */
    @Column(length = 50)
    private String operatorName;

    /**
     * Type of action performed
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ActionType actionType;

    /**
     * Type of target entity
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private TargetType targetType;

    /**
     * Target entity ID
     */
    @JsonSerialize(using = ToStringSerializer.class)
    private Long targetId;

    /**
     * Target entity name/title for display
     */
    @Column(length = 255)
    private String targetName;

    /**
     * Detailed description of the operation
     */
    @Column(length = 500)
    private String description;

    /**
     * IP address of the requester
     */
    @Column(length = 45)
    private String ipAddress;

    /**
     * User agent string
     */
    @Column(length = 500)
    private String userAgent;

    /**
     * Whether the operation was successful
     */
    @Builder.Default
    private Boolean success = true;

    /**
     * Error message if operation failed
     */
    @Column(length = 500)
    private String errorMessage;

    /**
     * Additional metadata as JSON string
     */
    @Column(columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    /**
     * Supported action types
     */
    public enum ActionType {
        // Auth actions
        LOGIN,
        LOGOUT,
        REGISTER,
        PASSWORD_CHANGE,

        // Blog actions
        BLOG_CREATE,
        BLOG_UPDATE,
        BLOG_DELETE,
        BLOG_PUBLISH,

        // User actions
        USER_UPDATE,
        USER_BAN,
        USER_UNBAN,
        USER_DELETE,
        USER_PROMOTE,
        USER_DEMOTE,

        // Admin actions
        CATEGORY_CREATE,
        CATEGORY_UPDATE,
        CATEGORY_DELETE,
        TAG_CREATE,
        TAG_UPDATE,
        TAG_DELETE,

        // Comment actions
        COMMENT_CREATE,
        COMMENT_DELETE,

        // Draft actions
        DRAFT_CREATE,
        DRAFT_UPDATE,
        DRAFT_DELETE,

        // System actions
        SYSTEM_CONFIG,
        OTHER
    }

    /**
     * Target entity types
     */
    public enum TargetType {
        USER,
        BLOG,
        COMMENT,
        CATEGORY,
        TAG,
        DRAFT,
        SYSTEM
    }
}
