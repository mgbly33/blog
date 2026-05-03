package com.blog.repository;

import com.blog.entity.OperationLog;
import com.blog.entity.OperationLog.ActionType;
import com.blog.entity.OperationLog.TargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OperationLogRepository extends JpaRepository<OperationLog, Long> {

    /**
     * Find logs by operator ID with pagination
     */
    Page<OperationLog> findByOperatorIdOrderByCreatedAtDesc(Long operatorId, Pageable pageable);

    /**
     * Find logs by action type with pagination
     */
    Page<OperationLog> findByActionTypeOrderByCreatedAtDesc(ActionType actionType, Pageable pageable);

    /**
     * Find logs by target type with pagination
     */
    Page<OperationLog> findByTargetTypeOrderByCreatedAtDesc(TargetType targetType, Pageable pageable);

    /**
     * Find logs within date range with pagination
     */
    Page<OperationLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
        LocalDateTime start,
        LocalDateTime end,
        Pageable pageable
    );

    /**
     * Complex query with multiple filters
     */
    @Query("SELECT ol FROM OperationLog ol WHERE " +
           "(:operatorId IS NULL OR ol.operatorId = :operatorId) AND " +
           "(:actionType IS NULL OR ol.actionType = :actionType) AND " +
           "(:targetType IS NULL OR ol.targetType = :targetType) AND " +
           "(:startDate IS NULL OR ol.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR ol.createdAt <= :endDate) AND " +
           "(:success IS NULL OR ol.success = :success) " +
           "ORDER BY ol.createdAt DESC")
    Page<OperationLog> findByFilters(
        @Param("operatorId") Long operatorId,
        @Param("actionType") ActionType actionType,
        @Param("targetType") TargetType targetType,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("success") Boolean success,
        Pageable pageable
    );

    /**
     * Search logs by keyword in description or operator name
     */
    @Query("SELECT ol FROM OperationLog ol WHERE " +
           "LOWER(ol.operatorName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(ol.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(ol.targetName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY ol.createdAt DESC")
    Page<OperationLog> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Get recent logs for dashboard
     */
    List<OperationLog> findTop10ByOrderByCreatedAtDesc();

    /**
     * Count logs by action type
     */
    long countByActionType(ActionType actionType);

    /**
     * Count logs today
     */
    @Query("SELECT COUNT(ol) FROM OperationLog ol WHERE ol.createdAt >= :startOfDay")
    long countToday(@Param("startOfDay") LocalDateTime startOfDay);

    /**
     * Count failed operations
     */
    long countBySuccessFalse();
}
