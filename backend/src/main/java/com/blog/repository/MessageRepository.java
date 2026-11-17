package com.blog.repository;

import com.blog.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByReceiverIdOrderByCreatedAtDesc(Long receiverId, Pageable pageable);

    Page<Message> findByReceiverIdAndIsReadFalseOrderByCreatedAtDesc(Long receiverId, Pageable pageable);

    long countByReceiverIdAndIsReadFalse(Long receiverId);

    long countBySenderIdAndReceiverIdAndIsReadFalse(Long senderId, Long receiverId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.receiverId = :userId AND m.isRead = false")
    void markAllAsRead(Long userId);

    @Query("SELECT m FROM Message m WHERE " +
            "(m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
            "(m.senderId = :userId2 AND m.receiverId = :userId1) " +
            "ORDER BY m.createdAt ASC")
    Page<Message> findConversation(Long userId1, Long userId2, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE " +
            "(m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
            "(m.senderId = :userId2 AND m.receiverId = :userId1) " +
            "ORDER BY m.createdAt DESC")
    Page<Message> findLatestConversationMessage(Long userId1, Long userId2, Pageable pageable);

    @Query(value = "SELECT partner_id FROM (" +
            "SELECT receiver_id AS partner_id, MAX(created_at) AS last_time FROM messages WHERE sender_id = :userId GROUP BY receiver_id " +
            "UNION ALL " +
            "SELECT sender_id AS partner_id, MAX(created_at) AS last_time FROM messages WHERE receiver_id = :userId GROUP BY sender_id" +
            ") AS conversations GROUP BY partner_id ORDER BY MAX(last_time) DESC", nativeQuery = true)
    List<Long> findConversationPartnerIds(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.senderId = :senderId AND m.receiverId = :receiverId AND m.isRead = false")
    void markConversationAsRead(Long senderId, Long receiverId);

    @Modifying
    @Query("DELETE FROM Message m WHERE m.senderId = :userId OR m.receiverId = :userId")
    void deleteByParticipantId(@Param("userId") Long userId);
}
