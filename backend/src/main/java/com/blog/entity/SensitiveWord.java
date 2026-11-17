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
@Table(name = "sensitive_words", indexes = {
    @Index(name = "idx_sensitive_word", columnList = "word")
})
public class SensitiveWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String word;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Level level = Level.BLOCK;

    public enum Level {
        WARN, BLOCK, REVIEW
    }

    @Column(length = 200)
    private String category; // 政治、色情、广告等

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
