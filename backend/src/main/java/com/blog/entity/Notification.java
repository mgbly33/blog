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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notification_recipient_read_created", columnList = "recipientId, isRead, createdAt DESC")
})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Column(name = "recipient_id", nullable = false)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long recipientId;

    @Column(name = "sender_id")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long senderId;

    public enum NotificationType {
        LIKE, COMMENT, FOLLOW, MENTION, REPLY, SYSTEM
    }

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private NotificationType type;

    @Column(length = 500)
    private String content;

    @Column(name = "related_blog_id")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long relatedBlogId;

    @Column(name = "related_comment_id")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long relatedCommentId;

    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
