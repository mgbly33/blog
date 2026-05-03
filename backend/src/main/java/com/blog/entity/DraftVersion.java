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
@Table(name = "draft_versions", indexes = {
    @Index(name = "idx_draft_version", columnList = "draftId, versionNumber DESC"),
    @Index(name = "idx_draft_version_created", columnList = "createdAt")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_draft_version_no", columnNames = {"draftId", "versionNumber"})
})
public class DraftVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Column(name = "draft_id", nullable = false)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long draftId;

    @Column(length = 200)
    private String title;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    private Integer versionNumber;

    @Builder.Default
    private Integer wordCount = 0;

    public enum ChangeType {
        AUTO, MANUAL, RESTORE
    }

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ChangeType changeType = ChangeType.AUTO;

    @Embedded
    private Snapshot snapshot;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Embeddable
    public static class Snapshot {
        @Column(name = "snapshot_category_id")
        @JsonSerialize(using = ToStringSerializer.class)
        private Long categoryId;

        @Column(name = "snapshot_tags", length = 500)
        private String tags;  // JSON string of tag IDs

        @Column(name = "snapshot_visibility", length = 20)
        private String visibility;
    }
}
