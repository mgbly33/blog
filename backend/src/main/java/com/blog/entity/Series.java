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
@Table(name = "series", indexes = {
    @Index(name = "idx_series_author_updated", columnList = "authorId, updatedAt DESC")
})
public class Series {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(length = 512)
    private String coverUrl;

    @Column(name = "author_id", nullable = false)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long authorId;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.Ongoing;

    public enum Status {
        Ongoing, Completed
    }

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
