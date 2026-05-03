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
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_username", columnList = "username"),
    @Index(name = "idx_user_is_admin", columnList = "isAdmin"),
    @Index(name = "idx_user_is_banned", columnList = "isBanned")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Builder.Default
    @Column(length = 512)
    private String avatar = "";

    @Builder.Default
    @Column(length = 500)
    private String bio = "这位用户很懒，什么都没写。";

    @Builder.Default
    private Boolean isAdmin = false;

    @Builder.Default
    private Boolean isBanned = false;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "user_bookmarks", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "blog_id")
    private Set<Long> bookmarks = new HashSet<>();

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "user_following", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "following_id")
    private Set<Long> following = new HashSet<>();

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "user_followers", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "follower_id")
    private Set<Long> followers = new HashSet<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public void generateDefaultAvatar() {
        if (this.avatar == null || this.avatar.isEmpty()) {
            String randomColor = Integer.toHexString((int) (Math.random() * 16777215));
            this.avatar = String.format(
                "https://ui-avatars.com/api/?name=%s&background=%s&color=fff&size=128",
                this.username,
                randomColor
            );
        }
    }
}
