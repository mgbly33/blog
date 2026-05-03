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
@Table(name = "messages", indexes = {
    @Index(name = "idx_message_chat", columnList = "senderId, receiverId, createdAt"),
    @Index(name = "idx_message_receiver_unread", columnList = "receiverId, isRead")
})
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Column(name = "sender_id", nullable = false)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long senderId;

    @Column(name = "receiver_id", nullable = false)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long receiverId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MessageType type = MessageType.TEXT;

    public enum MessageType {
        TEXT, IMAGE, SYSTEM
    }

    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
