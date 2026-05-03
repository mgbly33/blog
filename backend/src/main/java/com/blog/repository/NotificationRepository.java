package com.blog.repository;

import com.blog.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId, Pageable pageable);

    long countByRecipientIdAndIsReadFalse(Long recipientId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.recipientId = :recipientId")
    void deleteByRecipientId(@Param("recipientId") Long recipientId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.recipientId = :userId OR n.senderId = :userId")
    void deleteByUserInvolved(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.relatedBlogId IN :blogIds")
    void deleteByRelatedBlogIdIn(@Param("blogIds") List<Long> blogIds);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipientId = :recipientId AND n.isRead = false")
    int markAllAsRead(@Param("recipientId") Long recipientId);
}
