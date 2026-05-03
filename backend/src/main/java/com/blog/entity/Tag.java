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
@Table(name = "tags", indexes = {
    @Index(name = "idx_tag_name", columnList = "name"),
    @Index(name = "idx_tag_count", columnList = "count DESC"),
    @Index(name = "idx_tag_hot_count", columnList = "isHot DESC, count DESC")
})
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String name;

    @Builder.Default
    @Column(length = 500)
    private String description = "";

    @Builder.Default
    @Column(length = 20)
    private String color = "#007bff";

    @Builder.Default
    @Column(length = 100)
    private String icon = "";

    @Builder.Default
    private Integer count = 0;

    @Builder.Default
    private Boolean isHot = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
