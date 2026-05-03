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
import java.util.HashSet;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "blogs", indexes = {
    @Index(name = "idx_blog_status_visibility_created", columnList = "status, visibility, createdAt DESC"),
    @Index(name = "idx_blog_author_status", columnList = "authorId, status"),
    @Index(name = "idx_blog_sticky_created", columnList = "isSticky DESC, createdAt DESC"),
    @Index(name = "idx_blog_category_status", columnList = "categoryId, status"),
    @Index(name = "idx_blog_views", columnList = "views DESC"),
    @Index(name = "idx_blog_created_at", columnList = "createdAt DESC"),
    @Index(name = "idx_blog_series", columnList = "seriesId, chapterOrder"),
    @Index(name = "idx_blog_schedule", columnList = "status, publishAt, unpublishAt")
})
public class Blog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Version
    private Long version;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(length = 512)
    private String image;

    @Column(name = "category_id")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long categoryId;

    public enum Visibility {
        PUBLIC, PRIVATE
    }

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Visibility visibility = Visibility.PUBLIC;

    public enum Status {
        PENDING, APPROVED, REJECTED, SCHEDULED, ARCHIVED
    }

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.PENDING;

    @Column(name = "publish_at")
    private LocalDateTime publishAt;

    @Column(name = "unpublish_at")
    private LocalDateTime unpublishAt;

    @Column(name = "series_id")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long seriesId;

    @Column(name = "chapter_order")
    private Integer chapterOrder;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "blog_tags", joinColumns = @JoinColumn(name = "blog_id"))
    @Column(name = "tag_id")
    private Set<Long> tags = new HashSet<>();

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String rawContent;

    @Column(length = 500)
    private String summary;

    @Builder.Default
    private Integer readTime = 1;

    @Builder.Default
    private Integer collectCount = 0;

    @Builder.Default
    private Integer commentCount = 0;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "blog_likes", joinColumns = @JoinColumn(name = "blog_id"))
    @Column(name = "user_id")
    private Set<Long> likes = new HashSet<>();

    @Builder.Default
    private Integer likesCount = 0;

    @Column(name = "author_id", nullable = false)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long authorId;

    @Builder.Default
    private Integer views = 0;

    @Builder.Default
    private Boolean isSticky = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public int calculateReadTime() {
        if (content == null) return 1;
        int wordsPerMinute = 200;
        int wordCount = content.split("\\s+").length;
        this.readTime = Math.max(1, (int) Math.ceil((double) wordCount / wordsPerMinute));
        return this.readTime;
    }

    public String generateSummary() {
        if (this.rawContent != null) {
            String plainText = this.rawContent.replaceAll("[#*`>\\[\\]()]", "").trim();
            this.summary = plainText.length() > 200 ? plainText.substring(0, 200) : plainText;
        }
        return this.summary;
    }

    public void syncLikesCount() {
        this.likesCount = this.likes != null ? this.likes.size() : 0;
    }
}
