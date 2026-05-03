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
@Table(name = "comments", indexes = {
    @Index(name = "idx_comment_blog_created", columnList = "blogId, createdAt DESC"),
    @Index(name = "idx_comment_author", columnList = "authorId"),
    @Index(name = "idx_comment_parent", columnList = "parentCommentId")
})
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Column(name = "blog_id", nullable = false)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long blogId;

    @Lob
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "author_id", nullable = false)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long authorId;

    @Column(name = "parent_comment_id")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long parentCommentId;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "comment_mentions", joinColumns = @JoinColumn(name = "comment_id"))
    @Column(name = "user_id")
    private Set<Long> mentions = new HashSet<>();

    @Builder.Default
    private Integer replyCount = 0;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "comment_likes", joinColumns = @JoinColumn(name = "comment_id"))
    @Column(name = "user_id")
    private Set<Long> likes = new HashSet<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
