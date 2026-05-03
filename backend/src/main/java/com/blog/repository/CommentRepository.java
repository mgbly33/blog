package com.blog.repository;

import com.blog.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    Page<Comment> findByBlogIdAndParentCommentIdIsNull(Long blogId, Pageable pageable);

    List<Comment> findByParentCommentId(Long parentCommentId);

    List<Comment> findByAuthorId(Long authorId);

    List<Comment> findByBlogIdIn(List<Long> blogIds);

    long countByBlogId(Long blogId);

    long countByAuthorId(Long authorId);

    @Modifying
    @Query("DELETE FROM Comment c WHERE c.blogId = :blogId")
    void deleteByBlogId(@Param("blogId") Long blogId);

    @Modifying
    @Query(value = "DELETE FROM comment_likes WHERE user_id = :userId", nativeQuery = true)
    void removeLikesByUserId(@Param("userId") Long userId);

    @Modifying
    @Query(value = "DELETE FROM comment_mentions WHERE user_id = :userId", nativeQuery = true)
    void removeMentionsByUserId(@Param("userId") Long userId);
}
