package com.blog.repository;

import com.blog.entity.UserReadHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserReadHistoryRepository extends JpaRepository<UserReadHistory, Long> {

    Optional<UserReadHistory> findByUserIdAndBlogId(Long userId, Long blogId);

    Page<UserReadHistory> findByUserIdOrderByLastReadAtDesc(Long userId, Pageable pageable);

    void deleteByUserIdAndBlogId(Long userId, Long blogId);

    @Modifying
    @Query(value = """
            INSERT INTO user_read_history (user_id, blog_id, progress_percentage, scroll_position, last_read_at)
            VALUES (:userId, :blogId, :progress, :scrollPosition, NOW())
            ON DUPLICATE KEY UPDATE
              progress_percentage = VALUES(progress_percentage),
              scroll_position = VALUES(scroll_position),
              last_read_at = NOW()
            """, nativeQuery = true)
    void upsertProgress(@Param("userId") Long userId,
                        @Param("blogId") Long blogId,
                        @Param("progress") Integer progress,
                        @Param("scrollPosition") Integer scrollPosition);
}
