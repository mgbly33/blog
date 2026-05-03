package com.blog.repository;

import com.blog.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    Page<User> findByUsernameContainingIgnoreCase(String username, Pageable pageable);

    long countByIsBannedTrue();

    // 数据看板 - 按日期统计新增用户数
    @Query(value = "SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at >= :since GROUP BY DATE(created_at) ORDER BY date", nativeQuery = true)
    List<Object[]> countByDateSince(@Param("since") java.time.LocalDateTime since);

    // 数据看板 - 今日新增用户
    @Query(value = "SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()", nativeQuery = true)
    long countTodayUsers();

    /**
     * Remove user from all users' following sets (for user deletion cleanup)
     */
    @Modifying
    @Query(value = "DELETE FROM user_following WHERE following_id = :userId", nativeQuery = true)
    void removeFromAllFollowing(@Param("userId") Long userId);

    /**
     * Remove user from all users' followers sets (for user deletion cleanup)
     */
    @Modifying
    @Query(value = "DELETE FROM user_followers WHERE follower_id = :userId", nativeQuery = true)
    void removeFromAllFollowers(@Param("userId") Long userId);

    @Modifying
    @Query(value = "DELETE FROM user_bookmarks WHERE blog_id IN (:blogIds)", nativeQuery = true)
    void removeBookmarksForBlogs(@Param("blogIds") List<Long> blogIds);
}
