package com.blog.repository;

import com.blog.entity.Blog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long>, JpaSpecificationExecutor<Blog> {

        Page<Blog> findByStatusAndVisibility(Blog.Status status, Blog.Visibility visibility, Pageable pageable);

        @Modifying
        @Query("UPDATE Blog b SET b.views = b.views + 1 WHERE b.id = :id")
        void incrementViews(@Param("id") Long id);

        Page<Blog> findByAuthorId(Long authorId, Pageable pageable);

        List<Blog> findAllByAuthorId(Long authorId);

        /**
         * Query blogs by category with status and visibility
         */
        Page<Blog> findByCategoryIdAndStatusAndVisibility(
                        Long categoryId, Blog.Status status, Blog.Visibility visibility, Pageable pageable);

        /**
         * Query blogs by tag (requires join with blog_tags collection table)
         */
        @Query("SELECT b FROM Blog b WHERE :tagId MEMBER OF b.tags AND b.status = :status AND b.visibility = :visibility")
        Page<Blog> findByTagsContainingAndStatusAndVisibility(
                        @Param("tagId") Long tagId,
                        @Param("status") Blog.Status status,
                        @Param("visibility") Blog.Visibility visibility,
                        Pageable pageable);

        /**
         * Search public approved blogs across title, summary, raw_content, and content (supports Chinese & short queries)
         */
        @Query(value = "SELECT * FROM blogs WHERE status = 'APPROVED' AND visibility = 'PUBLIC' "
                        + "AND (LOWER(title) LIKE LOWER(CONCAT('%', :query, '%')) "
                        + "OR LOWER(COALESCE(summary, '')) LIKE LOWER(CONCAT('%', :query, '%')) "
                        + "OR LOWER(COALESCE(raw_content, content, '')) LIKE LOWER(CONCAT('%', :query, '%'))) "
                        + "ORDER BY is_sticky DESC, created_at DESC",
                countQuery = "SELECT COUNT(*) FROM blogs WHERE status = 'APPROVED' AND visibility = 'PUBLIC' "
                        + "AND (LOWER(title) LIKE LOWER(CONCAT('%', :query, '%')) "
                        + "OR LOWER(COALESCE(summary, '')) LIKE LOWER(CONCAT('%', :query, '%')) "
                        + "OR LOWER(COALESCE(raw_content, content, '')) LIKE LOWER(CONCAT('%', :query, '%')))",
                nativeQuery = true)
        Page<Blog> searchByText(@Param("query") String query, Pageable pageable);

        /**
         * Get sticky approved public blogs
         */
        List<Blog> findByIsStickyTrueAndStatusAndVisibilityOrderByCreatedAtDesc(
                        Blog.Status status, Blog.Visibility visibility);

        long countByAuthorId(Long authorId);

        long countByStatusAndVisibility(Blog.Status status, Blog.Visibility visibility);

        /**
         * Query blogs by author with status and visibility (for viewing others' blogs)
         */
        Page<Blog> findByAuthorIdAndStatusAndVisibility(
                        Long authorId, Blog.Status status, Blog.Visibility visibility, Pageable pageable);

        Page<Blog> findByIdIn(List<Long> ids, Pageable pageable);

        /**
         * 查找用户点赞过的博客
         */
        @Query("SELECT b FROM Blog b WHERE :userId MEMBER OF b.likes ORDER BY b.createdAt DESC")
        Page<Blog> findLikedByUserId(@Param("userId") Long userId, Pageable pageable);

        @Query("SELECT COUNT(b) FROM Blog b WHERE :userId MEMBER OF b.likes")
        long countLikedByUserId(@Param("userId") Long userId);

        @Query("SELECT b.id FROM Blog b JOIN b.likes l WHERE l = :userId")
        List<Long> findLikedBlogIdsByUserId(@Param("userId") Long userId);

        @Query("SELECT COUNT(l) FROM Blog b JOIN b.likes l WHERE b.authorId = :authorId")
        long countReceivedLikesByAuthorId(@Param("authorId") Long authorId);

        @Modifying
        @Query(value = "DELETE FROM blog_likes WHERE user_id = :userId", nativeQuery = true)
        void removeLikesByUserId(@Param("userId") Long userId);

        @Modifying
        @Query("UPDATE Blog b SET b.seriesId = null WHERE b.seriesId IN :seriesIds")
        void clearSeriesIds(@Param("seriesIds") List<Long> seriesIds);

        // 定时Publish查询
        List<Blog> findByStatusAndPublishAtBefore(Blog.Status status, java.time.LocalDateTime now);

        // 定时下线查询
        List<Blog> findByStatusAndUnpublishAtBefore(Blog.Status status, java.time.LocalDateTime now);

        // 系列文章查询
        List<Blog> findBySeriesIdOrderByChapterOrderAsc(Long seriesId);

        List<Blog> findBySeriesIdAndStatusAndVisibilityOrderByChapterOrderAsc(
                        Long seriesId, Blog.Status status, Blog.Visibility visibility);

        List<Blog> findBySeriesIdInOrderBySeriesIdAscChapterOrderAsc(List<Long> seriesIds);

        List<Blog> findBySeriesIdInAndStatusAndVisibilityOrderBySeriesIdAscChapterOrderAsc(
                        List<Long> seriesIds, Blog.Status status, Blog.Visibility visibility);

        // 数据看板 - 按日期统计新增博客数
        @Query(value = "SELECT DATE(created_at) as date, COUNT(*) as count FROM blogs WHERE created_at >= :since GROUP BY DATE(created_at) ORDER BY date", nativeQuery = true)
        List<Object[]> countByDateSince(@Param("since") LocalDateTime since);

        // 数据看板 - 按日期统计浏览量
        @Query(value = "SELECT DATE(created_at) as date, COALESCE(SUM(views), 0) as total_views FROM blogs WHERE created_at >= :since GROUP BY DATE(created_at) ORDER BY date", nativeQuery = true)
        List<Object[]> sumViewsByDateSince(@Param("since") LocalDateTime since);

        // 数据看板 - 总浏览量
        @Query("SELECT COALESCE(SUM(b.views), 0) FROM Blog b")
        long sumAllViews();

        // 数据看板 - 今日新增博客
        @Query(value = "SELECT COUNT(*) FROM blogs WHERE DATE(created_at) = CURDATE()", nativeQuery = true)
        long countTodayBlogs();
}
