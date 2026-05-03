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
import java.util.HashSet;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "drafts", indexes = {
    @Index(name = "idx_draft_author_updated", columnList = "authorId, updatedAt DESC"),
    @Index(name = "idx_draft_blog_id", columnList = "blogId")
})
public class Draft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Builder.Default
    @Column(length = 200)
    private String title = "";

    @Builder.Default
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String content = "";

    @Column(name = "category_id")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long categoryId;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "draft_tags", joinColumns = @JoinColumn(name = "draft_id"))
    @Column(name = "tag_id")
    private Set<Long> tags = new HashSet<>();

    public enum Visibility {
        PUBLIC, PRIVATE
    }

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Visibility visibility = Visibility.PUBLIC;

    @Column(length = 512)
    private String image;

    @Column(name = "author_id", nullable = false)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long authorId;

    @Column(name = "blog_id")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long blogId;

    private LocalDateTime lastSavedAt;

    @Builder.Default
    private Integer currentVersion = 1;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public boolean isNewDraft() {
        return this.blogId == null;
    }

    public int getWordCount() {
        if (content == null) return 0;
        return content.replaceAll("\\s+", "").length();
    }

    public String getSummary() {
        if (content == null || content.isEmpty()) return "";
        String plainText = content.replaceAll("[#*`>\\[\\]()]", "").trim();
        return plainText.length() > 100 ? plainText.substring(0, 100) : plainText;
    }
}
