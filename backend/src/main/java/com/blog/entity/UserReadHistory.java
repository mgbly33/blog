package com.blog.entity;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_read_history", uniqueConstraints = {
    @UniqueConstraint(name = "uk_read_history_user_blog", columnNames = {"userId", "blogId"})
}, indexes = {
    @Index(name = "idx_read_history_user_time", columnList = "userId, lastReadAt DESC")
})
public class UserReadHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Column(name = "user_id", nullable = false)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long userId;

    @Column(name = "blog_id", nullable = false)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long blogId;

    @Column(name = "progress_percentage")
    private Integer progress; // 0-100

    @Column(name = "scroll_position")
    private Integer scrollPosition; // Y-axis pixel

    @UpdateTimestamp
    private LocalDateTime lastReadAt;
}
